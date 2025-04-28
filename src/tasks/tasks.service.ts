import { Injectable } from "@nestjs/common"
import { Task } from "@prisma/client"
import { PrismaService } from "src/prisma.service"

@Injectable()
export class TasksService {
	constructor(private prisma: PrismaService) {}

	async getTasks(skillId: string): Promise<Task[]> {
		return this.prisma.task.findMany({
			where: { skillId },
			include: {
				skill: true,
			},
		})
	}

	async createTask(title: string, skillId: string): Promise<Task> {
		return this.prisma.task.create({
			data: {
				title,
				skillId,
				completed: false,
			},
			include: {
				skill: true,
			},
		})
	}

	async updateTask(
		taskId: string,
		data: { title?: string; completed?: boolean }
	): Promise<Task> {
		return this.prisma.task.update({
			where: { taskId },
			data,
			include: {
				skill: true,
			},
		})
	}

	async removeTask(taskId: string): Promise<Task> {
		return this.prisma.task.delete({
			where: { taskId },
			include: {
				skill: true,
			},
		})
	}
}
