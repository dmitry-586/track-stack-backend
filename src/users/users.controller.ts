import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { User } from "@prisma/client";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers(): Promise<User[]> {
    return this.usersService.getAllUsers();
  }

  @Get(":userId")
  async getUserById(@Param("userId") userId: string): Promise<User> {
    const user = await this.usersService.getUserById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  @Post()
  async createUser(
    @Body("email") email: string,
    @Body("password") password: string,
  ) {
    return await this.usersService.createUser(email, password);
  }

  @Put(":userId")
  async updateUser(
    @Param("userId") userId: string,
    @Body("email") email: string,
    @Body("password") password: string,
  ) {
    return await this.usersService.updateUser(userId, password, email);
  }

  @Delete(":userId")
  async deleteUser(@Param("userId") userId: string) {
    return await this.usersService.deleteUser(userId);
  }
}
