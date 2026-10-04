/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, JwtUser } from '../user/user.decorator';
import { AllergyService } from './allergy.service';
import { CreateAllergyDto } from './dto/create-allergy.dto';

@Controller('allergies')
@UseGuards(AuthGuard)
export class AllergyController {
  constructor(private readonly allergyService: AllergyService) {}
  @Get() get(@CurrentUser() user: JwtUser) {
    return this.allergyService.findForUser(user.id);
  }
  @Post() create(@CurrentUser() user: JwtUser, @Body() dto: CreateAllergyDto) {
    return this.allergyService.createForUser(user.id, dto);
  }
  @Delete(':id') @HttpCode(204) remove(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
  ) {
    return this.allergyService.removeForUser(user.id, id);
  }
}
