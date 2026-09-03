"""Triage agent: prompt assembly, response parsing, red-flag safety net."""

from __future__ import annotations

import pytest

from app.services.ai_service import TriageAgent, TriageInput, build_prompt


class StubLLM:
    def __init__(self, payload: dict):
        self.payload = payload
        self.system: str | None = None
        self.user: str | None = None

    async def generate_json(self, system: str, user: str) -> dict:
        self.system, self.user = system, user
        return self.payload


def _input(message: str, **kw) -> TriageInput:
    return TriageInput(
        message=message,
        history=kw.get("history", []),
        retrieved=kw.get(
            "retrieved",
            [{"source": "menu.pdf", "score": 0.91, "text": "Botox is $12/unit. Avoid if pregnant."}],
        ),
        booking_url=kw.get("booking_url", "https://book.example.com"),
        spa_name=kw.get("spa_name", "Sterling Aesthetics"),
    )


def test_build_prompt_includes_context_and_booking_url() -> None:
    system, user = build_prompt(_input("How much is Botox?"))
    assert "Sterling Aesthetics" in system
    assert "Botox is $12/unit" in user
    assert "https://book.example.com" in user
    assert "How much is Botox?" in user


@pytest.mark.asyncio
async def test_run_parses_book_decision() -> None:
    agent = TriageAgent(
        StubLLM(
            {
                "reply": "You're all set — here's the link.",
                "decision": "book",
                "medical_flags": [],
                "requested_treatment": "Botox",
                "estimated_value": "480",
            }
        )
    )
    out = await agent.run(_input("I'd like Botox, I take no medications."))
    assert out.decision == "book"
    assert out.requested_treatment == "Botox"
    assert out.estimated_value == 480.0
    assert out.medical_flags == []


@pytest.mark.asyncio
async def test_safety_net_overrides_book_when_hard_contraindication_present() -> None:
    agent = TriageAgent(
        StubLLM({"reply": "Great, booking you in!", "decision": "book", "medical_flags": []})
    )
    out = await agent.run(_input("I'm currently on Accutane, can I get a peel?"))
    assert out.decision == "contraindicated"
    assert any("Accutane" in f["rule"] for f in out.medical_flags)


@pytest.mark.asyncio
async def test_invalid_decision_is_coerced() -> None:
    agent = TriageAgent(StubLLM({"reply": "Tell me more.", "decision": "banana"}))
    out = await agent.run(_input("hi"))
    assert out.decision == "collect_info"


@pytest.mark.asyncio
async def test_model_flags_alone_block_booking() -> None:
    agent = TriageAgent(
        StubLLM(
            {
                "reply": "Let's check with the clinic.",
                "decision": "book",
                "medical_flags": [{"rule": "Recent filler", "detail": "within 2 weeks"}],
            }
        )
    )
    out = await agent.run(_input("I had filler last week"))
    assert out.decision == "contraindicated"
