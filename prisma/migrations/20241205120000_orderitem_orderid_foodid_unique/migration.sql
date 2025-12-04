-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_foodId_fkey";

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "foodId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_foodId_key" ON "OrderItem"("orderId", "foodId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

