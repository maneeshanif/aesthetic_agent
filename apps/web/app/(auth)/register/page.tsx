"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { createApi } from "@/lib/api";
import { ApiClientError } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const accountSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });
type AccountValues = z.infer<typeof accountSchema>;

const spaSchema = z.object({
  name: z.string().min(2, "Name your studio").max(120),
  slug: z
    .string()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and dashes only"),
  timezone: z.string().min(1),
});
type SpaValues = z.infer<typeof spaSchema>;

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Asia/Dubai",
];

const STEPS = ["Account", "Your studio", "Done"];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const accountForm = useForm<AccountValues>({ resolver: zodResolver(accountSchema) });
  const spaForm = useForm<SpaValues>({
    resolver: zodResolver(spaSchema),
    defaultValues: { timezone: "America/New_York" },
  });

  async function onAccount(values: AccountValues) {
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't create your account", { description: error.message });
      return;
    }
    if (!spaForm.getValues("slug")) {
      spaForm.setValue(
        "slug",
        values.email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .slice(0, 24),
      );
    }
    setStep(1);
  }

  async function onSpa(values: SpaValues) {
    setSubmitting(true);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setSubmitting(false);
      toast.error("Session expired", { description: "Please sign in again." });
      router.push("/login");
      return;
    }
    try {
      const api = createApi(session.access_token, null);
      await api.createTenant(values);
      await supabase.auth.refreshSession();
      setStep(2);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1100);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Something went wrong. Try again.";
      toast.error("Couldn't create your workspace", { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <ol className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-pill border text-[0.7rem] font-medium transition-colors",
                i < step && "border-sage/40 bg-sage/15 text-sage",
                i === step && "border-champagne/50 bg-champagne/15 text-[#a9763f]",
                i > step && "border-stroke text-slate",
              )}
            >
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span className={cn("text-xs", i === step ? "text-espresso" : "text-slate")}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-stroke" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <>
          <h1 className="font-display text-3xl text-espresso">Create your account</h1>
          <p className="mt-2 text-sm text-slate">Two minutes to your first triage.</p>
          <form onSubmit={accountForm.handleSubmit(onAccount)} className="mt-8 space-y-5">
            <FormField label="Work email" htmlFor="email" error={accountForm.formState.errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...accountForm.register("email")} />
            </FormField>
            <FormField
              label="Password"
              htmlFor="password"
              error={accountForm.formState.errors.password?.message}
            >
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...accountForm.register("password")}
              />
            </FormField>
            <FormField
              label="Confirm password"
              htmlFor="confirm"
              error={accountForm.formState.errors.confirm?.message}
            >
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                {...accountForm.register("confirm")}
              />
            </FormField>
            <Button
              type="submit"
              size="lg"
              variant="champagne"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? "Creating…" : "Continue"}
            </Button>
          </form>
        </>
      )}

      {step === 1 && (
        <>
          <h1 className="font-display text-3xl text-espresso">Name your studio</h1>
          <p className="mt-2 text-sm text-slate">This becomes your tenant workspace.</p>
          <form onSubmit={spaForm.handleSubmit(onSpa)} className="mt-8 space-y-5">
            <FormField label="Studio name" htmlFor="name" error={spaForm.formState.errors.name?.message}>
              <Input id="name" placeholder="Sterling Aesthetics" {...spaForm.register("name")} />
            </FormField>
            <FormField
              label="Workspace URL"
              htmlFor="slug"
              error={spaForm.formState.errors.slug?.message}
              hint="vespera.ai/…"
            >
              <Input id="slug" placeholder="sterling" {...spaForm.register("slug")} />
            </FormField>
            <FormField
              label="Time zone"
              htmlFor="timezone"
              error={spaForm.formState.errors.timezone?.message}
            >
              <select
                id="timezone"
                className="flex h-11 w-full rounded-md border border-stroke bg-pearl/70 px-3.5 text-sm text-espresso focus-visible:border-champagne/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/25"
                {...spaForm.register("timezone")}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace("_", " ")}
                  </option>
                ))}
              </select>
            </FormField>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button
                type="submit"
                size="lg"
                variant="champagne"
                className="flex-1"
                disabled={submitting}
              >
                {submitting ? "Creating workspace…" : "Create workspace"}
              </Button>
            </div>
          </form>
        </>
      )}

      {step === 2 && (
        <div className="flex flex-col items-center py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-pill border border-sage/40 bg-sage/15">
            <Check className="h-6 w-6 text-sage" />
          </span>
          <h1 className="mt-6 font-display text-3xl text-espresso">You're in.</h1>
          <p className="mt-2 text-sm text-slate">Taking you to your dashboard…</p>
        </div>
      )}

      <p className="mt-6 text-sm text-slate">
        Already have a workspace?{" "}
        <Link href="/login" className="text-champagne hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
