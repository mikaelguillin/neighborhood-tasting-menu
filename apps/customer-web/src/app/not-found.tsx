import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-canvas px-4 py-20">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          404 — Off the route
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-brand">
          That box isn&apos;t on the round.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/70">
          The page you&apos;re looking for doesn&apos;t exist or has been moved to another
          neighborhood.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
