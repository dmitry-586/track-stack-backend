import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { Roadmap, UserRoadmap } from "@prisma/client";

@Injectable()
export class RoadmapsService {
  constructor(private prisma: PrismaService) {}

  async getAllRoadmaps(): Promise<Roadmap[]> {
    return this.prisma.roadmap.findMany();
  }

  async getUserRoadmaps(
    userId: string
  ): Promise<(UserRoadmap & { roadmap: Roadmap })[]> {
    return this.prisma.userRoadmap.findMany({
      where: { userId },
      include: {
        roadmap: true,
      },
    });
  }

  async getRoadmapById(roadmapId: string): Promise<Roadmap | null> {
    return this.prisma.roadmap.findUnique({
      where: { roadmapId },
    });
  }

  async createRoadmap(data: {
    roadmapId: string;
    title: string;
    complexity: string;
    color: string;
    stages: number;
    technologies: string;
  }): Promise<Roadmap> {
    return this.prisma.roadmap.create({ data });
  }

  async updateRoadmap(
    roadmapId: string,
    data: {
      title?: string;
      complexity?: string;
      color?: string;
      stages?: number;
      technologies?: string;
      isPublic?: boolean;
    }
  ): Promise<Roadmap> {
    return this.prisma.roadmap.update({
      where: { roadmapId },
      data,
    });
  }

  async deleteRoadmap(roadmapId: string): Promise<Roadmap> {
    return this.prisma.roadmap.delete({
      where: { roadmapId },
    });
  }

  async addRoadmapToUser(userId: string, roadmapId: string): Promise<void> {
    await this.prisma.userRoadmap.create({
      data: {
        userId,
        roadmapId,
        progress: 0,
      },
    });
  }

  async removeRoadmapFromUser(
    userId: string,
    roadmapId: string
  ): Promise<void> {
    await this.prisma.userRoadmap.delete({
      where: {
        userId_roadmapId: {
          userId,
          roadmapId,
        },
      },
    });
  }

  async updateUserRoadmapProgress(
    userId: string,
    roadmapId: string,
    progress: number
  ): Promise<void> {
    await this.prisma.userRoadmap.update({
      where: {
        userId_roadmapId: {
          userId,
          roadmapId,
        },
      },
      data: { progress },
    });
  }
}
