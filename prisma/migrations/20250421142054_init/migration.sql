/*
  Warnings:

  - You are about to drop the column `isPublic` on the `Roadmap` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `Roadmap` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Roadmap" DROP COLUMN "isPublic",
DROP COLUMN "progress";

-- CreateTable
CREATE TABLE "FocusSkill" (
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL,

    CONSTRAINT "FocusSkill_pkey" PRIMARY KEY ("userId","skillId")
);

-- AddForeignKey
ALTER TABLE "FocusSkill" ADD CONSTRAINT "FocusSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocusSkill" ADD CONSTRAINT "FocusSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("skillId") ON DELETE RESTRICT ON UPDATE CASCADE;
