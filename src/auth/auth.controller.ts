import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(dto.name, dto.email, dto.password);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto.email, dto.password);
  }
}
