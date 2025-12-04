import { describe, expect, it } from "vitest";

import { aggregateOrderItems } from "./order-items";

describe("aggregateOrderItems", () => {
  it("merges duplicate foodIds", () => {
    const input = [
      { foodId: "food-a", quantity: 1 },
      { foodId: "food-b", quantity: 2 },
      { foodId: "food-a", quantity: 3 },
    ];

    const result = aggregateOrderItems(input);

    expect(result).toEqual([
      { foodId: "food-a", quantity: 4 },
      { foodId: "food-b", quantity: 2 },
    ]);
  });

  it("preserves first-seen order", () => {
    const input = [
      { foodId: "food-b", quantity: 2 },
      { foodId: "food-a", quantity: 1 },
      { foodId: "food-b", quantity: 1 },
    ];

    const result = aggregateOrderItems(input);

    expect(result).toEqual([
      { foodId: "food-b", quantity: 3 },
      { foodId: "food-a", quantity: 1 },
    ]);
  });
});
