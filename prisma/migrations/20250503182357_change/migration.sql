-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "roadmapRoadmapId" TEXT;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_roadmapRoadmapId_fkey" FOREIGN KEY ("roadmapRoadmapId") REFERENCES "Roadmap"("roadmapId") ON DELETE SET NULL ON UPDATE CASCADE;
