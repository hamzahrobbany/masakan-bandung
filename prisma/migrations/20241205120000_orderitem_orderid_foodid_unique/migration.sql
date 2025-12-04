ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_foodId_fkey";

-- Clean up orphaned order items that lack a food reference so the column can be enforced as NOT NULL
DELETE FROM "OrderItem"
WHERE "foodId" IS NULL;

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "foodId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_foodId_key" ON "OrderItem"("orderId", "foodId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

