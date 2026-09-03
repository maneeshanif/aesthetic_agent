"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, PanelLeft } from "lucide-react";
import { VesperaMark } from "@/components/brand/logo";
import { PRIMARY_NAV, SECONDARY_NAV, visibleFor } from "@/components/dashboard/nav-config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABEL } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/format";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/patients": "Patients",
  "/dashboard/chat-tester": "Simulator",
  "/dashboard/settings": "Settings",
  "/dashboard/settings/knowledge": "Knowledge base",
  "/dashboard/team": "Team",
};

export function DashboardShell({
  children,
  email,
  spaIds,
  memberships,
}: {
  children: React.ReactNode;
  email: string | null;
  spaIds: string[];
  memberships: Record<string, Role>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const activeSpaId = useAppStore((s) => s.activeSpaId);
  const activeRole = useAppStore((s) => s.activeRole);
  const setActiveSpa = useAppStore((s) => s.setActiveSpa);
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  useEffect(() => {
    const valid = activeSpaId && spaIds.includes(activeSpaId);
    if (!valid && spaIds[0]) setActiveSpa(spaIds[0], memberships[spaIds[0]]);
    else if (valid && memberships[activeSpaId] && memberships[activeSpaId] !== activeRole) {
      setActiveSpa(activeSpaId, memberships[activeSpaId]);
    }
  }, [activeSpaId, activeRole, spaIds, memberships, setActiveSpa]);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const primary = visibleFor(PRIMARY_NAV, activeRole);
  const secondary = visibleFor(SECONDARY_NAV, activeRole);
  const title = TITLES[pathname] ?? "Dashboard";

  return (
    <div className="flex min-h-[100dvh] bg-canvas">
      <aside
        className={cn(
          "sticky top-0 hidden h-[100dvh] shrink-0 flex-col border-r border-hairline bg-ink transition-[width] duration-300 lg:flex",
          collapsed ? "w-[72px]" : "w-60",
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-hairline px-5">
          <VesperaMark />
          {!collapsed && (
            <span className="font-display text-lg font-semibold tracking-editorial text-espresso">
              Vespera
            </span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-5">
          <NavGroup label={collapsed ? null : "Workspace"} items={primary} pathname={pathname} collapsed={collapsed} />
          {secondary.length > 0 && (
            <div className="mt-6">
              <NavGroup
                label={collapsed ? null : "Configure"}
                items={secondary}
                pathname={pathname}
                collapsed={collapsed}
              />
            </div>
          )}
        </nav>

        <button
          onClick={toggleSidebar}
          className="flex items-center gap-2.5 border-t border-hairline px-5 py-3.5 text-xs text-faint transition-colors hover:text-espresso"
        >
          <PanelLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          {!collapsed && "Collapse"}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-hairline bg-canvas/80 px-6 backdrop-blur-glass">
          <div className="flex items-baseline gap-2.5">
            <span className="text-sm text-faint">Studio</span>
            <span className="text-faint">/</span>
            <h1 className="font-display text-lg font-semibold leading-none text-espresso">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-pill border border-stroke px-2.5 py-1 text-xs text-slate sm:inline">
              {activeRole ? ROLE_LABEL[activeRole] : "—"}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-pill border border-stroke bg-elevated py-1 pl-1 pr-2 transition-colors hover:border-champagne/40">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>{initials(email ?? "VA")}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-3.5 w-3.5 text-slate" strokeWidth={1.75} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[13rem]">
                <DropdownMenuLabel>{email ?? "Signed in"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Account settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={signOut} className="text-terracotta">
                  <LogOut className="h-4 w-4" strokeWidth={1.75} />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-6 py-9">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function NavGroup({
  label,
  items,
  pathname,
  collapsed,
}: {
  label: string | null;
  items: typeof PRIMARY_NAV;
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <div>
      {label && (
        <p className="px-5 pb-2 text-[0.7rem] uppercase tracking-[0.08em] text-faint">{label}</p>
      )}
      <ul>
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "relative flex items-center gap-3 px-5 py-2.5 text-sm transition-colors",
                  active ? "text-espresso" : "text-slate hover:bg-elevated hover:text-espresso",
                )}
              >
                {active && <span className="absolute left-0 top-1.5 h-[calc(100%-0.75rem)] w-[2px] rounded-full bg-champagne" />}
                <item.icon
                  className={cn("h-4 w-4 shrink-0", active ? "text-champagne" : "text-slate")}
                  strokeWidth={1.75}
                />
                {!collapsed && item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
