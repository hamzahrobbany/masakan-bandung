export type NormalizedOrderItem = {
  foodId: string;
  quantity: number;
};

export function aggregateOrderItems(items: NormalizedOrderItem[]): NormalizedOrderItem[] {
  const aggregated = new Map<string, number>();

  for (const item of items) {
    aggregated.set(item.foodId, (aggregated.get(item.foodId) ?? 0) + item.quantity);
  }

  return Array.from(aggregated.entries()).map(([foodId, quantity]) => ({ foodId, quantity }));
}
