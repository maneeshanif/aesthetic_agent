"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/lib/types";

export interface SimulatorLog {
  id: string;
  agent: string;
  action: string;
  timestamp: string;
  detail?: string;
}

interface AppState {
  // Tenant & context
  activeSpaId: string | null;
  activeRole: Role | null;
  setActiveSpa: (id: string, role: Role) => void;
  clearActiveSpa: () => void;

  // Chat-tester simulator
  simulatorLogs: SimulatorLog[];
  addSimulatorLog: (log: Omit<SimulatorLog, "id">) => void;
  clearLogs: () => void;

  // Shell UI
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeSpaId: null,
      activeRole: null,
      setActiveSpa: (id, role) => set({ activeSpaId: id, activeRole: role }),
      clearActiveSpa: () => set({ activeSpaId: null, activeRole: null }),

      simulatorLogs: [],
      addSimulatorLog: (log) =>
        set((state) => ({
          simulatorLogs: [
            { ...log, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
            ...state.simulatorLogs,
          ].slice(0, 60),
        })),
      clearLogs: () => set({ simulatorLogs: [] }),

      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: "vespera-app",
      partialize: (s) => ({
        activeSpaId: s.activeSpaId,
        activeRole: s.activeRole,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    },
  ),
);
