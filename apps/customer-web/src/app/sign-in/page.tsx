import type { Metadata } from "next";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign in — Neighborhood Tasting Menu",
  description:
    "Sign in to manage your Neighborhood Tasting Menu subscription, skip a week, or update your delivery address.",
};

export default function SignInPage() {
  return (
    <section className="bg-canvas">
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-20 md:py-28">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Welcome back
        </p>
        <h1 className="mt-3 text-center text-3xl font-semibold tracking-tight text-brand md:text-4xl">
          Sign in to your account.
        </h1>
        <p className="mt-3 text-center text-sm text-foreground/70">
          Manage your subscription, skip a week, or update your address.
        </p>

        <SignInForm />
      </div>
    </section>
  );
}
