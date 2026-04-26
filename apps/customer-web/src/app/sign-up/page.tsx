import type { Metadata } from "next";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Sign up — Neighborhood Tasting Menu",
  description:
    "Create your Neighborhood Tasting Menu account to manage your weekly subscription, skip a week, and update your delivery address.",
};

export default function SignUpPage() {
  return (
    <section className="bg-canvas">
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-20 md:py-28">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Join us
        </p>
        <h1 className="mt-3 text-center text-3xl font-semibold tracking-tight text-brand md:text-4xl">
          Create your account.
        </h1>
        <p className="mt-3 text-center text-sm text-foreground/70">
          Sign up to manage your subscription, skip a week, and update your address.
        </p>

        <SignUpForm />
      </div>
    </section>
  );
}
