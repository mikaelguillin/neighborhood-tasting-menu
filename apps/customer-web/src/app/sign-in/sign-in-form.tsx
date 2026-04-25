"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SignInForm() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="mt-8 w-full rounded-[16px] bg-card p-6 shadow-[var(--shadow-card)] md:p-8"
    >
      <div className="grid gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            className="mt-1.5 w-full rounded-[8px] border border-border bg-canvas px-3.5 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="mt-1.5 w-full rounded-[8px] border border-border bg-canvas px-3.5 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Button size="lg" className="mt-2 w-full">
          Sign in
        </Button>
        <p className="text-center text-sm text-foreground/70">
          New here?{" "}
          <Link href="/plans" className="font-semibold text-primary hover:underline">
            Start a subscription
          </Link>
        </p>
      </div>
    </form>
  );
}
