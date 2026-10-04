import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtUser } from '../user/user.decorator';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register') register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
  @Post('login') login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
  @Post('refresh') refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }
  @Get('me') @UseGuards(AuthGuard) me(@CurrentUser() user: JwtUser) {
    return this.authService.getMe(user.id);
  }
}
