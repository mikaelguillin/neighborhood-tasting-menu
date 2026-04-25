import { NextResponse } from "next/server";
import type { QueueStatus } from "@/lib/vendor-ops-store";
import { updateQueueStatus } from "@/lib/vendor-ops-store";
import { requireVendorMembership } from "@/lib/supabase-server";

const VALID_STATUSES = new Set<QueueStatus>(["new", "confirmed", "preparing", "ready", "fulfilled"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireVendorMembership();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const payload = (await request.json().catch(() => null)) as { status?: QueueStatus } | null;
  const status = payload?.status;

  if (!status || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid queue status" }, { status: 400 });
  }

  const { id } = await context.params;
  const updated = await updateQueueStatus(auth.vendorId, id, status);

  if (!updated) {
    return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
