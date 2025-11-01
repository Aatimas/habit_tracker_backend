import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	UseGuards,
	Query,
} from "@nestjs/common";
import { HabitsService } from "./habits.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/user.decorator";

@Controller("habits")
@UseGuards(JwtAuthGuard)
export class HabitsController {
	constructor(private habitService: HabitsService) {}

	@Get()
	async list(@CurrentUser() user: any) {
		return this.habitService.findAllForUser(user.id);
	}

	@Post()
	async create(@CurrentUser() user: any, @Body() body: any) {
		return this.habitService.create(user, body);
	}

	@Patch(":id")
	async update(
		@CurrentUser() user: any,
		@Param("id") id: string,
		@Body() body: any
	) {
		return this.habitService.update(user.id, id, body); // should return the updated habit
	}

	@Delete(":id")
	async delete(@CurrentUser() user: any, @Param("id") id: string) {
		return this.habitService.delete(user.id, id);
	}

	@Post(":id/checkIn")
	async checkIn(
		@CurrentUser() user: any,
		@Param("id") id: string,
		@Body() body: any
	) {
		return this.habitService.checkIn(user.id, id, body?.date);
	}

	@Get(":id/records")
	async records(
		@CurrentUser() user: any,
		@Param("id") id: string,
		@Query("from") from?: string,
		@Query("to") to?: string
	) {
		return this.habitService.getRecords(user.id, id, from, to);
	}
	
	@Get("stats")
	async stats(@CurrentUser() user: any) {
		return this.habitService.stats(user.id);
	}
}

