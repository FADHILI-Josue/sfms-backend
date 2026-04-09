import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import type { AuthUser } from '../auth/types/auth-user.type';
import { FacilityAccessService } from '../facilities/facility-access.service';
import { ServiceProviderProfileEntity } from './entities/service-provider-profile.entity';
import { ServiceProgramEntity } from './entities/service-program.entity';
import { ServiceBeneficiaryEntity } from './entities/service-beneficiary.entity';
import { ServiceSessionEntity } from './entities/service-session.entity';
import { ServiceAttendanceEntity } from './entities/service-attendance.entity';
import { ServiceRatingEntity } from './entities/service-rating.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { CreateRatingDto } from './dto/create-rating.dto';
import { BeneficiaryStatus, ProgramStatus, SessionStatus, SessionType } from './service.enums';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceProviderProfileEntity)
    private readonly profiles: Repository<ServiceProviderProfileEntity>,
    @InjectRepository(ServiceProgramEntity)
    private readonly programs: Repository<ServiceProgramEntity>,
    @InjectRepository(ServiceBeneficiaryEntity)
    private readonly beneficiaries: Repository<ServiceBeneficiaryEntity>,
    @InjectRepository(ServiceSessionEntity)
    private readonly sessions: Repository<ServiceSessionEntity>,
    @InjectRepository(ServiceAttendanceEntity)
    private readonly attendance: Repository<ServiceAttendanceEntity>,
    @InjectRepository(ServiceRatingEntity)
    private readonly ratings: Repository<ServiceRatingEntity>,
    private readonly facilityAccess: FacilityAccessService,
  ) {}

  // ─── Core helpers ─────────────────────────────────────────────────────────

  private isSuperAdmin(user: AuthUser) {
    return (user.roles ?? []).includes('SUPER_ADMIN');
  }

  private isServiceProvider(user: AuthUser) {
    return (user.roles ?? []).includes('SERVICE_PROVIDER');
  }

  /** Gets or creates the profile for the current provider user */
  async getOrCreateProfile(userId: string): Promise<ServiceProviderProfileEntity> {
    let profile = await this.profiles.findOne({ where: { userId }, relations: { user: true } });
    if (!profile) {
      profile = this.profiles.create({ userId, skills: [], certifications: [] });
      profile = await this.profiles.save(profile);
      profile = await this.profiles.findOne({ where: { userId }, relations: { user: true } }) ?? profile;
    }
    return profile;
  }

  private async getProfileById(id: string): Promise<ServiceProviderProfileEntity> {
    const profile = await this.profiles.findOne({ where: { id }, relations: { user: true } });
    if (!profile) throw new NotFoundException('Provider profile not found.');
    return profile;
  }

  private async assertOwnsProfile(user: AuthUser, profileId: string) {
    const profile = await this.getProfileById(profileId);
    if (profile.userId !== user.id && !this.isSuperAdmin(user)) {
      throw new ForbiddenException('Access denied.');
    }
    return profile;
  }

  private async assertOwnsBeneficiary(user: AuthUser, id: string) {
    const profile = await this.getOrCreateProfile(user.id);
    const b = await this.beneficiaries.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Beneficiary not found.');
    if (b.providerId !== profile.id && !this.isSuperAdmin(user)) throw new ForbiddenException('Access denied.');
    return b;
  }

  private async assertOwnsProgram(user: AuthUser, id: string) {
    const profile = await this.getOrCreateProfile(user.id);
    const p = await this.programs.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Program not found.');
    if (p.providerId !== profile.id && !this.isSuperAdmin(user)) throw new ForbiddenException('Access denied.');
    return p;
  }

  private async assertOwnsSession(user: AuthUser, id: string) {
    const profile = await this.getOrCreateProfile(user.id);
    const s = await this.sessions.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Session not found.');
    if (s.providerId !== profile.id && !this.isSuperAdmin(user)) throw new ForbiddenException('Access denied.');
    return s;
  }

  // ─── Facility-scope helpers ────────────────────────────────────────────────

  /** Asserts user has access to the given facilityId (super admin always passes) */
  private async assertFacilityAccess(user: AuthUser, facilityId: string): Promise<void> {
    if (this.isSuperAdmin(user)) return;
    const scope = await this.facilityAccess.getScope(user);
    if (!scope.facilityIds.includes(facilityId)) {
      throw new ForbiddenException('You do not have access to this facility.');
    }
  }

  /** Returns all provider IDs associated with a facility, or empty array */
  private async getFacilityProviderIds(facilityId: string): Promise<string[]> {
    const rows = await this.profiles.find({ where: { facilityId }, select: { id: true } });
    return rows.map(r => r.id);
  }

  // ─── Profile ──────────────────────────────────────────────────────────────

  async getMyProfile(user: AuthUser) {
    const profile = await this.getOrCreateProfile(user.id);
    const avgRating = await this.ratings
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('r.providerId = :id', { id: profile.id })
      .getRawOne<{ avg: string; count: string }>();

    return {
      ...profile,
      avgRating: avgRating?.avg ? Math.round(Number(avgRating.avg) * 10) / 10 : null,
      totalReviews: Number(avgRating?.count ?? 0),
    };
  }

  async updateMyProfile(user: AuthUser, dto: UpdateProfileDto) {
    const profile = await this.getOrCreateProfile(user.id);
    if (dto.title !== undefined) profile.title = dto.title || null;
    if (dto.bio !== undefined) profile.bio = dto.bio || null;
    if (dto.phone !== undefined) profile.phone = dto.phone || null;
    if (dto.location !== undefined) profile.location = dto.location || null;
    if (dto.skills !== undefined) profile.skills = dto.skills.filter(Boolean);
    if (dto.certifications !== undefined) profile.certifications = dto.certifications.filter(Boolean);
    if (dto.availability !== undefined) profile.availability = dto.availability;
    if ('facilityId' in dto) profile.facilityId = dto.facilityId ?? null;
    return this.profiles.save(profile);
  }

  async listAllProviders(user: AuthUser) {
    if (!this.isSuperAdmin(user) && !user.permissions.includes('services.read')) {
      throw new ForbiddenException('Access denied.');
    }
    return this.profiles.find({ relations: { user: true } });
  }

  async getProviderProfile(user: AuthUser, profileId: string) {
    if (!this.isSuperAdmin(user) && !user.permissions.includes('services.read')) {
      throw new ForbiddenException('Access denied.');
    }
    return this.getProfileById(profileId);
  }

  // ─── Programs ─────────────────────────────────────────────────────────────

  async listPrograms(user: AuthUser) {
    const profile = await this.getOrCreateProfile(user.id);
    return this.programs.find({ where: { providerId: profile.id }, order: { createdAt: 'DESC' } });
  }

  async listProgramsForProvider(user: AuthUser, profileId: string) {
    if (!this.isSuperAdmin(user) && !user.permissions.includes('services.read')) {
      throw new ForbiddenException('Access denied.');
    }
    return this.programs.find({ where: { providerId: profileId }, order: { createdAt: 'DESC' } });
  }

  async createProgram(user: AuthUser, dto: CreateProgramDto) {
    const profile = await this.getOrCreateProfile(user.id);
    const program = this.programs.create({
      providerId: profile.id,
      name: dto.name,
      category: dto.category,
      description: dto.description ?? null,
      durationMinutes: dto.durationMinutes ?? 60,
      maxBeneficiaries: dto.maxBeneficiaries ?? 10,
      status: dto.status ?? ProgramStatus.DRAFT,
    });
    return this.programs.save(program);
  }

  async updateProgram(user: AuthUser, id: string, dto: UpdateProgramDto) {
    const program = await this.assertOwnsProgram(user, id);
    if (dto.name !== undefined) program.name = dto.name;
    if (dto.category !== undefined) program.category = dto.category;
    if (dto.description !== undefined) program.description = dto.description ?? null;
    if (dto.durationMinutes !== undefined) program.durationMinutes = dto.durationMinutes;
    if (dto.maxBeneficiaries !== undefined) program.maxBeneficiaries = dto.maxBeneficiaries;
    if (dto.status !== undefined) program.status = dto.status;
    return this.programs.save(program);
  }

  async deleteProgram(user: AuthUser, id: string) {
    await this.assertOwnsProgram(user, id);
    await this.programs.delete({ id });
    return { ok: true as const };
  }

  // ─── Beneficiaries ────────────────────────────────────────────────────────

  async listBeneficiaries(user: AuthUser, programId?: string) {
    const profile = await this.getOrCreateProfile(user.id);
    const where: Record<string, unknown> = { providerId: profile.id };
    if (programId) where.programId = programId;
    return this.beneficiaries.find({
      where: where as any,
      relations: { program: true },
      order: { enrolledAt: 'DESC' },
    });
  }

  async createBeneficiary(user: AuthUser, dto: CreateBeneficiaryDto) {
    const profile = await this.getOrCreateProfile(user.id);
    const program = await this.programs.findOne({ where: { id: dto.programId } });
    if (!program) throw new NotFoundException('Program not found.');
    if (program.providerId !== profile.id) throw new ForbiddenException('Program does not belong to you.');

    const b = this.beneficiaries.create({
      providerId: profile.id,
      programId: dto.programId,
      name: dto.name,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      totalSessions: dto.totalSessions ?? 20,
      sessionsCompleted: 0,
      status: dto.status ?? BeneficiaryStatus.ACTIVE,
      enrolledAt: new Date(),
      notes: dto.notes ?? null,
    });
    return this.beneficiaries.save(b);
  }

  async updateBeneficiary(user: AuthUser, id: string, dto: UpdateBeneficiaryDto) {
    const b = await this.assertOwnsBeneficiary(user, id);
    if (dto.name !== undefined) b.name = dto.name;
    if (dto.phone !== undefined) b.phone = dto.phone ?? null;
    if (dto.email !== undefined) b.email = dto.email ?? null;
    if (dto.totalSessions !== undefined) b.totalSessions = dto.totalSessions;
    if (dto.sessionsCompleted !== undefined) b.sessionsCompleted = dto.sessionsCompleted;
    if (dto.status !== undefined) b.status = dto.status;
    if (dto.notes !== undefined) b.notes = dto.notes ?? null;
    return this.beneficiaries.save(b);
  }

  async deleteBeneficiary(user: AuthUser, id: string) {
    await this.assertOwnsBeneficiary(user, id);
    await this.beneficiaries.delete({ id });
    return { ok: true as const };
  }

  // ─── Sessions ─────────────────────────────────────────────────────────────

  async listSessions(user: AuthUser, date?: string, weekStart?: string, weekEnd?: string) {
    const profile = await this.getOrCreateProfile(user.id);
    const qb = this.sessions
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.program', 'program')
      .where('s.providerId = :pid', { pid: profile.id });

    if (date) {
      qb.andWhere('s.scheduledDate = :date', { date });
    } else if (weekStart && weekEnd) {
      qb.andWhere('s.scheduledDate >= :start AND s.scheduledDate <= :end', { start: weekStart, end: weekEnd });
    }

    qb.orderBy('s.scheduledDate', 'ASC').addOrderBy('s.startTime', 'ASC');
    return qb.getMany();
  }

  async createSession(user: AuthUser, dto: CreateSessionDto) {
    const profile = await this.getOrCreateProfile(user.id);
    const program = await this.programs.findOne({ where: { id: dto.programId } });
    if (!program) throw new NotFoundException('Program not found.');
    if (program.providerId !== profile.id) throw new ForbiddenException('Program does not belong to you.');

    const session = this.sessions.create({
      providerId: profile.id,
      programId: dto.programId,
      scheduledDate: dto.scheduledDate,
      startTime: dto.startTime,
      durationMinutes: dto.durationMinutes ?? program.durationMinutes,
      type: dto.type ?? SessionType.INDIVIDUAL,
      status: dto.status ?? SessionStatus.PENDING,
      title: dto.title ?? null,
      beneficiaryId: dto.beneficiaryId ?? null,
    });
    const saved = await this.sessions.save(session);

    const activeBeneficiaries = await this.beneficiaries.find({
      where: { programId: dto.programId, status: BeneficiaryStatus.ACTIVE },
    });
    if (activeBeneficiaries.length > 0) {
      const records = activeBeneficiaries.map((b) =>
        this.attendance.create({ sessionId: saved.id, beneficiaryId: b.id, providerId: profile.id }),
      );
      await this.attendance.save(records);
    }

    return saved;
  }

  async updateSession(user: AuthUser, id: string, dto: UpdateSessionDto) {
    const session = await this.assertOwnsSession(user, id);
    if (dto.scheduledDate !== undefined) session.scheduledDate = dto.scheduledDate;
    if (dto.startTime !== undefined) session.startTime = dto.startTime;
    if (dto.durationMinutes !== undefined) session.durationMinutes = dto.durationMinutes;
    if (dto.type !== undefined) session.type = dto.type;
    if (dto.status !== undefined) session.status = dto.status;
    if (dto.title !== undefined) session.title = dto.title ?? null;
    if ('beneficiaryId' in dto) session.beneficiaryId = dto.beneficiaryId ?? null;
    return this.sessions.save(session);
  }

  async deleteSession(user: AuthUser, id: string) {
    await this.assertOwnsSession(user, id);
    await this.sessions.delete({ id });
    return { ok: true as const };
  }

  // ─── Attendance ───────────────────────────────────────────────────────────

  async listAttendance(user: AuthUser, date?: string) {
    const profile = await this.getOrCreateProfile(user.id);
    const qb = this.attendance
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.beneficiary', 'beneficiary')
      .leftJoinAndSelect('a.session', 'session')
      .leftJoinAndSelect('session.program', 'program')
      .where('a.providerId = :pid', { pid: profile.id });

    if (date) {
      qb.andWhere('session.scheduledDate = :date', { date });
    }

    qb.orderBy('session.startTime', 'ASC').addOrderBy('beneficiary.name', 'ASC');
    return qb.getMany();
  }

  async upsertAttendance(user: AuthUser, dto: UpsertAttendanceDto) {
    const profile = await this.getOrCreateProfile(user.id);

    const session = await this.sessions.findOne({ where: { id: dto.sessionId } });
    if (!session) throw new NotFoundException('Session not found.');
    if (session.providerId !== profile.id) throw new ForbiddenException('Access denied.');

    const beneficiary = await this.beneficiaries.findOne({ where: { id: dto.beneficiaryId } });
    if (!beneficiary) throw new NotFoundException('Beneficiary not found.');
    if (beneficiary.providerId !== profile.id) throw new ForbiddenException('Access denied.');

    let record = await this.attendance.findOne({
      where: { sessionId: dto.sessionId, beneficiaryId: dto.beneficiaryId },
    });

    if (!record) {
      record = this.attendance.create({
        sessionId: dto.sessionId,
        beneficiaryId: dto.beneficiaryId,
        providerId: profile.id,
      });
    }

    record.status = dto.status;
    record.checkIn = dto.checkIn ?? null;
    record.checkOut = dto.checkOut ?? null;
    record.notes = dto.notes ?? null;

    const saved = await this.attendance.save(record);
    await this.recalcBeneficiaryProgress(dto.beneficiaryId, profile.id);
    return saved;
  }

  private async recalcBeneficiaryProgress(beneficiaryId: string, providerId: string) {
    const presentCount = await this.attendance.count({
      where: { beneficiaryId, providerId, status: 'PRESENT' as any },
    });
    await this.beneficiaries.update({ id: beneficiaryId }, { sessionsCompleted: presentCount });
  }

  // ─── Ratings ──────────────────────────────────────────────────────────────

  async listMyRatings(user: AuthUser) {
    const profile = await this.getOrCreateProfile(user.id);
    return this.ratings.find({ where: { providerId: profile.id }, order: { createdAt: 'DESC' } });
  }

  async listRatingsForProvider(user: AuthUser, profileId: string) {
    if (!this.isSuperAdmin(user) && !user.permissions.includes('services.read')) {
      throw new ForbiddenException('Access denied.');
    }
    return this.ratings.find({ where: { providerId: profileId }, order: { createdAt: 'DESC' } });
  }

  async createRating(_user: AuthUser, dto: CreateRatingDto) {
    if (dto.rating < 1 || dto.rating > 5) throw new BadRequestException('Rating must be between 1 and 5.');
    const profile = await this.getProfileById(dto.providerId);
    const rating = this.ratings.create({
      providerId: profile.id,
      beneficiaryName: dto.beneficiaryName,
      rating: dto.rating,
      comment: dto.comment ?? null,
    });
    return this.ratings.save(rating);
  }

  // ─── Dashboard summary ────────────────────────────────────────────────────

  async getDashboardSummary(user: AuthUser) {
    const profile = await this.getOrCreateProfile(user.id);
    const pid = profile.id;
    const today = new Date().toISOString().slice(0, 10);

    const [activeBeneficiaries, totalBeneficiaries, totalPrograms, todaySessions, ratingRaw, recentBeneficiaries, recentRatings] =
      await Promise.all([
        this.beneficiaries.count({ where: { providerId: pid, status: BeneficiaryStatus.ACTIVE } }),
        this.beneficiaries.count({ where: { providerId: pid } }),
        this.programs.count({ where: { providerId: pid } }),
        this.sessions.find({
          where: { providerId: pid, scheduledDate: today },
          relations: { program: true },
          order: { startTime: 'ASC' },
        }),
        this.ratings
          .createQueryBuilder('r')
          .select('AVG(r.rating)', 'avg')
          .addSelect('COUNT(*)', 'count')
          .where('r.providerId = :pid', { pid })
          .getRawOne<{ avg: string; count: string }>(),
        this.beneficiaries.find({
          where: { providerId: pid },
          relations: { program: true },
          order: { updatedAt: 'DESC' },
          take: 6,
        }),
        this.ratings.find({
          where: { providerId: pid },
          order: { createdAt: 'DESC' },
          take: 3,
        }),
      ]);

    return {
      profile: {
        ...profile,
        avgRating: ratingRaw?.avg ? Math.round(Number(ratingRaw.avg) * 10) / 10 : null,
        totalReviews: Number(ratingRaw?.count ?? 0),
      },
      stats: {
        activeBeneficiaries,
        totalBeneficiaries,
        totalPrograms,
        todaySessionCount: todaySessions.length,
        avgRating: ratingRaw?.avg ? Math.round(Number(ratingRaw.avg) * 10) / 10 : null,
      },
      todaySessions,
      recentBeneficiaries,
      recentRatings,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FACILITY-SCOPED MANAGEMENT (Facility Owner / Admin / Operations Manager)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Aggregate stats for a specific facility */
  async getFacilityStats(user: AuthUser, facilityId: string) {
    await this.assertFacilityAccess(user, facilityId);
    const providerIds = await this.getFacilityProviderIds(facilityId);

    if (providerIds.length === 0) {
      return { totalProviders: 0, activeProviders: 0, totalPrograms: 0, activePrograms: 0, totalBeneficiaries: 0, activeBeneficiaries: 0, graduatedBeneficiaries: 0 };
    }

    const today = new Date().toISOString().slice(0, 10);
    const [totalPrograms, activePrograms, totalBeneficiaries, activeBeneficiaries, graduatedBeneficiaries, todaySessionCount] =
      await Promise.all([
        this.programs.count({ where: { providerId: In(providerIds) } }),
        this.programs.count({ where: { providerId: In(providerIds), status: ProgramStatus.ACTIVE } }),
        this.beneficiaries.count({ where: { providerId: In(providerIds) } }),
        this.beneficiaries.count({ where: { providerId: In(providerIds), status: BeneficiaryStatus.ACTIVE } }),
        this.beneficiaries.count({ where: { providerId: In(providerIds), status: BeneficiaryStatus.GRADUATED } }),
        this.sessions.count({ where: { providerId: In(providerIds), scheduledDate: today } }),
      ]);

    return {
      totalProviders: providerIds.length,
      totalPrograms,
      activePrograms,
      totalBeneficiaries,
      activeBeneficiaries,
      graduatedBeneficiaries,
      todaySessionCount,
    };
  }

  /** List all service providers associated with a facility */
  async listProvidersInFacility(user: AuthUser, facilityId: string) {
    await this.assertFacilityAccess(user, facilityId);
    const providers = await this.profiles.find({
      where: { facilityId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });

    // Augment each provider with their program count and avg rating
    return Promise.all(
      providers.map(async (p) => {
        const [programCount, activeBeneficiaries, ratingRaw] = await Promise.all([
          this.programs.count({ where: { providerId: p.id } }),
          this.beneficiaries.count({ where: { providerId: p.id, status: BeneficiaryStatus.ACTIVE } }),
          this.ratings
            .createQueryBuilder('r')
            .select('AVG(r.rating)', 'avg')
            .addSelect('COUNT(*)', 'count')
            .where('r.providerId = :id', { id: p.id })
            .getRawOne<{ avg: string; count: string }>(),
        ]);
        return {
          ...p,
          programCount,
          activeBeneficiaries,
          avgRating: ratingRaw?.avg ? Math.round(Number(ratingRaw.avg) * 10) / 10 : null,
          totalReviews: Number(ratingRaw?.count ?? 0),
        };
      }),
    );
  }

  /** List all programs across all providers in a facility */
  async listProgramsInFacility(user: AuthUser, facilityId: string) {
    await this.assertFacilityAccess(user, facilityId);
    const providerIds = await this.getFacilityProviderIds(facilityId);
    if (providerIds.length === 0) return [];

    return this.programs.find({
      where: { providerId: In(providerIds) },
      relations: { provider: { user: true } },
      order: { createdAt: 'DESC' },
    });
  }

  /** List all sessions across all providers in a facility (with optional date filter) */
  async listSessionsInFacility(user: AuthUser, facilityId: string, date?: string, weekStart?: string, weekEnd?: string) {
    await this.assertFacilityAccess(user, facilityId);
    const providerIds = await this.getFacilityProviderIds(facilityId);
    if (providerIds.length === 0) return [];

    const qb = this.sessions
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.program', 'program')
      .leftJoinAndSelect('s.provider', 'provider')
      .leftJoinAndSelect('provider.user', 'providerUser')
      .where('s.providerId IN (:...providerIds)', { providerIds });

    if (date) {
      qb.andWhere('s.scheduledDate = :date', { date });
    } else if (weekStart && weekEnd) {
      qb.andWhere('s.scheduledDate >= :start AND s.scheduledDate <= :end', { start: weekStart, end: weekEnd });
    }

    qb.orderBy('s.scheduledDate', 'ASC').addOrderBy('s.startTime', 'ASC');
    return qb.getMany();
  }

  /** List all beneficiaries across all providers in a facility */
  async listBeneficiariesInFacility(user: AuthUser, facilityId: string) {
    await this.assertFacilityAccess(user, facilityId);
    const providerIds = await this.getFacilityProviderIds(facilityId);
    if (providerIds.length === 0) return [];

    return this.beneficiaries.find({
      where: { providerId: In(providerIds) },
      relations: { program: true, provider: { user: true } },
      order: { enrolledAt: 'DESC' },
    });
  }

  /** Create a program on behalf of a provider in the facility */
  async createProgramForProvider(user: AuthUser, facilityId: string, profileId: string, dto: CreateProgramDto) {
    await this.assertFacilityAccess(user, facilityId);

    const profile = await this.profiles.findOne({ where: { id: profileId, facilityId } });
    if (!profile) throw new NotFoundException('Provider not found in this facility.');

    const program = this.programs.create({
      providerId: profile.id,
      name: dto.name,
      category: dto.category,
      description: dto.description ?? null,
      durationMinutes: dto.durationMinutes ?? 60,
      maxBeneficiaries: dto.maxBeneficiaries ?? 10,
      status: dto.status ?? ProgramStatus.DRAFT,
    });
    return this.programs.save(program);
  }

  /** Update any program in a facility (facility manager or super admin) */
  async updateFacilityProgram(user: AuthUser, facilityId: string, programId: string, dto: UpdateProgramDto) {
    await this.assertFacilityAccess(user, facilityId);

    const program = await this.programs.findOne({ where: { id: programId }, relations: { provider: true } });
    if (!program) throw new NotFoundException('Program not found.');
    if (!this.isSuperAdmin(user) && program.provider.facilityId !== facilityId) {
      throw new ForbiddenException('Program does not belong to this facility.');
    }

    if (dto.name !== undefined) program.name = dto.name;
    if (dto.category !== undefined) program.category = dto.category;
    if (dto.description !== undefined) program.description = dto.description ?? null;
    if (dto.durationMinutes !== undefined) program.durationMinutes = dto.durationMinutes;
    if (dto.maxBeneficiaries !== undefined) program.maxBeneficiaries = dto.maxBeneficiaries;
    if (dto.status !== undefined) program.status = dto.status;
    return this.programs.save(program);
  }

  /** Delete any program in a facility (facility manager or super admin) */
  async deleteFacilityProgram(user: AuthUser, facilityId: string, programId: string) {
    await this.assertFacilityAccess(user, facilityId);

    const program = await this.programs.findOne({ where: { id: programId }, relations: { provider: true } });
    if (!program) throw new NotFoundException('Program not found.');
    if (!this.isSuperAdmin(user) && program.provider.facilityId !== facilityId) {
      throw new ForbiddenException('Program does not belong to this facility.');
    }

    await this.programs.delete({ id: programId });
    return { ok: true as const };
  }

  /** Create a session for a provider in the facility */
  async createFacilitySession(user: AuthUser, facilityId: string, dto: CreateSessionDto) {
    await this.assertFacilityAccess(user, facilityId);

    const program = await this.programs.findOne({ where: { id: dto.programId }, relations: { provider: true } });
    if (!program) throw new NotFoundException('Program not found.');
    if (!this.isSuperAdmin(user) && program.provider.facilityId !== facilityId) {
      throw new ForbiddenException('Program does not belong to this facility.');
    }

    const session = this.sessions.create({
      providerId: program.providerId,
      programId: dto.programId,
      scheduledDate: dto.scheduledDate,
      startTime: dto.startTime,
      durationMinutes: dto.durationMinutes ?? program.durationMinutes,
      type: dto.type ?? SessionType.GROUP,
      status: dto.status ?? SessionStatus.CONFIRMED,
      title: dto.title ?? null,
      beneficiaryId: dto.beneficiaryId ?? null,
    });
    const saved = await this.sessions.save(session);

    // Auto-create attendance records for active beneficiaries
    const activeBeneficiaries = await this.beneficiaries.find({
      where: { programId: dto.programId, status: BeneficiaryStatus.ACTIVE },
    });
    if (activeBeneficiaries.length > 0) {
      const records = activeBeneficiaries.map((b) =>
        this.attendance.create({ sessionId: saved.id, beneficiaryId: b.id, providerId: program.providerId }),
      );
      await this.attendance.save(records);
    }

    return saved;
  }

  /** Update any session in a facility */
  async updateFacilitySession(user: AuthUser, facilityId: string, sessionId: string, dto: UpdateSessionDto) {
    await this.assertFacilityAccess(user, facilityId);

    const session = await this.sessions.findOne({ where: { id: sessionId }, relations: { provider: true } });
    if (!session) throw new NotFoundException('Session not found.');
    if (!this.isSuperAdmin(user) && session.provider.facilityId !== facilityId) {
      throw new ForbiddenException('Session does not belong to this facility.');
    }

    if (dto.scheduledDate !== undefined) session.scheduledDate = dto.scheduledDate;
    if (dto.startTime !== undefined) session.startTime = dto.startTime;
    if (dto.durationMinutes !== undefined) session.durationMinutes = dto.durationMinutes;
    if (dto.type !== undefined) session.type = dto.type;
    if (dto.status !== undefined) session.status = dto.status;
    if (dto.title !== undefined) session.title = dto.title ?? null;
    if ('beneficiaryId' in dto) session.beneficiaryId = dto.beneficiaryId ?? null;
    return this.sessions.save(session);
  }

  /** Delete any session in a facility */
  async deleteFacilitySession(user: AuthUser, facilityId: string, sessionId: string) {
    await this.assertFacilityAccess(user, facilityId);

    const session = await this.sessions.findOne({ where: { id: sessionId }, relations: { provider: true } });
    if (!session) throw new NotFoundException('Session not found.');
    if (!this.isSuperAdmin(user) && session.provider.facilityId !== facilityId) {
      throw new ForbiddenException('Session does not belong to this facility.');
    }

    await this.sessions.delete({ id: sessionId });
    return { ok: true as const };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUPER-ADMIN GLOBAL STATS
  // ═══════════════════════════════════════════════════════════════════════════

  async getAdminStats(user: AuthUser) {
    if (!this.isSuperAdmin(user)) throw new ForbiddenException('Admin access required.');
    const today = new Date().toISOString().slice(0, 10);
    const [totalProviders, totalPrograms, activePrograms, totalBeneficiaries, activeBeneficiaries, graduatedBeneficiaries, todaySessionCount] =
      await Promise.all([
        this.profiles.count(),
        this.programs.count(),
        this.programs.count({ where: { status: ProgramStatus.ACTIVE } }),
        this.beneficiaries.count(),
        this.beneficiaries.count({ where: { status: BeneficiaryStatus.ACTIVE } }),
        this.beneficiaries.count({ where: { status: BeneficiaryStatus.GRADUATED } }),
        this.sessions.count({ where: { scheduledDate: today } }),
      ]);

    return { totalProviders, totalPrograms, activePrograms, totalBeneficiaries, activeBeneficiaries, graduatedBeneficiaries, todaySessionCount };
  }
}
