import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NeighborhoodNotFound() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-24 text-center md:px-6 lg:px-10">
      <h1 className="text-3xl font-semibold tracking-tight text-brand">Neighborhood not found.</h1>
      <p className="mt-3 text-foreground/70">
        We don&apos;t ship that one yet — but new drops land every Monday.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/neighborhoods">Browse all neighborhoods</Link>
      </Button>
    </div>
  );
}
