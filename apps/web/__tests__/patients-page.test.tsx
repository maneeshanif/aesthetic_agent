import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Paginated, Patient, PatientDetail } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const patient: Patient = {
  id: "p-1",
  spa_id: "spa-1",
  full_name: "Elena Rostova",
  phone: "5551112222",
  email: null,
  instagram_handle: null,
  channel: "chat_tester",
  requested_treatment: "Profhilo",
  status: "qualifying",
  medical_flags: [],
  estimated_value: 950,
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const page: Paginated<Patient> = { items: [patient], total: 1, limit: 12, offset: 0 };
const detail: PatientDetail = { ...patient, sessions: [] };

const mockApi = {
  listPatients: vi.fn().mockResolvedValue(page),
  getPatient: vi.fn().mockResolvedValue(detail),
  updatePatient: vi.fn().mockResolvedValue(patient),
};

vi.mock("@/lib/use-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/use-api")>();
  return { ...actual, useApi: () => mockApi };
});

import PatientsPage from "@/app/(dashboard)/dashboard/patients/page";

beforeEach(() => {
  mockApi.listPatients.mockClear();
  mockApi.getPatient.mockClear();
  useAppStore.setState({ activeSpaId: "spa-1", activeRole: "owner" });
});
afterEach(() => vi.clearAllMocks());

describe("PatientsPage", () => {
  it("renders leads returned by the API", async () => {
    render(<PatientsPage />);
    expect(await screen.findByText("Elena Rostova")).toBeInTheDocument();
    expect(screen.getByText("Profhilo")).toBeInTheDocument();
    expect(screen.getByText("1 lead")).toBeInTheDocument();
  });

  it("re-queries with a status filter when a chip is clicked", async () => {
    render(<PatientsPage />);
    await screen.findByText("Elena Rostova");

    await userEvent.click(screen.getByRole("button", { name: "Booked" }));

    await waitFor(() =>
      expect(mockApi.listPatients).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: "booked" }),
      ),
    );
  });

  it("opens the detail dialog for a row", async () => {
    render(<PatientsPage />);
    await userEvent.click(await screen.findByText("Elena Rostova"));
    await waitFor(() => expect(mockApi.getPatient).toHaveBeenCalledWith("p-1"));
    expect(await screen.findByText("Conversations (0)")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
