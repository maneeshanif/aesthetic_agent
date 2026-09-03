import {
  LayoutGrid,
  Users,
  MessagesSquare,
  BookOpen,
  Settings,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  exact?: boolean;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid, roles: ["owner", "manager", "front_desk"], exact: true },
  { href: "/dashboard/patients", label: "Patients", icon: Users, roles: ["owner", "manager", "front_desk"] },
  { href: "/dashboard/chat-tester", label: "Simulator", icon: MessagesSquare, roles: ["owner", "manager", "front_desk"] },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/dashboard/settings/knowledge", label: "Knowledge base", icon: BookOpen, roles: ["owner", "manager"] },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["owner", "manager"], exact: true },
  { href: "/dashboard/team", label: "Team", icon: UserPlus, roles: ["owner"] },
];

export function visibleFor(items: NavItem[], role: Role | null): NavItem[] {
  if (!role) return [];
  return items.filter((i) => i.roles.includes(role));
}
