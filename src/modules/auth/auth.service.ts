import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FacilityEntity } from '../facilities/entities/facility.entity';
import { FacilityStaffEntity } from '../facilities/entities/facility-staff.entity';
import { UserEntity } from '../users/entities/user.entity';
import type { JwtPayload } from './types/jwt-payload.type';
import { LoginDto } from './dto/login.dto';
import { hashSecret, verifySecret } from '../../common/security/password-hasher';

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(FacilityEntity) private readonly facilities: Repository<FacilityEntity>,
    @InjectRepository(FacilityStaffEntity) private readonly staff: Repository<FacilityStaffEntity>,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.users.findOne({
      where: { email: dto.email.toLowerCase() },
      relations: { roles: { permissions: true } } as any,
    });

    if (!user) throw new UnauthorizedException('Invalid credentials.');

    const passwordOk = await verifySecret(user.passwordHash, dto.password);
    if (!passwordOk) throw new UnauthorizedException('Invalid credentials.');

    user.lastLoginAt = new Date();
    await this.users.save(user);

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    const refreshSecret = this.config.get<string>('auth.jwtRefreshSecret');
    let decoded: JwtPayload;

    try {
      decoded = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const user = await this.users.findOne({
      where: { id: decoded.sub },
      relations: { roles: { permissions: true } } as any,
    });
    if (!user || !user.refreshTokenHash) throw new UnauthorizedException('Refresh token revoked.');

    const matches = await verifySecret(user.refreshTokenHash, refreshToken);
    if (!matches) throw new UnauthorizedException('Refresh token revoked.');

    return this.issueTokens(user);
  }

  async logout(userId: string) {
    await this.users.update({ id: userId }, { refreshTokenHash: null });
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: { roles: { permissions: true } } as any,
    });
    if (!user) throw new UnauthorizedException('Invalid credentials.');

    const roles = (user.roles ?? []).map((r) => r.name);
    const permissions = (user.roles ?? [])
      .flatMap((r) => r.permissions ?? [])
      .map((p) => p.key);
    const uniquePermissions = Array.from(new Set(permissions));

    const [ownedFacilities, assignments] = await Promise.all([
      this.facilities.find({ where: { ownerId: userId }, select: { id: true } }),
      this.staff.find({
        where: { userId, isActive: true },
        select: { facilityId: true, roleName: true, courtIds: true },
      }),
    ]);

    const facilityIds = new Set<string>(ownedFacilities.map((f) => f.id));
    const courtIdsByFacilityId: Record<string, string[] | null> = {};

    for (const a of assignments) {
      facilityIds.add(a.facilityId);
      const existing = courtIdsByFacilityId[a.facilityId] ?? undefined;
      if (a.courtIds == null || a.courtIds.length === 0) {
        courtIdsByFacilityId[a.facilityId] = null;
        continue;
      }
      if (existing === null) continue;
      const merged = new Set<string>([...(existing ?? []), ...a.courtIds]);
      courtIdsByFacilityId[a.facilityId] = Array.from(merged);
    }

    for (const f of ownedFacilities) {
      if (courtIdsByFacilityId[f.id] === undefined) courtIdsByFacilityId[f.id] = null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles,
        permissions: uniquePermissions,
      },
      scope: {
        facilityIds: Array.from(facilityIds),
        courtIdsByFacilityId,
        staffAssignments: assignments,
      },
    };
  }

  private async issueTokens(user: UserEntity) {
    const accessSecret = this.config.get<string>('auth.jwtAccessSecret');
    const refreshSecret = this.config.get<string>('auth.jwtRefreshSecret');
    const accessTtlSeconds = this.config.get<number>('auth.jwtAccessTtlSeconds');
    const refreshTtlSeconds = this.config.get<number>('auth.jwtRefreshTtlSeconds');

    const roles = (user.roles ?? []).map((r) => r.name);
    const permissions = (user.roles ?? [])
      .flatMap((r) => r.permissions ?? [])
      .map((p) => p.key);
    const uniquePermissions = Array.from(new Set(permissions));

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
      perms: uniquePermissions,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessTtlSeconds,
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: refreshTtlSeconds,
    });

    const refreshTokenHash = await hashSecret(refreshToken);
    await this.users.update({ id: user.id }, { refreshTokenHash });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles,
        permissions: uniquePermissions,
      },
    };
  }
}
