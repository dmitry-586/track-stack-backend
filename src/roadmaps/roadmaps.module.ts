import { Module } from "@nestjs/common";
import { RoadmapsController } from "./roadmaps.controller";
import { RoadmapsService } from "./roadmaps.service";
import { PrismaService } from "src/prisma.service";

@Module({
  controllers: [RoadmapsController],
  providers: [RoadmapsService, PrismaService],
})
export class RoadmapsModule {}
