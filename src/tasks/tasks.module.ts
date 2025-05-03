import { Module } from "@nestjs/common"
import { TasksController } from "./tasks.controller"
import { TasksService } from "./tasks.service"
import { PrismaService } from "src/prisma.service"
import { SkillsModule } from "src/skills/skills.module"

@Module({
	imports: [SkillsModule],
	controllers: [TasksController],
	providers: [TasksService, PrismaService],
	exports: [TasksService],
})
export class TasksModule {}
