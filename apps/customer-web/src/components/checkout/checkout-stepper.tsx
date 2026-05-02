"use client";

import { Check } from "lucide-react";
import { useCheckout, STEP_ORDER, type CheckoutStep } from "./checkout-context";
import { cn } from "@/lib/utils";

const LABELS: Record<Exclude<CheckoutStep, "confirmation">, string> = {
  plan: "Plan & box",
  address: "Address",
  delivery: "Delivery",
  payment: "Payment",
};

export function CheckoutStepper() {
  const { step, setStep } = useCheckout();
  if (step === "confirmation") return null;

  const currentIndex = STEP_ORDER.indexOf(step);

  return (
    <ol className="flex w-full items-center gap-2 md:gap-3">
      {STEP_ORDER.map((s, i) => {
        const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming";
        const clickable = i <= currentIndex;
        return (
          <li key={s} className="flex flex-1 items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={() => clickable && setStep(s)}
              disabled={!clickable}
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 md:gap-3 transition-colors",
                clickable ? "cursor-pointer" : "cursor-not-allowed",
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors md:h-9 md:w-9",
                  state === "current" &&
                    "bg-primary text-primary-foreground shadow-[var(--shadow-card)]",
                  state === "done" && "bg-mint text-brand",
                  state === "upcoming" &&
                    "border border-border bg-canvas-soft text-muted-foreground",
                )}
              >
                {state === "done" ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-semibold tracking-tight md:inline",
                  state === "current" && "text-foreground",
                  state === "done" && "text-foreground/80",
                  state === "upcoming" && "text-muted-foreground",
                )}
              >
                {LABELS[s as Exclude<CheckoutStep, "confirmation">]}
              </span>
            </button>
            {i < STEP_ORDER.length - 1 && (
              <span
                className={cn(
                  "h-px flex-1 transition-colors",
                  i < currentIndex ? "bg-primary/40" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
