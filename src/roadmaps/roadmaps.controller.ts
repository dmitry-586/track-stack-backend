import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from "@nestjs/common";
import { RoadmapsService } from "./roadmaps.service";
import { Roadmap, UserRoadmap } from "@prisma/client";

@Controller("roadmaps")
export class RoadmapsController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  //получить список всех roadmap
  @Get()
  async getAllRoadmaps(): Promise<Roadmap[]> {
    return this.roadmapsService.getAllRoadmaps();
  }

  //получить roadmap по id
  @Get(":id")
  async getRoadmapById(
    @Param("id") roadmapId: string,
  ): Promise<Roadmap | null> {
    return this.roadmapsService.getRoadmapById(roadmapId);
  }

  //добавить roadmap в общую БД
  @Post()
  async createRoadmap(
    @Body()
    data: {
      roadmapId: string;
      title: string;
      complexity: string;
      color: string;
      stages: number;
      technologies: string;
    },
  ): Promise<Roadmap> {
    return this.roadmapsService.createRoadmap(data);
  }

  //обновить roadmap в общей БД
  @Put(":id")
  async updateRoadmap(
    @Param("id") roadmapId: string,
    @Body()
    data: {
      title?: string;
      complexity?: string;
      color?: string;
      stages?: number;
      technologies?: string;
      isPublic?: boolean;
    },
  ): Promise<Roadmap> {
    return this.roadmapsService.updateRoadmap(roadmapId, data);
  }

  //удалить roadmap по id из общей БД
  @Delete(":id")
  async deleteRoadmap(@Param("id") roadmapId: string): Promise<Roadmap> {
    return this.roadmapsService.deleteRoadmap(roadmapId);
  }

  //получить roadmaps, которые привязаны к юзеру по id
  @Get("user/:userId")
  async getUserRoadmaps(
    @Param("userId") userId: string,
  ): Promise<(UserRoadmap & { roadmap: Roadmap })[]> {
    return this.roadmapsService.getUserRoadmaps(userId);
  }

  //привязать roadmap к юзеру по id
  @Post(":roadmapId/user/:userId")
  async addRoadmapToUser(
    @Param("roadmapId") roadmapId: string,
    @Param("userId") userId: string,
  ): Promise<void> {
    return this.roadmapsService.addRoadmapToUser(userId, roadmapId);
  }

  //отвязать roadmap от юзера по id
  @Delete(":roadmapId/user/:userId")
  async removeRoadmapFromUser(
    @Param("roadmapId") roadmapId: string,
    @Param("userId") userId: string,
  ): Promise<void> {
    return this.roadmapsService.removeRoadmapFromUser(userId, roadmapId);
  }

  //изменить прогресс roadmap у юзера по id
  @Put(":roadmapId/user/:userId/progress")
  async updateUserRoadmapProgress(
    @Param("roadmapId") roadmapId: string,
    @Param("userId") userId: string,
    @Body("progress") progress: number,
  ): Promise<void> {
    return this.roadmapsService.updateUserRoadmapProgress(
      userId,
      roadmapId,
      progress,
    );
  }

  // Получение пользовательских задач для роадмапа
  @Get(":roadmapId/user/:userId/tasks")
  async getUserRoadmapTasks(
    @Param("roadmapId") roadmapId: string,
    @Param("userId") userId: string
  ) {
    return this.roadmapsService.getUserRoadmapTasks(userId, roadmapId);
  }

  // Получение текущего прогресса по роадмапу с расчетом
  @Get(":roadmapId/user/:userId/progress")
  async calculateRoadmapProgress(
    @Param("roadmapId") roadmapId: string,
    @Param("userId") userId: string
  ) {
    return this.roadmapsService.calculateRoadmapProgress(userId, roadmapId);
  }

  // Удаление всех роадмапов пользователя
  @Delete("user/:userId/all")
  async removeAllUserRoadmaps(
    @Param("userId") userId: string
  ): Promise<void> {
    return this.roadmapsService.removeAllUserRoadmaps(userId);
  }

  // Добавление навыка к роадмапу
  @Post(":roadmapId/skills/:skillId")
  async addSkillToRoadmap(
    @Param("roadmapId") roadmapId: string,
    @Param("skillId") skillId: string
  ) {
    return this.roadmapsService.addSkillToRoadmap(roadmapId, skillId);
  }
}
