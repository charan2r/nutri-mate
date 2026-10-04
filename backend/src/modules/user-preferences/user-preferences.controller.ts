/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, JwtUser } from '../user/user.decorator';
import { CreateUserPreferenceDto } from './dto/create-user-preference.dto';
import { UserPreferencesService } from './user-preferences.service';

@Controller('preferences')
@UseGuards(AuthGuard)
export class UserPreferencesController {
  constructor(private readonly preferencesService: UserPreferencesService) {}
  @Get() get(@CurrentUser() user: JwtUser) {
    return this.preferencesService.findForUser(user.id);
  }
  @Put() put(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateUserPreferenceDto,
  ) {
    return this.preferencesService.upsertForUser(user.id, dto);
  }
}
