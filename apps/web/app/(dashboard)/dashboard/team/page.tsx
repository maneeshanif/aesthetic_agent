"use client";

import { useState } from "react";
import { Mail, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ErrorPanel, RoleDenied, TableSkeleton } from "@/components/dashboard/states";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { ROLE_LABEL, canManageTeam } from "@/lib/permissions";
import { ApiClientError } from "@/lib/api-client";
import { initials } from "@/lib/format";
import type { Role } from "@/lib/types";
import { useApi, useResource } from "@/lib/use-api";
import { useAppStore } from "@/store/app-store";

const ROLES: Role[] = ["owner", "manager", "front_desk"];

export default function TeamPage() {
  const api = useApi();
  const spaId = useAppStore((s) => s.activeSpaId);
  const role = useAppStore((s) => s.activeRole);

  const members = useResource(() => api.listMembers(), [spaId], { enabled: Boolean(spaId) });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("front_desk");
  const [busy, setBusy] = useState(false);

  if (role && !canManageTeam(role)) {
    return (
      <div>
        <PageHeader title="Team" />
        <RoleDenied what="team management" />
      </div>
    );
  }

  async function invite() {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Enter a valid email");
      return;
    }
    setBusy(true);
    try {
      await api.inviteMember({ email, role: inviteRole });
      toast.success("Invitation sent", { description: email });
      setEmail("");
      setInviteOpen(false);
      members.refetch();
    } catch (e) {
      toast.error("Couldn't invite", {
        description: e instanceof ApiClientError ? e.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(id: string, next: Role) {
    try {
      await api.updateMember(id, { role: next });
      toast.success("Role updated");
      members.refetch();
    } catch (e) {
      toast.error("Couldn't update role", {
        description: e instanceof ApiClientError ? e.message : undefined,
      });
      members.refetch();
    }
  }

  async function removeMember(id: string) {
    try {
      await api.removeMember(id);
      toast.success("Member removed");
      members.refetch();
    } catch (e) {
      toast.error("Couldn't remove", {
        description: e instanceof ApiClientError ? e.message : undefined,
      });
    }
  }

  return (
    <div>
      <PageHeader
        title="Team"
        description="Invite your front desk and managers. Roles decide who can change the knowledge base and settings."
        action={
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button variant="champagne" size="sm">
                <UserPlus className="h-3.5 w-3.5" />
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Invite a teammate</DialogTitle>
              </DialogHeader>
              <FormField label="Email" htmlFor="invite-email">
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="desk@yourclinic.com"
                />
              </FormField>
              <FormField label="Role" htmlFor="invite-role">
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className="flex h-11 w-full rounded-md border border-stroke bg-pearl/70 px-3.5 text-sm text-espresso focus-visible:border-champagne/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/25"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
              </FormField>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button variant="champagne" onClick={invite} disabled={busy}>
                  {busy ? "Sending…" : "Send invite"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {members.loading ? (
        <TableSkeleton rows={4} />
      ) : members.error ? (
        <ErrorPanel error={members.error} onRetry={members.refetch} />
      ) : (
        <ul className="space-y-2.5">
          {members.data?.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-4 rounded-card border border-stroke bg-pearl/70 px-5 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar>
                  <AvatarFallback>{initials(m.invited_email ?? "VA")}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-espresso">
                    {m.invited_email ?? m.user_id.slice(0, 8)}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-slate">
                    {m.status === "invited" ? (
                      <>
                        <Mail className="h-3 w-3" /> Invitation pending
                      </>
                    ) : (
                      <span className="capitalize">{m.status}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {m.status === "invited" && <Badge tone="champagne">Invited</Badge>}
                <select
                  value={m.role}
                  onChange={(e) => changeRole(m.id, e.target.value as Role)}
                  className="h-9 rounded-md border border-stroke bg-pearl/70 px-2.5 text-xs text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/25"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
                <Button variant="ghost" size="sm" onClick={() => removeMember(m.id)}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
