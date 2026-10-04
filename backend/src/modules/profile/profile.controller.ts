import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, JwtUser } from '../user/user.decorator';
import { CreateProfileDto } from './dto/create-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}
  @Get() get(@CurrentUser() user: JwtUser) {
    return this.profileService.findForUser(user.id);
  }
  @Put() put(@CurrentUser() user: JwtUser, @Body() dto: CreateProfileDto) {
    return this.profileService.upsertForUser(user.id, dto);
  }
}
