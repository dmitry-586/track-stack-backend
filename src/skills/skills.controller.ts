import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { SkillsService } from "./skills.service";
import { FocusSkill, Skill, UserSkill } from "@prisma/client";

@Controller("skills")
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  //получить все скиллы с фильтром по roadmapId
  @Get()
  async getAllSkills(@Query("roadmapId") roadmapId?: string): Promise<Skill[]> {
    return this.skillsService.getAllSkills(roadmapId);
  }

  //получить скилл по его id
  @Get(":id")
  async getSkillById(@Param("id") skillId: string): Promise<Skill | null> {
    return this.skillsService.getSkillById(skillId);
  }

  //добавить скилл в общую бд
  @Post()
  async createSkill(
    @Body("name") name: string,
    @Body("roadmapIds") roadmapIds: string[] = []
  ): Promise<Skill> {
    return this.skillsService.createSkill(name, roadmapIds);
  }

  //обновить скилл по id
  @Put(":id")
  async updateSkill(
    @Param("id") skillId: string,
    @Body("name") name: string
  ): Promise<Skill> {
    return this.skillsService.updateSkill(skillId, name);
  }

  //удалить скилл по id
  @Delete(":id")
  async deleteSkill(@Param("id") skillId: string): Promise<Skill> {
    return this.skillsService.deleteSkill(skillId);
  }

  //получить скиллы юзера
  @Get("user/:userId")
  async getUserSkills(
    @Param("userId") userId: string,
    @Query("roadmapId") roadmapId?: string
  ): Promise<UserSkill[]> {
    return this.skillsService.getUserSkills(userId, roadmapId);
  }

  //привязать скилл к юзеру по id
  @Post(":skillId/user/:userId")
  async addSkillToUser(
    @Param("skillId") skillId: string,
    @Param("userId") userId: string
  ): Promise<void> {
    return this.skillsService.addSkillToUser(userId, skillId);
  }

  //отвязать скилл от юзера по id
  @Delete(":skillId/user/:userId")
  async removeSkillFromUser(
    @Param("skillId") skillId: string,
    @Param("userId") userId: string
  ): Promise<void> {
    return this.skillsService.removeSkillFromUser(userId, skillId);
  }

  //получить фокус скиллы
  @Get("user/:userId/focus")
  async getFocusSkills(
    @Param("userId") userId: string,
    @Query("roadmapId") roadmapId?: string
  ): Promise<FocusSkill[]> {
    return this.skillsService.getFocusSkills(userId, roadmapId);
  }

  //привязать скилл к фокус скиллам
  @Post(":skillId/user/:userId/focus")
  async addSkillToFocus(
    @Param("skillId") skillId: string,
    @Param("userId") userId: string
  ): Promise<void> {
    return this.skillsService.addSkillToFocus(userId, skillId);
  }

  //отвязать скилл от фокус скиллов
  @Delete(":skillId/user/:userId/focus")
  async removeSkillFromFocus(
    @Param("skillId") skillId: string,
    @Param("userId") userId: string
  ): Promise<void> {
    return this.skillsService.removeSkillFromFocus(userId, skillId);
  }
}
