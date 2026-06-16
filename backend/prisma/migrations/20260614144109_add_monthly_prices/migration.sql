-- CreateTable
CREATE TABLE "HouseMonthlyPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "houseId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    CONSTRAINT "HouseMonthlyPrice_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "HouseMonthlyPrice_houseId_month_key" ON "HouseMonthlyPrice"("houseId", "month");
