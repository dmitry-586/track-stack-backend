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
}
