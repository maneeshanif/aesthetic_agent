import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PatientStatusBadge } from "@/components/domain/status-badge";

describe("Button", () => {
  it("fires onClick and respects disabled", async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledOnce();

    rerender(
      <Button onClick={onClick} disabled>
        Go
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders as a child anchor with asChild", () => {
    render(
      <Button asChild>
        <a href="/x">Link</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Link" })).toHaveAttribute("href", "/x");
  });
});

describe("EmptyState", () => {
  it("renders title, description and action", () => {
    render(
      <EmptyState
        icon={Sparkles}
        title="No leads yet"
        description="Run a conversation"
        action={<button>Open</button>}
      />,
    );
    expect(screen.getByText("No leads yet")).toBeInTheDocument();
    expect(screen.getByText("Run a conversation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
  });
});

describe("PatientStatusBadge", () => {
  it("shows the human label for a status", () => {
    render(<PatientStatusBadge status="medically_cleared" />);
    expect(screen.getByText("Medically cleared")).toBeInTheDocument();
  });
});
