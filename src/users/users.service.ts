import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany();
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { userId },
      include: {
        userRoadmaps: {
          include: { roadmap: true },
        },
        userSkills: {
          include: { skill: true },
        },
      },
    });
  }

  async createUser(email: string, password: string) {
    return this.prisma.user.create({
      data: {
        email,
        password,
      },
    });
  }

  async updateUser(userId: string, email: string, password: string) {
    return this.prisma.user.update({
      where: { userId },
      data: { email, password },
    });
  }

  async deleteUser(userId: string) {
    return this.prisma.user.delete({
      where: { userId },
    });
  }

  // Очистка всех данных пользователя без удаления самого пользователя
  async clearUserData(userId: string) {
    return this.prisma.$transaction(async (prisma) => {
      // Удаляем все роадмапы пользователя
      await prisma.userRoadmap.deleteMany({
        where: { userId },
      });

      // Удаляем все скиллы пользователя
      await prisma.userSkill.deleteMany({
        where: { userId },
      });

      // Удаляем все фокусные скиллы пользователя
      await prisma.focusSkill.deleteMany({
        where: { userId },
      });

      // Удаляем все задачи пользователя
      await prisma.userTask.deleteMany({
        where: { userId },
      });

      console.log(`All data for user ${userId} has been cleared`);
      
      return { 
        success: true, 
        message: "User data has been cleared successfully"
      };
    });
  }
}
