"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ProfileFormProps = {
  initialEmail: string;
  initialFullName: string | null;
  initialPhone: string | null;
  initialDefaultAddress: string | null;
};

export function ProfileForm({
  initialEmail,
  initialFullName,
  initialPhone,
  initialDefaultAddress,
}: ProfileFormProps) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [defaultAddress, setDefaultAddress] = useState(initialDefaultAddress ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fullName = initialFullName?.trim() || "Not provided";
  const email = initialEmail || "Not available";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      phone,
      defaultAddress,
    };

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to update profile");
      }

      setSuccess("Profile updated.");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to update profile";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-[14px] bg-card p-6 shadow-[var(--shadow-card)]">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground/80">Name</span>
        <Input value={fullName} className="h-10" disabled />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground/80">Email</span>
        <Input value={email} className="h-10" disabled />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground/80">Phone</span>
        <Input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="h-10"
          placeholder="(555) 555-5555"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground/80">Default delivery address</span>
        <Input
          value={defaultAddress}
          onChange={(event) => setDefaultAddress(event.target.value)}
          className="h-10"
          placeholder="Street, city, state"
        />
      </label>

      {error && (
        <div className="rounded-[10px] border border-destructive/30 bg-destructive/5 p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="rounded-[10px] border border-emerald-500/30 bg-emerald-500/5 p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </p>
        </div>
      )}

      <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save changes"
        )}
      </Button>
    </form>
  );
}
