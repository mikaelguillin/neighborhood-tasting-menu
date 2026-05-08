import { NextResponse } from "next/server";
import type { OperableQueueStatus } from "@/lib/vendor-ops-types";
import { OPERABLE_QUEUE_STATUSES } from "@/lib/vendor-ops-types";
import { updateQueueStatus } from "@/lib/vendor-ops-store";
import { requireVendorMembership } from "@/lib/supabase-server";

const VALID_STATUSES = new Set<OperableQueueStatus>(OPERABLE_QUEUE_STATUSES);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireVendorMembership();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const payload = (await request.json().catch(() => null)) as { status?: OperableQueueStatus } | null;
  const status = payload?.status;

  if (!status || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid queue status" }, { status: 400 });
  }

  const { id } = await context.params;
  const result = await updateQueueStatus(auth.vendorId, id, status);

  if (!result.ok) {
    if (result.reason === "cancelled") {
      return NextResponse.json({ error: "Queue item is cancelled" }, { status: 409 });
    }
    return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
  }

  return NextResponse.json(result.order);
}
