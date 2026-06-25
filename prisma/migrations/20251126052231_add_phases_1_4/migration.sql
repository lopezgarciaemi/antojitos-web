/*
  Warnings:

  - You are about to drop the column `extNumber` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `neighborhood` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `currentStock` on the `ingredients` table. All the data in the column will be lost.
  - You are about to drop the column `selectedOptions` on the `order_items` table. All the data in the column will be lost.
  - Added the required column `colony` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stock` to the `ingredients` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_addresses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Casa',
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "intNumber" TEXT,
    "colony" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'CDMX',
    "state" TEXT NOT NULL DEFAULT 'CDMX',
    "zipCode" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "references" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_addresses" ("city", "createdAt", "id", "intNumber", "isDefault", "label", "references", "state", "street", "updatedAt", "userId", "zipCode") SELECT "city", "createdAt", "id", "intNumber", "isDefault", "label", "references", "state", "street", "updatedAt", "userId", "zipCode" FROM "addresses";
DROP TABLE "addresses";
ALTER TABLE "new_addresses" RENAME TO "addresses";
CREATE TABLE "new_ingredients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "stock" REAL NOT NULL,
    "minStock" REAL NOT NULL,
    "cost" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ingredients" ("cost", "createdAt", "id", "minStock", "name", "unit", "updatedAt") SELECT "cost", "createdAt", "id", "minStock", "name", "unit", "updatedAt" FROM "ingredients";
DROP TABLE "ingredients";
ALTER TABLE "new_ingredients" RENAME TO "ingredients";
CREATE UNIQUE INDEX "ingredients_name_key" ON "ingredients"("name");
CREATE TABLE "new_order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productPrice" REAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "options" TEXT,
    "unitPrice" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_order_items" ("createdAt", "id", "orderId", "productId", "productName", "productPrice", "quantity", "subtotal", "unitPrice") SELECT "createdAt", "id", "orderId", "productId", "productName", "productPrice", "quantity", "subtotal", "unitPrice" FROM "order_items";
DROP TABLE "order_items";
ALTER TABLE "new_order_items" RENAME TO "order_items";
CREATE TABLE "new_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREADA',
    "paymentMethod" TEXT,
    "subtotal" REAL NOT NULL,
    "tax" REAL NOT NULL DEFAULT 0,
    "deliveryFee" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "tableNumber" INTEGER,
    "addressId" TEXT,
    "deliveryAddress" TEXT,
    "shippingCost" REAL NOT NULL DEFAULT 0,
    "customerNotes" TEXT,
    "kitchenNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" DATETIME,
    "preparedAt" DATETIME,
    "readyAt" DATETIME,
    "deliveredAt" DATETIME,
    "cancelledAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_orders" ("addressId", "cancelledAt", "createdAt", "customerNotes", "deliveredAt", "deliveryFee", "discount", "id", "kitchenNotes", "orderNumber", "paidAt", "paymentMethod", "preparedAt", "readyAt", "status", "subtotal", "tableNumber", "tax", "total", "type", "updatedAt", "userId") SELECT "addressId", "cancelledAt", "createdAt", "customerNotes", "deliveredAt", "deliveryFee", "discount", "id", "kitchenNotes", "orderNumber", "paidAt", "paymentMethod", "preparedAt", "readyAt", "status", "subtotal", "tableNumber", "tax", "total", "type", "updatedAt", "userId" FROM "orders";
DROP TABLE "orders";
ALTER TABLE "new_orders" RENAME TO "orders";
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
