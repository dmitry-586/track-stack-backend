import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { Skill, Prisma } from "@prisma/client";

@Injectable()
export class SkillsService {
  constructor(private prisma: PrismaService) {}

  async getAllSkills(roadmapId?: string): Promise<Skill[]> {
    const skills = await this.prisma.skill.findMany();

    if (roadmapId) {
      return skills.filter((skill) =>
        (skill as { roadmapIds: string[] }).roadmapIds.includes(roadmapId)
      );
    }

    return skills;
  }

  async getSkillById(skillId: string): Promise<Skill | null> {
    return this.prisma.skill.findUnique({
      where: { skillId },
    });
  }

  async createSkill(name: string, roadmapIds: string[] = []): Promise<Skill> {
    return this.prisma.skill.create({
      data: {
        name,
        roadmapIds,
      },
    });
  }

  async updateSkill(skillId: string, name: string): Promise<Skill> {
    return this.prisma.skill.update({
      where: { skillId },
      data: { name },
    });
  }

  async deleteSkill(skillId: string): Promise<Skill> {
    return this.prisma.skill.delete({
      where: { skillId },
    });
  }

  async getUserSkills(userId: string, roadmapId?: string) {
    const whereCondition: Prisma.UserSkillWhereInput = {
      userId,
    };

    if (roadmapId) {
      whereCondition.skill = {
        roadmapIds: {
          has: roadmapId,
        },
      };
    }

    return this.prisma.userSkill.findMany({
      where: whereCondition,
      include: { skill: true },
    });
  }

  async addSkillToUser(userId: string, skillId: string): Promise<void> {
    await this.prisma.userSkill.create({
      data: {
        userId,
        skillId,
        progress: 0,
      },
    });
  }

  async removeSkillFromUser(userId: string, skillId: string): Promise<void> {
    await this.prisma.userSkill.delete({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
    });
  }

  async updateSkillProgress(
    userId: string,
    skillId: string,
    progress: number
  ): Promise<void> {
    const userSkill = await this.prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
    });

    if (!userSkill) {
      throw new HttpException(
        "Скилл не найден в данных пользователя",
        HttpStatus.BAD_REQUEST
      );
    }

    const focusSkill = await this.prisma.focusSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
    });

    const updates = [
      this.prisma.userSkill.update({
        where: {
          userId_skillId: {
            userId,
            skillId,
          },
        },
        data: { progress },
      }),
    ];

    if (focusSkill) {
      updates.push(
        this.prisma.focusSkill.update({
          where: {
            userId_skillId: {
              userId,
              skillId,
            },
          },
          data: { progress },
        })
      );
    }

    await this.prisma.$transaction(updates);
  }

  async getFocusSkills(userId: string, roadmapId?: string) {
    const whereCondition: Prisma.FocusSkillWhereInput = {
      userId: userId,
      skill: roadmapId
        ? {
            roadmapIds: {
              has: roadmapId,
            },
          }
        : undefined,
    };

    return this.prisma.focusSkill.findMany({
      where: whereCondition,
      include: { skill: true },
    });
  }

  async addSkillToFocus(userId: string, skillId: string): Promise<void> {
    const userSkill = await this.prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
    });

    if (!userSkill) {
      throw new HttpException(
        "Скилл не найден в данных пользователя",
        HttpStatus.BAD_REQUEST
      );
    }

    if (userSkill.progress < 50) {
      throw new HttpException(
        "Прогресс скилла должен быть не менее 50% для добавления в фокус",
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      await this.prisma.focusSkill.create({
        data: {
          userId,
          skillId,
          progress: userSkill.progress,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new HttpException(
          "Скилл уже добавлен в фокус",
          HttpStatus.CONFLICT
        );
      }
      throw new HttpException(
        "Произошла ошибка при добавлении скилла в фокус",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
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
    });
  }
}
