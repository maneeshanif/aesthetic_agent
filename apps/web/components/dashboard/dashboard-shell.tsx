"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { VesperaMark } from "@/components/brand/logo";
import { PRIMARY_NAV, SECONDARY_NAV, visibleFor } from "@/components/dashboard/nav-config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { useAppStore } from "@/store/app-store";

function BreadcrumbLabel({ pathname }: { pathname: string }) {
  const map: Record<string, string> = {
    "/dashboard": "Overview",
    "/dashboard/patients": "Patients",
    "/dashboard/chat-tester": "Simulator",
    "/dashboard/settings": "Settings",
    "/dashboard/settings/knowledge": "Knowledge base",
    "/dashboard/team": "Team",
  };
  return <span className="font-display text-lg text-espresso">{map[pathname] ?? "Dashboard"}</span>;
}

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

  // Bind the active workspace from the verified server memberships.
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

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-stroke/70 bg-elevated/40 backdrop-blur-glass transition-[width] duration-300 lg:flex",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <div className="flex h-16 items-center gap-2.5 px-5">
          <VesperaMark />
          {!collapsed && (
            <span className="font-display text-lg tracking-tight text-espresso">Vespera</span>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {primary.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
          ))}

          {secondary.length > 0 && (
            <div className="pt-5">
              {!collapsed && (
                <p className="px-3 pb-2 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-slate/70">
                  Configure
                </p>
              )}
              {secondary.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
              ))}
            </div>
          )}
        </nav>

        <div className="border-t border-stroke/70 p-3">
          <button
            onClick={toggleSidebar}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-slate transition-colors hover:bg-elevated hover:text-espresso"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                Collapse
              </>
            )}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-stroke/70 bg-canvas/80 px-6 backdrop-blur-glass">
          <div className="flex items-center gap-2 text-slate">
            <span className="text-sm">Studio</span>
            <span className="text-stroke">/</span>
            <BreadcrumbLabel pathname={pathname} />
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-pill border border-stroke bg-pearl/60 px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-slate sm:inline">
              {activeRole ? ROLE_LABEL[activeRole] : "—"}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-pill border border-stroke bg-pearl/60 py-1 pl-1 pr-2.5 transition-colors hover:border-champagne/40">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>{initials(email ?? "VA")}</AvatarFallback>
                  </Avatar>
                  <ChevronsUpDown className="h-3.5 w-3.5 text-slate" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[13rem]">
                <DropdownMenuLabel>{email ?? "Signed in"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Account settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={signOut} className="text-terracotta">
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function NavLink({
  item,
  pathname,
  collapsed,
}: {
  item: (typeof PRIMARY_NAV)[number];
  pathname: string;
  collapsed: boolean;
}) {
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-pearl text-espresso shadow-sm"
          : "text-slate hover:bg-elevated hover:text-espresso",
      )}
    >
      <item.icon className={cn("h-4 w-4 shrink-0", active && "text-champagne")} strokeWidth={1.75} />
      {!collapsed && item.label}
    </Link>
  );
}
