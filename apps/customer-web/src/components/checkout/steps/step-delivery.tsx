"use client";

import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckout, type DeliveryWindow } from "../checkout-context";
import { cn } from "@/lib/utils";

const WINDOWS: { id: DeliveryWindow; label: string; sub: string }[] = [
  { id: "fri-evening", label: "Friday, 4–6pm", sub: "Most popular — porch drop ok" },
  { id: "fri-late", label: "Friday, 6–9pm", sub: "After-work window" },
  { id: "sat-morning", label: "Saturday, 9am–12pm", sub: "Weekend brunch arrival" },
];

export function StepDelivery() {
  const { delivery, updateDelivery, next, back } = useCheckout();

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-brand md:text-3xl">
        When works for you?
      </h2>
      <p className="mt-2 text-sm text-foreground/70">
        Pick your preferred window. We&apos;ll text the night before with a tighter ETA.
      </p>

      <div className="mt-6 grid gap-3">
        {WINDOWS.map((w) => {
          const selected = delivery.window === w.id;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => updateDelivery({ window: w.id })}
              aria-pressed={selected}
              className={cn(
                "flex items-center justify-between gap-4 rounded-[12px] bg-card p-4 text-left shadow-[var(--shadow-card)] transition-all",
                selected ? "ring-2 ring-primary" : "hover:-translate-y-0.5",
              )}
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{w.label}</p>
                <p className="mt-0.5 text-xs text-foreground/60">{w.sub}</p>
              </div>
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                  selected ? "border-primary bg-primary" : "border-border bg-canvas",
                )}
              >
                {selected && <span className="h-2 w-2 rounded-full bg-primary-foreground" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Delivery notes (gate codes, doorman, etc.)
        </label>
        <textarea
          value={delivery.notes}
          onChange={(e) => updateDelivery({ notes: e.target.value })}
          rows={3}
          className="mt-1.5 w-full rounded-[8px] border border-border bg-canvas px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Leave with doorman, code #1234, etc."
        />
      </div>

      <div className="mt-6 rounded-[12px] bg-card p-5 shadow-[var(--shadow-card)]">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={delivery.isGift}
            onChange={(e) => updateDelivery({ isGift: e.target.checked })}
            className="mt-1 h-4 w-4 accent-[color:var(--primary)]"
          />
          <span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Gift className="h-4 w-4 text-primary" /> This is a gift
            </span>
            <span className="mt-0.5 block text-xs text-foreground/60">
              We&apos;ll tuck a handwritten note in the box and hide the receipt.
            </span>
          </span>
        </label>
        {delivery.isGift && (
          <textarea
            value={delivery.giftMessage}
            onChange={(e) => updateDelivery({ giftMessage: e.target.value })}
            rows={2}
            maxLength={240}
            placeholder="Add a short note (max 240 characters)…"
            className="mt-3 w-full rounded-[8px] border border-border bg-canvas px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={back}>
          Back
        </Button>
        <Button size="lg" onClick={next}>
          Continue to payment
        </Button>
      </div>
    </div>
  );
}
