import { HttpException, HttpStatus, Inject, Injectable, forwardRef } from "@nestjs/common"
import { Prisma, Skill } from "@prisma/client"
import { PrismaService } from "src/prisma.service"
import { RoadmapsService } from "src/roadmaps/roadmaps.service"

@Injectable()
export class SkillsService {
	constructor(
		private prisma: PrismaService,
		@Inject(forwardRef(() => RoadmapsService))
		private roadmapsService: RoadmapsService
	) {}

	// Получение доступа к roadmapsService для других сервисов
	getRoadmapsService(): RoadmapsService | undefined {
		return this.roadmapsService;
	}

	async getAllSkills(roadmapId?: string): Promise<Skill[]> {
		if (roadmapId) {
			// Если указан roadmapId, получаем скиллы связанные с этим роадмапом
			return this.prisma.skill.findMany({
				where: {
					roadmaps: {
						some: { roadmapId }
					}
				},
				include: { tasks: true },
			});
		}

		// Иначе возвращаем все скиллы
		return this.prisma.skill.findMany({
			include: { tasks: true },
		});
	}

	async getSkillById(skillId: string): Promise<Skill | null> {
		return this.prisma.skill.findUnique({
			where: { skillId },
		})
	}

	async createSkill(name: string, roadmapIds: string[] = []): Promise<Skill> {
		return this.prisma.skill.create({
			data: {
				name,
				roadmaps: {
					connect: roadmapIds.map(id => ({ roadmapId: id }))
				}
			},
		})
	}

	async updateSkill(skillId: string, name: string): Promise<Skill> {
		return this.prisma.skill.update({
			where: { skillId },
			data: { name },
		})
	}

	async deleteSkill(skillId: string): Promise<Skill> {
		return this.prisma.skill.delete({
			where: { skillId },
		})
	}

	async getUserSkills(userId: string, roadmapId?: string) {
		const whereCondition: Prisma.UserSkillWhereInput = {
			userId,
		}

		if (roadmapId) {
			whereCondition.skill = {
				roadmaps: {
					some: { roadmapId }
				}
			}
		}

		return this.prisma.userSkill.findMany({
			where: whereCondition,
			include: { skill: true },
		})
	}

	async addSkillToUser(userId: string, skillId: string): Promise<void> {
		await this.prisma.userSkill.create({
			data: {
				userId,
				skillId,
				progress: 0,
			},
		})
	}

	async removeSkillFromUser(userId: string, skillId: string): Promise<void> {
		await this.prisma.userSkill.delete({
			where: {
				userId_skillId: {
					userId,
					skillId,
				},
			},
		})
	}

	async updateSkillProgress(
		userId: string,
		skillId: string,
		progress: number,
		prisma: Prisma.TransactionClient = this.prisma
	): Promise<void> {
		// Ограничиваем прогресс от 0 до 100
		const clampedProgress = Math.max(0, Math.min(100, progress))

		// Обновляем скилл пользователя
		await prisma.userSkill.upsert({
			where: { userId_skillId: { userId, skillId } },
			update: { progress: clampedProgress },
			create: { userId, skillId, progress: clampedProgress },
		})

		// Обновляем фокусный скилл, если есть
		const focusSkill = await prisma.focusSkill.findUnique({
			where: { userId_skillId: { userId, skillId } },
		})

		if (focusSkill) {
			await prisma.focusSkill.update({
				where: { userId_skillId: { userId, skillId } },
				data: { progress: clampedProgress },
			})
		}

		// Обновляем прогресс во всех роадмепах, содержащих этот скилл
		const skill = await prisma.skill.findUnique({
			where: { skillId },
			include: { roadmaps: true }
		})

		if (skill && skill.roadmaps.length > 0) {
			for (const roadmap of skill.roadmaps) {
				await this.roadmapsService.calculateRoadmapProgress(userId, roadmap.roadmapId)
			}
		}
	}

	async calculateAndUpdateSkillProgress(
		userId: string,
		skillId: string,
		prisma: Prisma.TransactionClient = this.prisma
	): Promise<void> {
		// Получаем все задачи для этого скилла
		const totalTasks = await prisma.task.count({ where: { skillId } })
		
		// Если нет задач, пропускаем расчет прогресса
		if (totalTasks === 0) {
			return
		}
		
		// Считаем количество завершенных задач
		const completedTasks = await prisma.userTask.count({
			where: {
				userId,
				task: { skillId },
				completed: true,
			},
		})

		// Рассчитываем прогресс как процент выполненных задач
		const progress = Math.round((completedTasks / totalTasks) * 100)
		
		// Создаем или обновляем скилл пользователя с рассчитанным прогрессом
		await prisma.userSkill.upsert({
			where: { userId_skillId: { userId, skillId } },
			update: { progress },
			create: { userId, skillId, progress },
		})
		
		// Обновляем фокусные скиллы, если есть
		const focusSkill = await prisma.focusSkill.findUnique({
			where: { userId_skillId: { userId, skillId } },
		})

		if (focusSkill) {
			await prisma.focusSkill.update({
				where: { userId_skillId: { userId, skillId } },
				data: { progress },
			})
		}
		
		// Обновляем прогресс во всех роадмепах, содержащих этот скилл
		const skill = await prisma.skill.findUnique({
			where: { skillId },
			include: { roadmaps: true }
		})

		if (skill && this.roadmapsService && skill.roadmaps.length > 0) {
			for (const roadmap of skill.roadmaps) {
				await this.roadmapsService.calculateRoadmapProgress(userId, roadmap.roadmapId)
			}
		}
	}

