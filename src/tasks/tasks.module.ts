import { Module } from "@nestjs/common"
import { PrismaService } from "src/prisma.service"
import { SkillsService } from "src/skills/skills.service"
import { TasksController } from "./tasks.controller"
import { TasksService } from "./tasks.service"

@Module({
	controllers: [TasksController],
	providers: [TasksService, PrismaService, SkillsService],
})
export class TasksModule {}
