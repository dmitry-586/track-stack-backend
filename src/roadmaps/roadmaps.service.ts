import { HttpException, HttpStatus, Inject, Injectable, forwardRef } from "@nestjs/common"
import { Prisma, Roadmap, UserRoadmap } from "@prisma/client"
import { PrismaService } from "src/prisma.service"
import { SkillsService } from "src/skills/skills.service"

@Injectable()
export class RoadmapsService {
	constructor(
		private prisma: PrismaService,
		@Inject(forwardRef(() => SkillsService))
		private skillsService?: SkillsService
	) {}

	// Получение всех роадмапов
	async getAllRoadmaps(): Promise<Roadmap[]> {
		return this.prisma.roadmap.findMany({
			include: {
				skills: {
					include: {
						tasks: true,
					},
				},
			},
		})
	}

	// Получение роадмапов пользователя
	async getUserRoadmaps(
		userId: string
	): Promise<(UserRoadmap & { roadmap: Roadmap })[]> {
		return this.prisma.userRoadmap.findMany({
			where: { userId },
			include: {
				roadmap: {
					include: {
						skills: {
							include: {
								tasks: {
									include: {
										userTasks: true
									}
								}
							},
						},
					},
				},
			},
		})
	}

	// Получение роадмапа по ID
	async getRoadmapById(roadmapId: string): Promise<Roadmap | null> {
		return this.prisma.roadmap.findUnique({
			where: { roadmapId },
			include: {
				skills: {
					include: {
						tasks: true,
					},
				},
			},
		})
	}

