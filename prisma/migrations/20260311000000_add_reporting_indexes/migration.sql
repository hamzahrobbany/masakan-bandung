-- Add indexes to speed up reporting and filter queries
CREATE INDEX IF NOT EXISTS "Food_categoryId_idx" ON "Food"("categoryId");
CREATE INDEX IF NOT EXISTS "OrderItem_foodId_idx" ON "OrderItem"("foodId");
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX IF NOT EXISTS "Food_deletedAt_idx" ON "Food"("deletedAt");
