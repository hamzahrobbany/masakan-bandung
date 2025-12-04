require("ts-node/register");
const assert = require("node:assert/strict");
const test = require("node:test");

const { aggregateOrderItems } = require("./order-items");

test("aggregateOrderItems merges duplicate foodIds", () => {
  const input = [
    { foodId: "food-a", quantity: 1 },
    { foodId: "food-b", quantity: 2 },
    { foodId: "food-a", quantity: 3 },
  ];

  const result = aggregateOrderItems(input);

  assert.deepEqual(result, [
    { foodId: "food-a", quantity: 4 },
    { foodId: "food-b", quantity: 2 },
  ]);
});

test("aggregateOrderItems preserves first-seen order", () => {
  const input = [
    { foodId: "food-b", quantity: 2 },
    { foodId: "food-a", quantity: 1 },
    { foodId: "food-b", quantity: 1 },
  ];

  const result = aggregateOrderItems(input);

  assert.deepEqual(result, [
    { foodId: "food-b", quantity: 3 },
    { foodId: "food-a", quantity: 1 },
  ]);
});
