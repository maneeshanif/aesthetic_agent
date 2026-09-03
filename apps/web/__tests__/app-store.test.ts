import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "@/store/app-store";

beforeEach(() => {
  useAppStore.setState({
    activeSpaId: null,
    activeRole: null,
    simulatorLogs: [],
    sidebarCollapsed: false,
  });
});

describe("useAppStore", () => {
  it("sets the active workspace + role", () => {
    useAppStore.getState().setActiveSpa("spa-1", "manager");
    expect(useAppStore.getState().activeSpaId).toBe("spa-1");
    expect(useAppStore.getState().activeRole).toBe("manager");
  });

  it("prepends simulator logs, assigns ids, and caps at 60", () => {
    const { addSimulatorLog } = useAppStore.getState();
    for (let i = 0; i < 65; i++) {
      addSimulatorLog({ agent: "single_worker_triage", action: "collect_info", timestamp: `t${i}` });
    }
    const logs = useAppStore.getState().simulatorLogs;
    expect(logs).toHaveLength(60);
    expect(logs[0].timestamp).toBe("t64");
    expect(logs[0].id).toBeTruthy();
  });

  it("clears logs and toggles the sidebar", () => {
    useAppStore.getState().addSimulatorLog({ agent: "a", action: "b", timestamp: "t" });
    useAppStore.getState().clearLogs();
    expect(useAppStore.getState().simulatorLogs).toHaveLength(0);

    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().sidebarCollapsed).toBe(true);
  });
});
