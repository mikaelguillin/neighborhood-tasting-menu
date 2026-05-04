/** Keeps client UI in sync with `cancelOrder` rules in `order-store`. */
export function orderCanBeCancelled(status: string): boolean {
  return status !== "cancelled" && status !== "delivered";
}
