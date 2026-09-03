import type { Role } from "@/lib/types";

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  manager: "Manager",
  front_desk: "Front Desk",
};

export function canManageKnowledge(role: Role | null | undefined) {
  return role === "owner" || role === "manager";
}
export function canManageTeam(role: Role | null | undefined) {
  return role === "owner";
}
export function canEditPatients(role: Role | null | undefined) {
  return role === "owner" || role === "manager";
}
