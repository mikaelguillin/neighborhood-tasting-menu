import Link from "next/link";
import { ShoppingBag } from "lucide-react";

/**
 * "Frap"-style floating circular CTA — bottom-right on every shopping surface.
 * Green Accent fill, layered shadow stack, scale(0.95) press.
 */
export function FloatingOrderButton() {
  return (
    <Link
      href="/plans"
      aria-label="Build your box"
      className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-frap)] transition-all duration-200 ease-out hover:bg-primary/95 active:scale-[0.95] active:shadow-[var(--shadow-frap-active)] md:bottom-8 md:right-8"
    >
      <ShoppingBag className="h-6 w-6" strokeWidth={2} />
    </Link>
  );
}
