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
	constructor(private svc: HabitsService) {}

	@Get()
	async list(@CurrentUser() user: any) {
		return this.svc.findAllForUser(user.id);
	}

	@Post()
	async create(@CurrentUser() user: any, @Body() body: any) {
		return this.svc.createForUser(user, body);
	}

	@Patch(":id")
	async update(
		@CurrentUser() user: any,
		@Param("id") id: string,
		@Body() body: any
	) {
		return this.svc.update(user.id, id, body); // should return the updated habit
	}

	@Delete(":id")
	async delete(@CurrentUser() user: any, @Param("id") id: string) {
		return this.svc.delete(user.id, id);
	}

	@Post(":id/checkin")
	async checkin(
		@CurrentUser() user: any,
		@Param("id") id: string,
		@Body() body: any
	) {
		return this.svc.checkin(user.id, id, body?.date);
	}

	@Get(":id/records")
	async records(
		@CurrentUser() user: any,
		@Param("id") id: string,
		@Query("from") from?: string,
		@Query("to") to?: string
	) {
		return this.svc.getRecords(user.id, id, from, to);
	}
	
	@Get("stats")
	async stats(@CurrentUser() user: any) {
		return this.svc.stats(user.id);
	}
}

