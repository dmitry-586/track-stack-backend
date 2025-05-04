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
					prisma.userTask.create({
						data: {
							userId,
							taskId: task.taskId,
							completed: false,
						},
					})
				)
			)

			const skill = await prisma.skill.findUnique({
				where: { skillId },
				include: { roadmaps: true }
			})

			if (skill && skill.roadmaps.length > 0) {
				for (const roadmap of skill.roadmaps) {
					const userRoadmaps = await prisma.userRoadmap.findMany({
						where: { roadmapId: roadmap.roadmapId },
						select: { userId: true },
					})

					for (const { userId } of userRoadmaps) {
						const existingTask = await prisma.userTask.findUnique({
							where: { userId_taskId: { userId, taskId: task.taskId } },
						})
						
						if (!existingTask) {
							await prisma.userTask.create({
								data: {
									userId,
									taskId: task.taskId,
									completed: false,
								},
							})
						}
					}
				}
			}

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
			const task = await prisma.task.findUnique({
				where: { taskId },
				include: { 
					skill: {
						include: {
							roadmaps: true
						}
					} 
				},
			})

			if (!task) {
				throw new Error("Task not found")
			}

			const updatedTask = await prisma.userTask.upsert({
				where: { userId_taskId: { userId, taskId } },
				update: { completed },
				create: { userId, taskId, completed },
				include: { task: { include: { skill: true } } },
			})

			if (completed) {
				if (task.skill.name === "Инструменты" || task.skill.name === "Практика" || task.skill.name === "Дополнительно") {
					console.log(`Скилл "${task.skill.name}" не может быть добавлен пользователю автоматически`)
				} else {
					await prisma.userSkill.upsert({
						where: { userId_skillId: { userId, skillId: task.skillId } },
						update: {},
						create: {
							userId,
							skillId: task.skillId,
							progress: 0,
						},
					})
				}
			}

			// Обновляем прогресс скилла
			await this.skillsService.calculateAndUpdateSkillProgress(
				userId,
				task.skillId,
				prisma
			)

			// Обновляем прогресс всех роадмапов, содержащих этот скилл
			if (task.skill.roadmaps.length > 0) {
				const roadmapsService = this.skillsService.getRoadmapsService();
				if (roadmapsService) {
					await Promise.all(
						task.skill.roadmaps.map(roadmap => {
							return roadmapsService.calculateRoadmapProgress(
								userId, 
								roadmap.roadmapId,
								prisma
							)
						})
					);
				}
			}

			return updatedTask
		})
	}

	async removeTask(taskId: string): Promise<Task> {
		return this.prisma.$transaction(async prisma => {
			const task = await prisma.task.findUnique({
				where: { taskId },
				include: { skill: true },
			})
			
			if (!task) {
				throw new Error("Task not found")
			}
			
			const skillId = task.skillId;

			const skill = await prisma.skill.findUnique({
				where: { skillId },
				include: { roadmaps: true }
			});

			const affectedUsers = await prisma.userTask.findMany({
				where: { taskId },
				select: { userId: true },
			})

			await prisma.userTask.deleteMany({
				where: { taskId },
			})
			
			const deletedTask = await prisma.task.delete({
				where: { taskId },
				include: { skill: true },
			})

			for (const { userId } of affectedUsers) {
				await this.skillsService.calculateAndUpdateSkillProgress(
					userId,
					skillId,
					prisma
				)
				
				if (skill && skill.roadmaps.length > 0) {
					const roadmapsService = this.skillsService.getRoadmapsService();
					if (roadmapsService) {
						for (const roadmap of skill.roadmaps) {
							await roadmapsService.calculateRoadmapProgress(userId, roadmap.roadmapId);
						}
					}
				}
			}

			return deletedTask
		})
	}

	// Удаление всех задач пользователя
	async removeAllUserTasks(userId: string): Promise<void> {
		return this.prisma.$transaction(async prisma => {
			// Получаем все задачи пользователя для логирования
			const userTasks = await prisma.userTask.findMany({
				where: { userId },
				include: { task: true },
			})

			if (userTasks.length === 0) {
				console.log(`User ${userId} has no tasks to remove`)
				return
			}

			// Получаем идентификаторы навыков, к которым относятся задачи пользователя
			const affectedSkillIds = new Set<string>()
			for (const userTask of userTasks) {
				affectedSkillIds.add(userTask.task.skillId)
			}

			// Удаляем все задачи пользователя
			await prisma.userTask.deleteMany({
				where: { userId },
			})

			console.log(`Removed ${userTasks.length} tasks for user ${userId}`)

			// Пересчитываем прогресс для всех затронутых скиллов
			for (const skillId of affectedSkillIds) {
				await this.skillsService.calculateAndUpdateSkillProgress(
					userId,
					skillId,
					prisma
				)
			}
		})
	}
}
