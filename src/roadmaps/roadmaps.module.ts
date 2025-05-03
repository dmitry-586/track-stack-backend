import { Module, forwardRef } from "@nestjs/common"
import { RoadmapsService } from "./roadmaps.service"
import { RoadmapsController } from "./roadmaps.controller"
import { PrismaService } from "src/prisma.service"
import { SkillsModule } from "src/skills/skills.module"

@Module({
	imports: [forwardRef(() => SkillsModule)],
	controllers: [RoadmapsController],
	providers: [RoadmapsService, PrismaService],
	exports: [RoadmapsService],
})
export class RoadmapsModule {}
