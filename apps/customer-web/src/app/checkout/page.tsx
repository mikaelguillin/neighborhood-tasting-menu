import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Checkout - Neighborhood Tasting Menu",
  description:
    "Complete your box checkout with delivery details, promo placeholder support, and confirmation.",
};

function CheckoutFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-2 bg-canvas text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm font-medium">Loading checkout…</span>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutFlow />
    </Suspense>
  );
}
