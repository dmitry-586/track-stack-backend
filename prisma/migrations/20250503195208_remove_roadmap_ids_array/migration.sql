/*
  Warnings:

  - You are about to drop the column `roadmapIds` on the `Skill` table. All the data in the column will be lost.
  - You are about to drop the column `roadmapRoadmapId` on the `Skill` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Skill" DROP CONSTRAINT "Skill_roadmapRoadmapId_fkey";

-- AlterTable
ALTER TABLE "Skill" DROP COLUMN "roadmapIds",
DROP COLUMN "roadmapRoadmapId";

-- CreateTable
CREATE TABLE "_RoadmapToSkill" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RoadmapToSkill_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RoadmapToSkill_B_index" ON "_RoadmapToSkill"("B");

-- AddForeignKey
ALTER TABLE "_RoadmapToSkill" ADD CONSTRAINT "_RoadmapToSkill_A_fkey" FOREIGN KEY ("A") REFERENCES "Roadmap"("roadmapId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoadmapToSkill" ADD CONSTRAINT "_RoadmapToSkill_B_fkey" FOREIGN KEY ("B") REFERENCES "Skill"("skillId") ON DELETE CASCADE ON UPDATE CASCADE;
