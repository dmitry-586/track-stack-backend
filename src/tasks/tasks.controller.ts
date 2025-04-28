import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
} from "@nestjs/common"
import { Task } from "src/interfaces/interfaces"
import { TasksService } from "./tasks.service"

@Controller("tasks")
export class TasksController {
	constructor(private readonly tasksService: TasksService) {}

	@Get(":skillId")
	async getBySkill(@Param("skillId") skillId: string): Promise<Task[]> {
		return this.tasksService.getTasks(skillId)
	}

	@Post()
	async create(
		@Body() body: { title: string; skillId: string }
	): Promise<Task> {
		return this.tasksService.createTask(body.title, body.skillId)
	}

	@Patch(":id")
	async update(
		@Param("id") id: string,
		@Body() body: { title?: string; completed?: boolean }
	): Promise<Task> {
		return this.tasksService.updateTask(id, body)
	}

	@Delete(":id")
	async remove(@Param("id") id: string): Promise<Task> {
		return this.tasksService.removeTask(id)
	}
}
