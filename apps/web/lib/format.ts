import type { Channel, KnowledgeStatus, PatientStatus } from "@/lib/types";

export function currency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function clockTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function initials(name: string | null | undefined, fallback = "VA"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || fallback;
}

type Tone = "neutral" | "champagne" | "sage" | "terracotta" | "outline";

export const PATIENT_STATUS_META: Record<PatientStatus, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "outline" },
  qualifying: { label: "Qualifying", tone: "champagne" },
  medically_cleared: { label: "Medically cleared", tone: "sage" },
  contraindication_flagged: { label: "Contraindication", tone: "terracotta" },
  booked: { label: "Booked", tone: "sage" },
  abandoned: { label: "Abandoned", tone: "neutral" },
};

export const KNOWLEDGE_STATUS_META: Record<KnowledgeStatus, { label: string; tone: Tone }> = {
  uploaded: { label: "Uploaded", tone: "outline" },
  chunking: { label: "Chunking", tone: "champagne" },
  embedded: { label: "Embedded", tone: "sage" },
  failed: { label: "Failed", tone: "terracotta" },
};

export const CHANNEL_LABEL: Record<Channel, string> = {
  chat_tester: "Simulator",
  instagram: "Instagram",
  web: "Web",
  voice: "Voice",
};
