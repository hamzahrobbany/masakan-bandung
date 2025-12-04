# Indexing for Reporting and Operational Queries

## Added indexes
- `Food.categoryId` – speeds up category-based menu browsing and joins to `Category`.
- `OrderItem.foodId` – accelerates rollups by menu item and joins between orders and foods.
- `OrderItem.orderId` – keeps order detail lookups fast when expanding order lines.
- `Order.createdAt` – optimizes time range filtering for dashboards and exports.
- `Food.deletedAt` – ensures soft-delete filters remain index-friendly.

## Performance impact
These indexes reduce full table scans when applying common filters or joins. Reporting queries (e.g., sales by menu item or date range) can leverage index-driven lookups, lowering I/O and improving response times under high order volumes. Soft-delete checks and category filters remain efficient even as the dataset grows.

## Example queries
- **Orders by date range**
  ```ts
  await prisma.order.findMany({
    where: { createdAt: { gte: start, lt: end }, status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
  });
  ```
- **Top-selling foods**
  ```ts
  await prisma.orderItem.groupBy({
    by: ["foodId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
  });
  ```
- **Active menu by category**
  ```ts
  await prisma.food.findMany({
    where: { categoryId, deletedAt: null, isAvailable: true },
    orderBy: { name: "asc" },
  });
  ```
- **Auditing soft-deleted foods**
  ```ts
  await prisma.food.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
  });
  ```
