// tasks.controller.ts
import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
} from "@nestjs/common"
import { Task, UserTask } from "@prisma/client"
import { TasksService } from "./tasks.service"

@Controller("tasks")
export class TasksController {
	constructor(private readonly tasksService: TasksService) {}

	// Получение общих задач
	@Get()
	async getTasks(@Query("skillId") skillId?: string): Promise<Task[]> {
		return this.tasksService.getTasks(skillId)
	}

	// Получение пользовательских задач
	@Get("user/:userId")
	async getUserTasks(
		@Param("userId") userId: string,
		@Query("skillId") skillId?: string
	): Promise<UserTask[]> {
		return this.tasksService.getUserTasks(userId, skillId)
	}

	@Post()
	async createTask(
		@Body() body: { title: string; skillId: string }
	): Promise<Task> {
		return this.tasksService.createTask(body.title, body.skillId)
	}

	@Patch(":id/user/:userId")
	async updateUserTask(
		@Param("id") taskId: string,
		@Param("userId") userId: string,
		@Body() body: { completed: boolean }
	): Promise<UserTask> {
		if (!userId) {
			throw new BadRequestException("User ID is required")
		}
		return this.tasksService.updateUserTaskStatus(
			taskId,
			userId,
			body.completed
		)
	}

	@Delete(":id")
	async removeTask(@Param("id") id: string): Promise<Task> {
		return this.tasksService.removeTask(id)
	}
}
