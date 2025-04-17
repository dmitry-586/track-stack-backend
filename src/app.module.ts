import { Module } from "@nestjs/common";
import { SkillsModule } from "./skills/skills.module";
import { RoadmapsModule } from "./roadmaps/roadmaps.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [SkillsModule, RoadmapsModule, UsersModule],
})
export class AppModule {}
