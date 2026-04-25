"use client";

import { Button } from "@/components/ui/button";

export function ContactForm() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="rounded-[16px] bg-card p-6 shadow-[var(--shadow-card)] md:p-8"
    >
      <div className="grid gap-4">
        <Field label="Your name" type="text" placeholder="Alex Rivera" />
        <Field label="Email" type="email" placeholder="alex@example.com" />
        <Field label="Zip code" type="text" placeholder="11101" />
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Message
          </label>
          <textarea
            rows={5}
            placeholder="Tell us a little about what you're after…"
            className="mt-1.5 w-full rounded-[8px] border border-border bg-canvas px-3.5 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Button size="lg" className="mt-2 w-full">
          Send message
        </Button>
        <p className="text-center text-xs text-foreground/55">
          By submitting you agree to our friendly, totally-not-evil terms.
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  type,
  placeholder,
}: {
  label: string;
  type: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-[8px] border border-border bg-canvas px-3.5 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
