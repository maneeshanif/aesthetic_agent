"""Single-worker triage agent (Phase 1).

Retrieves tenant pricing/safety rules (passed in), asks Gemini 2.0 Flash for a
structured decision, then applies a deterministic red-flag safety net before
deciding whether to hand out the booking link.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import Any, Literal, Protocol

Decision = Literal["book", "collect_info", "contraindicated"]

# Hard contraindication terms — if the patient volunteers one, we never auto-book,
# regardless of the model's decision. Kept small + auditable; the RAG rulebook is
# the primary source of nuance. This is a coarse keyword backstop: it can over-flag
# (e.g. "not pregnant") — flagged leads are surfaced to a clinician, never dropped.
HARD_CONTRAINDICATION_TERMS = {
    "accutane": "Isotretinoin (Accutane) use",
    "isotretinoin": "Isotretinoin (Accutane) use",
    "pregnant": "Pregnancy",
    "pregnancy": "Pregnancy",
    "breastfeeding": "Breastfeeding",
    "active tan": "Active tan / recent sun exposure",
    "sunburn": "Active sunburn",
}


@dataclass
class TriageInput:
    message: str
    history: list[dict[str, Any]]
    retrieved: list[dict[str, Any]]
    booking_url: str | None
    spa_name: str


@dataclass
class TriageDecision:
    reply: str
    decision: Decision
    medical_flags: list[dict[str, Any]] = field(default_factory=list)
    requested_treatment: str | None = None
    estimated_value: float | None = None


class LLM(Protocol):
    async def generate_json(self, system: str, user: str) -> dict[str, Any]: ...


class GeminiLLM:
    def __init__(self, api_key: str, model: str):
        self._api_key = api_key
        self._model = model

    async def generate_json(self, system: str, user: str) -> dict[str, Any]:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=self._api_key)
        resp = client.models.generate_content(
            model=self._model,
            contents=user,
            config=types.GenerateContentConfig(
                system_instruction=system,
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        return json.loads(resp.text)


SYSTEM_PROMPT = """You are Vespera, the after-hours clinical concierge for {spa_name}, a medical spa.
Your job: qualify aesthetic-treatment leads, enforce the clinic's safety rules, and — only when
the lead is medically appropriate — hand them the booking link.

Rules:
- Use ONLY the clinic rules provided in CONTEXT for pricing and contraindications. If context is
  missing, ask a clarifying question instead of guessing.
- If the patient mentions anything that the rules flag as a contraindication, do NOT offer booking.
  Explain kindly and suggest they speak with the clinic.
- Keep replies short, warm, and concierge-grade. No medical advice beyond the rulebook.

Respond with JSON only:
{
  "reply": "<message to the patient>",
  "decision": "book" | "collect_info" | "contraindicated",
  "medical_flags": [{"rule": "<short name>", "detail": "<why>"}],
  "requested_treatment": "<treatment or null>",
  "estimated_value": <number or null>
}"""


def build_prompt(inp: TriageInput) -> tuple[str, str]:
    system = SYSTEM_PROMPT.replace("{spa_name}", inp.spa_name)
    context_lines = [
        f"[{i + 1}] (source: {c.get('source', '?')}, score: {c.get('score', 0):.2f})\n{c.get('text', '')}"
        for i, c in enumerate(inp.retrieved)
    ]
    context = "\n\n".join(context_lines) if context_lines else "(no clinic rules retrieved)"
    history = "\n".join(
        f"{m.get('role', 'user')}: {m.get('content', '')}" for m in inp.history[-8:]
    )
    booking = inp.booking_url or "(no booking URL configured — do not promise a link)"
    user = (
        f"CONTEXT (clinic rules):\n{context}\n\n"
        f"CONVERSATION SO FAR:\n{history or '(none)'}\n\n"
        f"BOOKING URL: {booking}\n\n"
        f"NEW PATIENT MESSAGE:\n{inp.message}"
    )
    return system, user


def _safety_net(message: str, decision: TriageDecision) -> TriageDecision:
    lowered = message.lower()
    seen = {f.get("rule", "").lower() for f in decision.medical_flags}
    for term, label in HARD_CONTRAINDICATION_TERMS.items():
        if re.search(rf"\b{re.escape(term)}\b", lowered) and label.lower() not in seen:
            decision.medical_flags.append(
                {"rule": label, "detail": f"Patient mentioned '{term}'."}
            )
    if decision.medical_flags and decision.decision == "book":
        decision.decision = "contraindicated"
    return decision


class TriageAgent:
    def __init__(self, llm: LLM):
        self._llm = llm

    @classmethod
    def from_settings(cls) -> TriageAgent:
        from app.core.settings import get_settings

        s = get_settings()
        return cls(GeminiLLM(s.gemini_api_key, s.gemini_model))

    async def run(self, inp: TriageInput) -> TriageDecision:
        system, user = build_prompt(inp)
        raw = await self._llm.generate_json(system, user)

        decision = TriageDecision(
            reply=str(raw.get("reply", "")).strip()
            or "Thanks for reaching out — could you tell me a bit more about what you're interested in?",
            decision=raw.get("decision", "collect_info"),
            medical_flags=list(raw.get("medical_flags") or []),
            requested_treatment=raw.get("requested_treatment"),
            estimated_value=_coerce_float(raw.get("estimated_value")),
        )
        if decision.decision not in ("book", "collect_info", "contraindicated"):
            decision.decision = "collect_info"
        return _safety_net(inp.message, decision)


def _coerce_float(value: Any) -> float | None:
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError):
        return None
