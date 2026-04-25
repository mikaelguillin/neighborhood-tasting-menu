import { NextResponse } from "next/server";
import type { QueueStatus } from "@/lib/vendor-ops-store";
import { updateQueueStatus } from "@/lib/vendor-ops-store";

const VALID_STATUSES = new Set<QueueStatus>(["new", "confirmed", "preparing", "ready", "fulfilled"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const payload = (await request.json().catch(() => null)) as { status?: QueueStatus } | null;
  const status = payload?.status;

  if (!status || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid queue status" }, { status: 400 });
  }

  const { id } = await context.params;
  const updated = updateQueueStatus(id, status);

  if (!updated) {
    return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
