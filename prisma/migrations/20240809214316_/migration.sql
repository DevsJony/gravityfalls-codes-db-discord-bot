/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Code` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Code_code_key" ON "Code"("code");
