import { Body, Controller, Get, Post, Res, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from './types/auth-user.type';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AuthService } from './auth.service';
import { RegisterFacilityDto } from './dto/register-facility.dto';
import { getCookieValue } from '../../common/security/cookie-utils';
@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  private setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    const isProd = (process.env.NODE_ENV ?? 'development') === 'production';
    const accessTtlSeconds = this.config.get<number>('auth.jwtAccessTtlSeconds', 900);
    const refreshTtlSeconds = this.config.get<number>('auth.jwtRefreshTtlSeconds', 60 * 60 * 24 * 7);

    const base = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
    };

    res.cookie('accessToken', tokens.accessToken, {
      ...base,
      path: '/',
      maxAge: accessTtlSeconds * 1000,
    });
    res.cookie('refreshToken', tokens.refreshToken, {
      ...base,
      path: '/',
      maxAge: refreshTtlSeconds * 1000,
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
  }

  @Public()
  @Post('register-facility')
  @ApiOkResponse({ description: 'Registers a facility and owner user.' })
  async registerFacility(@Res({ passthrough: true }) res: Response, @Body() dto: RegisterFacilityDto) {
    const result = await this.auth.registerFacility(dto);
    this.setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
    return result;
  }

  @Public()
  @Post('login')
  @ApiOkResponse({ description: 'Returns access + refresh tokens.' })
  async login(@Res({ passthrough: true }) res: Response, @Body() dto: LoginDto) {
    const result = await this.auth.login(dto);
    this.setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
    return result;
  }

  @Public()
  @Post('refresh')
  @ApiOkResponse({ description: 'Rotates refresh token.' })
  async refresh(@Res({ passthrough: true }) res: Response, @Body() dto: RefreshDto) {
    const header = res.req?.headers?.cookie as string | undefined;
    const token = dto.refreshToken ?? getCookieValue(header, 'refreshToken');
    if (!token) throw new UnauthorizedException('Missing refresh token.');
    const result = await this.auth.refresh(token);
    this.setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
    return result;
  }

  @Post('logout')
  @ApiBearerAuth()
  async logout(@Res({ passthrough: true }) res: Response, @CurrentUser() user: AuthUser) {
    this.clearAuthCookies(res);
    return this.auth.logout(user.id);
  }

  @Get('me')
  @ApiBearerAuth()
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }
}