	async getFocusSkills(userId: string, roadmapId?: string) {
		const whereCondition: Prisma.FocusSkillWhereInput = {
			userId: userId,
		}

		if (roadmapId) {
			whereCondition.skill = {
				roadmaps: {
					some: { roadmapId }
				}
			}
		}

		return this.prisma.focusSkill.findMany({
			where: whereCondition,
			include: { skill: true },
		})
	}

	async addSkillToFocus(userId: string, skillId: string): Promise<void> {
		const userSkill = await this.prisma.userSkill.findUnique({
			where: {
				userId_skillId: {
					userId,
					skillId,
				},
			},
		})

		if (!userSkill) {
			throw new HttpException(
				"Скилл не найден в данных пользователя",
				HttpStatus.BAD_REQUEST
			)
		}

		if (userSkill.progress < 50) {
			throw new HttpException(
				"Прогресс скилла должен быть не менее 50% для добавления в фокус",
				HttpStatus.BAD_REQUEST
			)
		}

		try {
			await this.prisma.focusSkill.create({
				data: {
					userId,
					skillId,
					progress: userSkill.progress,
				},
			})
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				throw new HttpException(
					"Скилл уже добавлен в фокус",
					HttpStatus.CONFLICT
				)
			}
			throw new HttpException(
				"Произошла ошибка при добавлении скилла в фокус",
				HttpStatus.INTERNAL_SERVER_ERROR
			)
		}
	}

	async removeSkillFromFocus(userId: string, skillId: string): Promise<void> {
		await this.prisma.focusSkill.delete({
			where: {
				userId_skillId: {
					userId,
					skillId,
				},
			},
		})
	}

	async addTaskToSkill(
		skillId: string,
		title: string
	): Promise<Skill> {
		return this.prisma.$transaction(async prisma => {
			// Проверяем существование скилла
			const skill = await prisma.skill.findUnique({
				where: { skillId },
			})
			
			if (!skill) {
				throw new HttpException("Skill not found", HttpStatus.NOT_FOUND)
			}

			// Создаем новую задачу
			await prisma.task.create({
				data: {
					title,
					skillId,
				},
			})

			// Получаем обновленный скилл со всеми задачами
			const updatedSkill = await prisma.skill.findUnique({
				where: { skillId },
				include: { tasks: true },
			})

			if (!updatedSkill) {
				throw new HttpException("Error retrieving updated skill", HttpStatus.INTERNAL_SERVER_ERROR)
			}

			return updatedSkill
		})
	}

	// Удаление всех скиллов пользователя
	async removeAllUserSkills(userId: string): Promise<void> {
		return this.prisma.$transaction(async prisma => {
			// Получаем все скиллы пользователя
			const userSkills = await prisma.userSkill.findMany({
				where: { userId },
				include: { 
					skill: {
						include: { roadmaps: true }
					} 
				},
			})

			if (userSkills.length === 0) {
				console.log(`User ${userId} has no skills to remove`)
				return
			}

			// Удаляем все скиллы пользователя
			await prisma.userSkill.deleteMany({
				where: { userId },
			})

			console.log(`Removed ${userSkills.length} skills for user ${userId}`)

			// Пересчитываем прогресс всех затронутых роадмапов
			if (this.roadmapsService) {
				const affectedRoadmapIds = new Set<string>()
				
				// Собираем идентификаторы всех затронутых роадмапов
				for (const userSkill of userSkills) {
					if (userSkill.skill.roadmaps) {
						for (const roadmap of userSkill.skill.roadmaps) {
							affectedRoadmapIds.add(roadmap.roadmapId)
						}
					}
				}
				
				// Пересчитываем прогресс для каждого роадмапа
				for (const roadmapId of affectedRoadmapIds) {
					await this.roadmapsService.calculateRoadmapProgress(userId, roadmapId)
				}
			}
		})
	}

	// Удаление всех фокусных скиллов пользователя
	async removeAllUserFocusSkills(userId: string): Promise<void> {
		try {
			// Удаляем все фокусные скиллы пользователя
			const result = await this.prisma.focusSkill.deleteMany({
				where: { userId },
			})

			console.log(`Removed ${result.count} focus skills for user ${userId}`)
		} catch (error) {
			console.error(`Error removing focus skills for user ${userId}:`, error)
			throw new HttpException(
				"Failed to remove focus skills",
				HttpStatus.INTERNAL_SERVER_ERROR
			)
		}
	}
}