	// Создание роадмапа
	async createRoadmap(data: {
		roadmapId: string
		title: string
		complexity: string
		color: string
		stages: number
		technologies: string
	}): Promise<Roadmap> {
		try {
			return await this.prisma.roadmap.create({
				data: {
					...data,
					skills: { connect: [] }, // Initialize empty skills relation
				},
			})
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2002") {
					throw new HttpException(
						"Roadmap with this ID already exists",
						HttpStatus.CONFLICT
					)
				}
			}
			throw new HttpException(
				"Failed to create roadmap",
				HttpStatus.INTERNAL_SERVER_ERROR
			)
		}
	}

	// Обновление роадмапа
	async updateRoadmap(
		roadmapId: string,
		data: {
			title?: string
			complexity?: string
			color?: string
			stages?: number
			technologies?: string
		}
	): Promise<Roadmap> {
		try {
			return await this.prisma.roadmap.update({
				where: { roadmapId },
				data,
			})
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2025") {
					throw new HttpException("Roadmap not found", HttpStatus.NOT_FOUND)
				}
			}
			throw new HttpException(
				"Failed to update roadmap",
				HttpStatus.INTERNAL_SERVER_ERROR
			)
		}
	}

	// Удаление роадмапа
	async deleteRoadmap(roadmapId: string): Promise<Roadmap> {
		return this.prisma.$transaction(async prisma => {
			// Получаем роадмап с его скиллами
			const roadmap = await prisma.roadmap.findUnique({
				where: { roadmapId },
				include: { skills: true }
			});

			if (!roadmap) {
				throw new HttpException("Roadmap not found", HttpStatus.NOT_FOUND);
			}

			// Отсоединяем роадмап от всех навыков
			// Многие-ко-многим обновление делается через disconnect
			if (roadmap.skills.length > 0) {
				await prisma.roadmap.update({
					where: { roadmapId },
					data: {
						skills: {
							disconnect: roadmap.skills.map(skill => ({ skillId: skill.skillId }))
						}
					}
				});
			}

			// Удаляем сам роадмап
			return prisma.roadmap.delete({
				where: { roadmapId },
			})
		})
	}

	// Добавление роадмапа пользователю с автоматическим добавлением всех связанных задач
	async addRoadmapToUser(userId: string, roadmapId: string): Promise<void> {
		return this.prisma.$transaction(async prisma => {
			// Проверка существования роадмепа и получение всех связанных скиллов и задач
			const roadmap = await prisma.roadmap.findUnique({
				where: { roadmapId },
				include: {
					skills: {
						include: {
							tasks: true,
						},
					},
				},
			})

			if (!roadmap) {
				throw new HttpException("Roadmap not found", HttpStatus.NOT_FOUND)
			}

			// Проверка существования связи
			const existingLink = await prisma.userRoadmap.findUnique({
				where: {
					userId_roadmapId: { userId, roadmapId },
				},
			})

			if (existingLink) {
				throw new HttpException("Roadmap already added", HttpStatus.CONFLICT)
			}

			// Добавляем роадмап пользователю
			const userRoadmap = await prisma.userRoadmap.create({
				data: {
					userId,
					roadmapId,
					progress: 0
				}
			})

			// Рассчитываем начальный прогресс
			await this.calculateRoadmapProgress(userId, roadmapId, prisma)

			// Собираем все задачи из всех скиллов роадмапа
			const tasksToAdd: { userId: string; taskId: string; completed: boolean }[] = []
			
			for (const skill of roadmap.skills) {
				for (const task of skill.tasks) {
					tasksToAdd.push({
						userId,
						taskId: task.taskId,
						completed: false
					})
				}
			}

			// Если есть задачи, добавляем их пользователю
			if (tasksToAdd.length > 0) {
				// Используем createMany для эффективного добавления множества задач
				await prisma.userTask.createMany({
					data: tasksToAdd,
					skipDuplicates: true, // Пропускаем дубликаты, если задача уже есть у пользователя
				})
			}

			// Пересчитываем прогресс роадмепа
			await this.calculateRoadmapProgress(userId, roadmapId, prisma)
		})
	}

	// Удаление роадмапа у пользователя
	async removeRoadmapFromUser(
		userId: string,
		roadmapId: string
	): Promise<void> {
		await this.prisma.$transaction(async prisma => {
			// Находим роадмап со всеми связанными скиллами и задачами
			const roadmap = await prisma.roadmap.findUnique({
				where: { roadmapId },
				include: {
					skills: {
						include: {
							tasks: true
						}
					}
				},
			})

			if (!roadmap) {
				throw new HttpException("Roadmap not found", HttpStatus.NOT_FOUND)
			}

			// Удаляем связь пользователя с роадмапом
			await prisma.userRoadmap.delete({
				where: {
					userId_roadmapId: { userId, roadmapId },
				},
			})

			// Собираем все taskId из роадмапа
			const taskIdsFromRoadmap: string[] = []
			for (const skill of roadmap.skills) {
				for (const task of skill.tasks) {
					taskIdsFromRoadmap.push(task.taskId)
				}
			}

			// Для каждого скилла проверяем, используется ли он в других роадмапах пользователя
			for (const skill of roadmap.skills) {
				// Проверяем, используется ли скилл в других роадмапах
				const skillInOtherRoadmaps = await prisma.roadmap.findFirst({
					where: {
						AND: [
							{ roadmapId: { not: roadmapId } },
							{ skills: { some: { skillId: skill.skillId } } }
						]
					}
				});
				
				// Если скилл используется только в текущем роадмапе
				if (!skillInOtherRoadmaps) {
					// Удаляем скилл пользователя
					await prisma.userSkill.deleteMany({
						where: {
							userId,
							skillId: skill.skillId,
						},
					})

					// Удаляем фокусный скилл, если есть
					await prisma.focusSkill.deleteMany({
						where: {
							userId,
							skillId: skill.skillId,
						},
					})

					// Удаляем все задачи пользователя, связанные с этим скиллом
					await prisma.userTask.deleteMany({
						where: {
							userId,
							taskId: { in: skill.tasks.map(task => task.taskId) }
						},
					})
				} else {
					// Если скилл используется в других роадмапах, нужно проверить задачи
					// Находим задачи, которые есть только в текущем роадмапе
					const tasksToRemove = await prisma.task.findMany({
						where: {
							skillId: skill.skillId,
							taskId: { in: taskIdsFromRoadmap }
						}
					})

					// Проверяем, есть ли каждая задача в других роадмапах
					for (const task of tasksToRemove) {
						// Проверяем, есть ли данная задача у скилла, который связан с другими роадмапами
						const taskInOtherRoadmaps = await prisma.roadmap.findFirst({
							where: {
								roadmapId: { not: roadmapId },
								skills: {
									some: {
										skillId: skill.skillId,
										tasks: {
											some: { taskId: task.taskId }
										}
									}
								}
							}
						});

						// Если задачи нет в других роадмапах, удаляем её у пользователя
						if (!taskInOtherRoadmaps) {
							await prisma.userTask.deleteMany({
								where: {
									userId,
									taskId: task.taskId
								}
							})
						}
					}
				}
			}
		})
	}

	// Обновление прогресса роадмапа
	async updateUserRoadmapProgress(
		userId: string,
		roadmapId: string,
		progress: number
	): Promise<void> {
		const clampedProgress = Math.max(0, Math.min(100, progress))

		await this.prisma.userRoadmap.update({
			where: {
				userId_roadmapId: { userId, roadmapId },
			},
			data: { progress: clampedProgress },
		})
	}

	// Метод для расчета прогресса роадмапа на основе выполненных задач
	async calculateRoadmapProgress(
		userId: string, 
		roadmapId: string,
		prisma: Prisma.TransactionClient = this.prisma
	) {
		try {
			
			// Получаем роадмап со всеми связанными скиллами и задачами
			const roadmap = await prisma.roadmap.findUnique({
				where: { roadmapId },
				include: {
					skills: {
						include: {
							tasks: {
								include: {
									userTasks: true
								}
							}
						}
					}
				}
			})

			if (!roadmap) {
				return
			}

			let totalTasks = 0
			let completedTasks = 0

			// Подсчитываем общее количество задач и выполненных задач
			for (const skill of roadmap.skills) {
				let skillTotalTasks = 0
				let skillCompletedTasks = 0
				
				for (const task of skill.tasks) {
					skillTotalTasks++
					totalTasks++
					// Проверяем, есть ли у задачи userTask с completed: true
					const userTask = task.userTasks.find(ut => ut.userId === userId)
					if (userTask?.completed) {
						skillCompletedTasks++
						completedTasks++
					}
				}
				
			}

			// Если нет задач, пропускаем расчет
			if (totalTasks === 0) {
				return
			}

			// Рассчитываем прогресс как процент выполненных задач
			const progress = Math.round((completedTasks / totalTasks) * 100)

			// Обновляем прогресс роадмапа пользователя
			await prisma.userRoadmap.update({
				where: {
					userId_roadmapId: { userId, roadmapId },
				},
				data: { progress },
			})

			return progress
		} catch (error) {
			console.error("Ошибка при расчете прогресса роадмапа:", error)
		}
	}

	// Получение задач пользователя для конкретного роадмапа
	async getUserRoadmapTasks(userId: string, roadmapId: string) {
		// Получаем роадмап со всеми связанными скиллами
		const roadmap = await this.prisma.roadmap.findUnique({
			where: { roadmapId },
			include: {
				skills: {
					include: {
						tasks: true,
					},
				},
			},
		})

		if (!roadmap) {
			throw new HttpException("Roadmap not found", HttpStatus.NOT_FOUND)
		}

		// Собираем все идентификаторы задач из роадмапа
		const taskIds: string[] = []
		for (const skill of roadmap.skills) {
			for (const task of skill.tasks) {
				taskIds.push(task.taskId)
			}
		}

		// Проверяем, что у роадмапа есть задачи
		if (taskIds.length === 0) {
			return []
		}

		// Получаем пользовательские задачи для этого роадмапа
		const userTasks = await this.prisma.userTask.findMany({
			where: {
				userId,
				taskId: { in: taskIds },
			},
			include: {
				task: {
					include: {
						skill: true,
					},
				},
			},
		})

		return userTasks
	}

	// Удаление всех роадмапов пользователя
	async removeAllUserRoadmaps(userId: string): Promise<void> {
		return this.prisma.$transaction(async prisma => {
			// Получаем все роадмапы пользователя
			const userRoadmaps = await prisma.userRoadmap.findMany({
				where: { userId },
				select: { roadmapId: true },
			})

			// Если у пользователя нет роадмапов, ничего не делаем
			if (userRoadmaps.length === 0) {
				return
			}

			// Удаляем все записи UserRoadmap для пользователя
			await prisma.userRoadmap.deleteMany({
				where: { userId },
			})

			// Для каждого роадмапа удаляем соответствующие задачи
			for (const { roadmapId } of userRoadmaps) {
				// Получаем роадмап со всеми связанными скиллами и задачами
				const roadmap = await prisma.roadmap.findUnique({
					where: { roadmapId },
					include: {
						skills: {
							include: {
								tasks: true,
							},
						},
					},
				})

				if (roadmap) {
					// Собираем все задачи из роадмапа
					const taskIds: string[] = []
					for (const skill of roadmap.skills) {
						for (const task of skill.tasks) {
							taskIds.push(task.taskId)
						}
					}

					// Удаляем задачи пользователя из этого роадмапа
					if (taskIds.length > 0) {
						await prisma.userTask.deleteMany({
							where: {
								userId,
								taskId: { in: taskIds },
							},
						})
					}

					// Удаляем скиллы пользователя, связанные с этим роадмапом
					for (const skill of roadmap.skills) {
						// Проверяем, используется ли скилл в других роадмапах
						const skillInOtherRoadmaps = await prisma.roadmap.findFirst({
							where: {
								AND: [
									{ roadmapId: { not: roadmapId } },
									{ skills: { some: { skillId: skill.skillId } } }
								]
							}
						});
						
						// Если скилл используется только в текущем роадмапе, удаляем его
						if (!skillInOtherRoadmaps) {
							await prisma.userSkill.deleteMany({
								where: {
									userId,
									skillId: skill.skillId,
								},
							})

							// Удаляем также фокусные скиллы
							await prisma.focusSkill.deleteMany({
								where: {
									userId,
									skillId: skill.skillId,
								},
							})
						}
					}
				}
			}

			console.log(`Removed all roadmaps for user ${userId}`)
		})
	}

	// Добавление навыка к роадмапу
	async addSkillToRoadmap(
		roadmapId: string, 
		skillId: string
	) {
		return this.prisma.$transaction(async (prisma) => {
			// Проверяем существование роадмапа
			const roadmap = await prisma.roadmap.findUnique({
				where: { roadmapId },
				include: { skills: true }
			})

			if (!roadmap) {
				throw new HttpException("Roadmap not found", HttpStatus.NOT_FOUND)
			}

			// Проверяем существование скилла
			const skill = await prisma.skill.findUnique({
				where: { skillId },
				include: { tasks: true }
			})

			if (!skill) {
				throw new HttpException("Skill not found", HttpStatus.NOT_FOUND)
			}

			// Проверяем, не привязан ли уже этот скилл к роадмапу
			const isSkillInRoadmap = roadmap.skills.some(s => s.skillId === skillId)
			
			if (isSkillInRoadmap) {
				console.log(`Skill ${skillId} is already connected to roadmap ${roadmapId}`)
				return skill // Связь уже существует
			}

			// Добавляем связь между роадмапом и скиллом 
			// с использованием стандартного метода connect
			await prisma.roadmap.update({
				where: { roadmapId },
				data: {
					skills: {
						connect: { skillId }
					}
				}
			})
			
			console.log(`Added relation between roadmap ${roadmapId} and skill ${skillId}`)

			// Получаем обновленный скилл со всеми связями
			const updatedSkill = await prisma.skill.findUnique({
				where: { skillId },
				include: { tasks: true },
			})

			if (!updatedSkill) {
				throw new HttpException("Failed to update skill", HttpStatus.INTERNAL_SERVER_ERROR)
			}

			// Находим всех пользователей с этим роадмапом
			const userRoadmaps = await prisma.userRoadmap.findMany({
				where: { roadmapId },
				select: { userId: true },
			})

			// Для каждого пользователя добавляем задачи этого скилла
			for (const { userId } of userRoadmaps) {
				// Добавляем задачи пользователю
				for (const task of updatedSkill.tasks) {
					await prisma.userTask.upsert({
						where: {
							userId_taskId: { userId, taskId: task.taskId },
						},
						create: {
							userId,
							taskId: task.taskId,
							completed: false,
						},
						update: {}, // Не меняем, если уже существует
					})
				}

				// Обновляем прогресс роадмапа
				await this.calculateRoadmapProgress(userId, roadmapId, prisma)
			}

			return updatedSkill
		})
	}
}
