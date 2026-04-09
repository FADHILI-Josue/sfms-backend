import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { hashSecret } from '../../common/security/password-hasher';
import type { AuthUser } from '../auth/types/auth-user.type';
import { RoleEntity } from '../access-control/entities/role.entity';
import { FacilityEntity } from '../facilities/entities/facility.entity';
import { FacilityApprovalStatus, FacilityStatus, FacilityType } from '../facilities/facility.enums';
import { UserEntity } from '../users/entities/user.entity';
import { MailerService } from '../mailer/mailer.service';
import { FacilityApplicationStatus } from './facility-application.enums';
import { FacilityApplicationEntity } from './entities/facility-application.entity';
import { SubmitFacilityApplicationDto } from './dto/submit-facility-application.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditCategory, AuditSeverity } from '../audit-logs/audit.enums';

function generateTempPassword() {
  return `Temp${Math.random().toString(36).slice(2, 8)}!${Math.random().toString(10).slice(2, 6)}`;
}

@Injectable()
export class FacilityApplicationsService {
  private readonly logger = new Logger(FacilityApplicationsService.name);

  constructor(
    @InjectRepository(FacilityApplicationEntity)
    private readonly applications: Repository<FacilityApplicationEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(RoleEntity) private readonly roles: Repository<RoleEntity>,
    @InjectRepository(FacilityEntity) private readonly facilities: Repository<FacilityEntity>,
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
    private readonly audit: AuditLogsService,
  ) {}

  async submit(dto: SubmitFacilityApplicationDto) {
    const app = this.applications.create({
      ownerName: dto.ownerName,
      ownerEmail: dto.ownerEmail.toLowerCase(),
      ownerPhone: dto.ownerPhone?.trim() ? dto.ownerPhone.trim() : null,
      organization: dto.organization?.trim() ? dto.organization.trim() : null,
      facilityName: dto.facilityName,
      facilityTypeLabel: dto.facilityTypeLabel,
      requestedSports: dto.requestedSports ?? [],
      location: dto.location?.trim() ? dto.location.trim() : null,
      capacity: dto.capacity ?? null,
      dimensions: dto.dimensions?.trim() ? dto.dimensions.trim() : null,
      amenities: dto.amenities?.trim() ? dto.amenities.trim() : null,
      description: dto.description?.trim() ? dto.description.trim() : null,
      status: FacilityApplicationStatus.PENDING,
      decidedById: null,
      decisionReason: null,
    });
    const saved = await this.applications.save(app);
    void this.audit.record({
      action: 'APPLICATION_SUBMITTED',
      category: AuditCategory.APPLICATION,
      actorId: null,
      actorName: dto.ownerName,
      targetType: 'FacilityApplication',
      targetId: saved.id,
      details: { facilityName: dto.facilityName, ownerEmail: dto.ownerEmail },
    });
    return saved;
  }

  list() {
    return this.applications.find({ order: { createdAt: 'DESC' }, take: 200 });
  }

  async approve(decider: AuthUser, id: string) {
    const app = await this.applications.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Application not found.');
    if (app.status !== FacilityApplicationStatus.PENDING) {
      throw new BadRequestException('Application has already been decided.');
    }

    const facilityOwnerRole = await this.roles.findOne({ where: { name: 'FACILITY_OWNER' } });
    if (!facilityOwnerRole) throw new BadRequestException('FACILITY_OWNER role is not seeded.');

    let owner = await this.users.findOne({ where: { email: app.ownerEmail }, relations: { roles: true } });
    let temporaryPassword: string | null = null;

    if (!owner) {
      temporaryPassword = generateTempPassword();
      owner = this.users.create({
        email: app.ownerEmail,
        fullName: app.ownerName,
        passwordHash: await hashSecret(temporaryPassword),
        roles: [facilityOwnerRole],
      });
      owner = await this.users.save(owner);
    } else if (!(owner.roles ?? []).some((r) => r.name === 'FACILITY_OWNER')) {
      owner.roles = [...(owner.roles ?? []), facilityOwnerRole];
      owner = await this.users.save(owner);
    }

    const facility = this.facilities.create({
      name: app.facilityName,
      type: /indoor/i.test(app.facilityTypeLabel) ? FacilityType.INDOOR : FacilityType.OUTDOOR,
      supportedSports: app.requestedSports ?? [],
      amenities: app.amenities
        ?.split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0) ?? [],
      dimensions: app.dimensions,
      maxCapacity: app.capacity,
      status: FacilityStatus.AVAILABLE,
      approvalStatus: FacilityApprovalStatus.APPROVED,
      ownerId: owner.id,
      approvedById: decider.id,
      approvedAt: new Date(),
      rejectionReason: null,
      nextMaintenanceAt: null,
      peakRateCents: null,
      offPeakRateCents: null,
      metadata: {
        location: app.location,
        facilityTypeLabel: app.facilityTypeLabel,
        description: app.description,
        organization: app.organization,
        ownerPhone: app.ownerPhone,
      },
    });
    const createdFacility = await this.facilities.save(facility);

    app.status = FacilityApplicationStatus.APPROVED;
    app.decidedById = decider.id;
    app.decisionReason = null;
    await this.applications.save(app);

    const appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:8080';
    const template = this.mailer.buildFacilityApplicationApprovedTemplate({
      customerName: app.ownerName,
      facilityName: app.facilityName,
      dashboardUrl: `${appUrl}/owner`,
      ...(temporaryPassword
        ? { loginEmail: app.ownerEmail, temporaryPassword }
        : {}),
    });

    this.mailer.send({ to: app.ownerEmail, ...template }).catch((err) => {
      this.logger.error(`Failed to send approval email to ${app.ownerEmail}: ${err.message}`);
    });

    void this.audit.record({
      action: 'APPLICATION_APPROVED',
      category: AuditCategory.APPLICATION,
      actorId: decider.id,
      actorName: decider.fullName,
      targetType: 'FacilityApplication',
      targetId: app.id,
      details: { facilityName: app.facilityName, ownerEmail: app.ownerEmail, newFacilityId: createdFacility.id },
    });

    return { application: app, facility: createdFacility, owner, temporaryPassword };
  }

  async reject(decider: AuthUser, id: string, reason?: string) {
    const app = await this.applications.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Application not found.');
    if (app.status !== FacilityApplicationStatus.PENDING) {
      throw new BadRequestException('Application has already been decided.');
    }

    app.status = FacilityApplicationStatus.REJECTED;
    app.decidedById = decider.id;
    app.decisionReason = reason?.trim() ? reason.trim() : null;
    await this.applications.save(app);

    void this.audit.record({
      action: 'APPLICATION_REJECTED',
      category: AuditCategory.APPLICATION,
      severity: AuditSeverity.WARNING,
      actorId: decider.id,
      actorName: decider.fullName,
      targetType: 'FacilityApplication',
      targetId: app.id,
      details: { facilityName: app.facilityName, ownerEmail: app.ownerEmail, reason: app.decisionReason },
    });

    return app;
  }
}
