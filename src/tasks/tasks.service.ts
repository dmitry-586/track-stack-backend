// tasks.service.ts
import { Injectable } from "@nestjs/common"
import { Prisma, Task, UserTask } from "@prisma/client"
import { PrismaService } from "src/prisma.service"
import { SkillsService } from "src/skills/skills.service"

@Injectable()
export class TasksService {
	constructor(
		private prisma: PrismaService,
		private skillsService: SkillsService
	) {}

	async getTasks(skillId?: string): Promise<Task[]> {
		return this.prisma.task.findMany({
			where: skillId ? { skillId } : undefined,
			include: { skill: true },
		})
	}

	async getUserTasks(userId: string, skillId?: string): Promise<UserTask[]> {
		const where: Prisma.UserTaskWhereInput = { userId }
		if (skillId) {
			where.task = { skillId }
		}

		return this.prisma.userTask.findMany({
			where,
			include: { task: { include: { skill: true } } },
		})
	}

	async createTask(title: string, skillId: string): Promise<Task> {
		return this.prisma.$transaction(async prisma => {
			const task = await prisma.task.create({
				data: { title, skillId },
				include: { skill: true },
			})

			const userSkills = await prisma.userSkill.findMany({
				where: { skillId },
				select: { userId: true },
			})

			await Promise.all(
				userSkills.map(({ userId }) =>
					this.skillsService.calculateAndUpdateSkillProgress(
						userId,
						skillId,
						prisma
					)
				)
			)

			return task
		})
	}

	async updateUserTaskStatus(
		taskId: string,
		userId: string,
		completed: boolean
	): Promise<UserTask> {
		return this.prisma.$transaction(async prisma => {
			const updatedTask = await prisma.userTask.upsert({
				where: { userId_taskId: { userId, taskId } },
				update: { completed },
				create: { userId, taskId, completed },
				include: { task: { include: { skill: true } } },
			})

			await this.skillsService.calculateAndUpdateSkillProgress(
				userId,
				updatedTask.task.skillId,
				prisma
			)

			return updatedTask
		})
	}

	async removeTask(taskId: string): Promise<Task> {
		return this.prisma.$transaction(async prisma => {
			const task = await prisma.task.delete({
				where: { taskId },
				include: { skill: true },
			})

			const userSkills = await prisma.userSkill.findMany({
				where: { skillId: task.skillId },
				select: { userId: true },
			})

			await Promise.all(
				userSkills.map(({ userId }) =>
					this.skillsService.calculateAndUpdateSkillProgress(
						userId,
						task.skillId,
						prisma
					)
				)
			)

			return task
		})
	}
}
