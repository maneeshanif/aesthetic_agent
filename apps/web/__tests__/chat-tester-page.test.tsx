import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ChatResponse } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const response: ChatResponse = {
  session_id: "s-1",
  reply: "Botox is $12 per unit — want me to hold a slot?",
  status: "qualifying",
  patient_status: "qualifying",
  booking_url: null,
  medical_flags: [],
  reasoning: [
    {
      step: 1,
      agent: "single_worker_triage",
      action: "collect_info",
      retrieved: [
        { chunk_id: "c1", score: 0.91, source: "menu.pdf", text: "Botox is $12 per unit." },
      ],
      rules_enforced: [],
      ts: new Date().toISOString(),
    },
  ],
  patient_id: null,
};

const mockApi = { chat: vi.fn().mockResolvedValue(response) };

vi.mock("@/lib/use-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/use-api")>();
  return { ...actual, useApi: () => mockApi };
});
vi.mock("@/components/ui/toaster", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import ChatTesterPage from "@/app/(dashboard)/dashboard/chat-tester/page";

beforeEach(() => {
  mockApi.chat.mockClear();
  useAppStore.setState({ activeSpaId: "spa-1", activeRole: "owner", simulatorLogs: [] });
});
afterEach(() => vi.clearAllMocks());

describe("ChatTesterPage", () => {
  it("sends a message and renders the reply + retrieval trace", async () => {
    render(<ChatTesterPage />);

    await userEvent.type(
      screen.getByPlaceholderText("Message as a patient…"),
      "How much is Botox?",
    );
    await userEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => expect(mockApi.chat).toHaveBeenCalledOnce());
    expect(mockApi.chat).toHaveBeenCalledWith({ message: "How much is Botox?", session_id: undefined });

    expect(
      await screen.findByText("Botox is $12 per unit — want me to hold a slot?"),
    ).toBeInTheDocument();
    // reasoning inspector picked up the retrieved chunk
    expect(await screen.findByText("menu.pdf")).toBeInTheDocument();
    expect(screen.getByText("Botox is $12 per unit.")).toBeInTheDocument();
    expect(screen.getByText("0.91")).toBeInTheDocument();
    // simulator logs recorded
    expect(useAppStore.getState().simulatorLogs).toHaveLength(1);
  });

  it("reuses the returned session id on the next turn", async () => {
    render(<ChatTesterPage />);
    const input = screen.getByPlaceholderText("Message as a patient…");

    await userEvent.type(input, "first");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(mockApi.chat).toHaveBeenCalledTimes(1));

    await userEvent.type(input, "second");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(mockApi.chat).toHaveBeenCalledTimes(2));
    expect(mockApi.chat).toHaveBeenLastCalledWith({ message: "second", session_id: "s-1" });
  });
});
