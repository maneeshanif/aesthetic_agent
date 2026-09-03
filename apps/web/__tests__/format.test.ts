import { describe, expect, it, vi, afterEach } from "vitest";
import {
  CHANNEL_LABEL,
  PATIENT_STATUS_META,
  currency,
  initials,
  percent,
  relativeTime,
} from "@/lib/format";

afterEach(() => vi.useRealTimers());

describe("currency", () => {
  it("formats whole dollars and handles null", () => {
    expect(currency(1250)).toBe("$1,250");
    expect(currency(null)).toBe("—");
  });
});

describe("percent", () => {
  it("rounds a 0-1 ratio to a whole percent", () => {
    expect(percent(0.333)).toBe("33%");
    expect(percent(0)).toBe("0%");
  });
});

describe("relativeTime", () => {
  it("bucketises recent timestamps", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-02T12:00:00Z"));
    expect(relativeTime(new Date("2026-03-02T11:30:00Z").toISOString())).toBe("30m ago");
    expect(relativeTime(new Date("2026-03-02T09:00:00Z").toISOString())).toBe("3h ago");
    expect(relativeTime(null)).toBe("—");
  });
});

describe("initials", () => {
  it("takes up to two initials, else a fallback", () => {
    expect(initials("Elena Rostova")).toBe("ER");
    expect(initials("cher")).toBe("C");
    expect(initials(null)).toBe("VA");
  });
});

describe("status metadata", () => {
  it("maps every patient status to a label + tone", () => {
    expect(PATIENT_STATUS_META.contraindication_flagged).toEqual({
      label: "Contraindication",
      tone: "terracotta",
    });
    expect(CHANNEL_LABEL.chat_tester).toBe("Simulator");
  });
});
