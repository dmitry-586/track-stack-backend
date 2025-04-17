/*
  Warnings:

  - You are about to drop the column `progress` on the `Skill` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Skill` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Skill" DROP CONSTRAINT "Skill_skillId_fkey";

-- AlterTable
ALTER TABLE "Skill" DROP COLUMN "progress";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "password" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "UserSkill" (
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL,

    CONSTRAINT "UserSkill_pkey" PRIMARY KEY ("userId","skillId")
);

-- CreateTable
CREATE TABLE "Roadmap" (
    "roadmapId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "complexity" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "stages" INTEGER NOT NULL,
    "technologies" TEXT NOT NULL,
    "progress" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Roadmap_pkey" PRIMARY KEY ("roadmapId")
);

-- CreateTable
CREATE TABLE "UserRoadmap" (
    "userId" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL,

    CONSTRAINT "UserRoadmap_pkey" PRIMARY KEY ("userId","roadmapId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("skillId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoadmap" ADD CONSTRAINT "UserRoadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoadmap" ADD CONSTRAINT "UserRoadmap_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("roadmapId") ON DELETE RESTRICT ON UPDATE CASCADE;
