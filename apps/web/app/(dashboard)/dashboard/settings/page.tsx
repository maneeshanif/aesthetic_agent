"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader } from "@/components/dashboard/page-header";
import { ErrorPanel, RoleDenied } from "@/components/dashboard/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { canManageKnowledge } from "@/lib/permissions";
import { ApiClientError } from "@/lib/api-client";
import { useApi, useResource } from "@/lib/use-api";
import { useAppStore } from "@/store/app-store";

const schema = z.object({
  name: z.string().min(1).max(120),
  timezone: z.string().min(1),
  booking_url: z
    .string()
    .trim()
    .refine((v) => v === "" || /^https?:\/\//.test(v), "Must start with http:// or https://"),
});
type Values = z.infer<typeof schema>;

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Asia/Dubai",
];

export default function SettingsPage() {
  const api = useApi();
  const spaId = useAppStore((s) => s.activeSpaId);
  const role = useAppStore((s) => s.activeRole);
  const [saving, setSaving] = useState(false);

  const tenant = useResource(() => api.getTenant(), [spaId], { enabled: Boolean(spaId) });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (tenant.data) {
      reset({
        name: tenant.data.name,
        timezone: tenant.data.timezone,
        booking_url: tenant.data.booking_url ?? "",
      });
    }
  }, [tenant.data, reset]);

  if (role && !canManageKnowledge(role)) {
    return (
      <div>
        <PageHeader title="Settings" />
        <RoleDenied what="workspace settings" />
      </div>
    );
  }

  async function onSubmit(values: Values) {
    setSaving(true);
    try {
      await api.updateTenant({
        name: values.name,
        timezone: values.timezone,
        booking_url: values.booking_url || null,
      });
      toast.success("Settings saved");
      tenant.refetch();
    } catch (e) {
      toast.error("Couldn't save", {
        description: e instanceof ApiClientError ? e.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="The booking link Vespera hands out, and how it reads the clock for after-hours reporting."
      />

      {tenant.loading ? (
        <Skeleton className="h-80 w-full rounded-card" />
      ) : tenant.error ? (
        <ErrorPanel error={tenant.error} onRetry={tenant.refetch} />
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>{tenant.data?.slug}.vespera.ai</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <FormField label="Studio name" htmlFor="name" error={errors.name?.message}>
                <Input id="name" {...register("name")} />
              </FormField>

              <FormField
                label="Public booking URL"
                htmlFor="booking_url"
                error={errors.booking_url?.message}
                hint="Your Boulevard, Zenoti, or NexHealth scheduling link."
              >
                <Input id="booking_url" placeholder="https://…" {...register("booking_url")} />
              </FormField>

              <FormField label="Time zone" htmlFor="timezone" error={errors.timezone?.message}>
                <select
                  id="timezone"
                  className="flex h-11 w-full rounded-md border border-stroke bg-pearl/70 px-3.5 text-sm text-espresso focus-visible:border-champagne/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/25"
                  {...register("timezone")}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </FormField>

              <div className="flex justify-end">
                <Button type="submit" variant="champagne" disabled={saving || !isDirty}>
                  {saving ? "Saving…" : "Save settings"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
