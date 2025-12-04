-- Soft delete & audit columns
ALTER TABLE "Category"
ADD COLUMN "createdBy" TEXT,
ADD COLUMN "updatedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Category_deletedAt_idx" ON "Category"("deletedAt");

ALTER TABLE "Food"
ADD COLUMN "createdBy" TEXT,
ADD COLUMN "updatedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Food_deletedAt_idx" ON "Food"("deletedAt");

ALTER TABLE "Order"
ADD COLUMN "createdBy" TEXT,
ADD COLUMN "updatedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Order_deletedAt_idx" ON "Order"("deletedAt");

ALTER TABLE "OrderItem"
ADD COLUMN "createdBy" TEXT,
ADD COLUMN "updatedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "OrderItem_deletedAt_idx" ON "OrderItem"("deletedAt");

ALTER TABLE "Admin"
ADD COLUMN "createdBy" TEXT,
ADD COLUMN "updatedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Admin_deletedAt_idx" ON "Admin"("deletedAt");
