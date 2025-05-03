import { Module, forwardRef } from "@nestjs/common"
import { SkillsService } from "./skills.service"
import { SkillsController } from "./skills.controller"
import { PrismaService } from "src/prisma.service"
import { RoadmapsModule } from "src/roadmaps/roadmaps.module"

@Module({
	imports: [forwardRef(() => RoadmapsModule)],
	controllers: [SkillsController],
	providers: [SkillsService, PrismaService],
	exports: [SkillsService],
})
export class SkillsModule {}
