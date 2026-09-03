import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
const refresh = vi.fn();
const signInWithPassword = vi.fn().mockResolvedValue({ error: null });

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams(""),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithPassword } }),
}));
vi.mock("@/components/ui/toaster", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import LoginPage from "@/app/(auth)/login/page";

beforeEach(() => {
  push.mockClear();
  signInWithPassword.mockClear();
});
afterEach(() => vi.clearAllMocks());

describe("LoginForm", () => {
  it("validates required fields before submitting", async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Enter a valid email")).toBeInTheDocument();
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("signs in and routes to the dashboard on success", async () => {
    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText("Email"), "owner@clinic.com");
    await userEvent.type(screen.getByLabelText("Password"), "hunter2hunter");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: "owner@clinic.com",
        password: "hunter2hunter",
      }),
    );
    expect(push).toHaveBeenCalledWith("/dashboard");
  });
});
