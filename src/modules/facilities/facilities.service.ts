import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { RoleEntity } from '../access-control/entities/role.entity';
import type { AuthUser } from '../auth/types/auth-user.type';
import { UserEntity } from '../users/entities/user.entity';
import { FacilityEntity } from './entities/facility.entity';
import { CourtEntity } from './entities/court.entity';
import { BookingEntity } from '../bookings/entities/booking.entity';
import { CreateFacilityDto } from './dto/create-facility.dto';
import {
  FacilityOwnerState,
  ListFacilitiesQueryDto,
  SortDirection,
} from './dto/list-facilities.query.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';
import { FacilityApprovalStatus, FacilitySortField } from './facility.enums';
import { FacilityAccessService } from './facility-access.service';

export type EnrichedFacility = FacilityEntity & { courtsCapacity: number; courtsCount: number; bookingsCount: number };

type PaginatedFacilitiesResult = {
  items: EnrichedFacility[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const REMOVED_METADATA_KEYS = new Set([
  'amenities',
  'manager',
  'lighting',
  'surfaceType',
  'insuranceProvider',
  'insuranceExpiry',
]);

@Injectable()
export class FacilitiesService {
  constructor(
    @InjectRepository(FacilityEntity)
    private readonly facilities: Repository<FacilityEntity>,
    @InjectRepository(CourtEntity)
    private readonly courts: Repository<CourtEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookings: Repository<BookingEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roles: Repository<RoleEntity>,
    private readonly access: FacilityAccessService,
  ) {}

  list(user: AuthUser, query: ListFacilitiesQueryDto): Promise<PaginatedFacilitiesResult> {
    return this.listScoped(user, query, false);
  }

  async get(user: AuthUser, id: string) {
    const facility = await this.facilities.findOne({ where: { id } });
    if (!facility) throw new NotFoundException('Facility not found.');
    if (!this.access.isSuperAdmin(user)) {
      const visible = await this.access.assertFacilityIdsVisible(user, [id]);
      if (!visible) throw new NotFoundException('Facility not found.');
    }
    return facility;
  }

  create(user: AuthUser, dto: CreateFacilityDto) {
    const isSuperAdmin = this.access.isSuperAdmin(user);
    const isFacilityOwner = (user.roles ?? []).includes('FACILITY_OWNER');

    const facility = this.facilities.create({
      name: dto.name,
      type: dto.type,
      supportedSports: dto.supportedSports ?? [],
      amenities: this.resolveAmenities(dto.amenities, dto.metadata),
      dimensions: dto.dimensions ?? null,
      maxCapacity: dto.maxCapacity ?? null,
      status: dto.status,
      approvalStatus: isSuperAdmin
        ? FacilityApprovalStatus.APPROVED
        : FacilityApprovalStatus.PENDING,
      ownerId: isFacilityOwner ? user.id : null,
      approvedById: isSuperAdmin ? user.id : null,
      approvedAt: isSuperAdmin ? new Date() : null,
      rejectionReason: null,
      nextMaintenanceAt: dto.nextMaintenanceAt ?? null,
      peakRateCents: dto.peakRateCents ?? null,
      offPeakRateCents: dto.offPeakRateCents ?? null,
      mainImage: dto.mainImage ?? null,
      metadata: this.sanitizeMetadata(dto.metadata),
    });

    return this.facilities.save(facility);
  }

  async update(user: AuthUser, id: string, dto: UpdateFacilityDto) {
    const facility = await this.get(user, id);

    if (dto.name !== undefined) facility.name = dto.name;
    if (dto.type !== undefined) facility.type = dto.type;
    if (dto.supportedSports !== undefined) facility.supportedSports = dto.supportedSports;
    if (dto.amenities !== undefined || dto.metadata !== undefined) {
      facility.amenities = this.resolveAmenities(dto.amenities, dto.metadata, facility.amenities);
    }
    if (dto.dimensions !== undefined) facility.dimensions = dto.dimensions ?? null;
    if (dto.maxCapacity !== undefined) facility.maxCapacity = dto.maxCapacity ?? null;
    if (dto.status !== undefined) facility.status = dto.status;
    if (dto.nextMaintenanceAt !== undefined) facility.nextMaintenanceAt = dto.nextMaintenanceAt ?? null;
    if (dto.peakRateCents !== undefined) facility.peakRateCents = dto.peakRateCents ?? null;
    if (dto.offPeakRateCents !== undefined) facility.offPeakRateCents = dto.offPeakRateCents ?? null;
    if (dto.mainImage !== undefined) facility.mainImage = dto.mainImage ?? null;
    if (dto.metadata !== undefined) facility.metadata = this.sanitizeMetadata(dto.metadata);

    return this.facilities.save(facility);
  }

  async assignOwner(user: AuthUser, facilityId: string, ownerId: string) {
    if (!this.access.isSuperAdmin(user)) {
      throw new BadRequestException('Only SUPER_ADMIN can assign facility owners.');
    }

    const facility = await this.get(user, facilityId);
    if (facility.ownerId && facility.ownerId !== ownerId) {
      throw new BadRequestException('Facility already has an owner assigned.');
    }

    const owner = await this.users.findOne({ where: { id: ownerId }, relations: { roles: true } });
    if (!owner) throw new NotFoundException('Owner user not found.');

    const ownerRole = await this.roles.findOne({ where: { name: 'FACILITY_OWNER' } });
    if (!ownerRole) throw new BadRequestException('FACILITY_OWNER role is not seeded.');

    if (!(owner.roles ?? []).some((role) => role.name === ownerRole.name)) {
      owner.roles = [...(owner.roles ?? []), ownerRole];
      await this.users.save(owner);
    }

    facility.ownerId = owner.id;
    return this.facilities.save(facility);
  }

  async delete(user: AuthUser, id: string) {
    if (!this.access.isSuperAdmin(user)) throw new BadRequestException('Only SUPER_ADMIN can delete facilities.');
    await this.get(user, id);
    await this.facilities.delete({ id });
    return { ok: true };
  }

  async approve(user: AuthUser, id: string) {
    if (!this.access.isSuperAdmin(user)) throw new BadRequestException('Only SUPER_ADMIN can approve facilities.');
    const facility = await this.get(user, id);

    facility.approvalStatus = FacilityApprovalStatus.APPROVED;
    facility.approvedById = user.id;
    facility.approvedAt = new Date();
    facility.rejectionReason = null;

    return this.facilities.save(facility);
  }

  async reject(user: AuthUser, id: string, reason?: string) {
    if (!this.access.isSuperAdmin(user)) throw new BadRequestException('Only SUPER_ADMIN can reject facilities.');
    const facility = await this.get(user, id);

    facility.approvalStatus = FacilityApprovalStatus.REJECTED;
    facility.approvedById = user.id;
    facility.approvedAt = new Date();
    facility.rejectionReason = reason?.trim() ? reason.trim() : null;

    return this.facilities.save(facility);
  }

  listPublic(query: ListFacilitiesQueryDto): Promise<PaginatedFacilitiesResult> {
    return this.listScoped(undefined, query, true);
  }

  private async listScoped(
    user: AuthUser | undefined,
    query: ListFacilitiesQueryDto,
    publicOnly: boolean,
  ): Promise<PaginatedFacilitiesResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;

    const qb = this.facilities
      .createQueryBuilder('facility')
      .leftJoinAndSelect('facility.owner', 'owner');

    if (publicOnly) {
      qb.andWhere('facility.approvalStatus = :approvalStatus', {
        approvalStatus: FacilityApprovalStatus.APPROVED,
      });
    } else if (user && !this.access.isSuperAdmin(user)) {
      const scope = await this.access.getScope(user);
      if (scope.facilityIds.length === 0) {
        return { items: [], total: 0, page, pageSize, totalPages: 0 };
      }
      qb.andWhere('facility.id IN (:...facilityIds)', { facilityIds: scope.facilityIds });
    }

    if (query.search?.trim()) {
      qb.andWhere('(LOWER(facility.name) LIKE :search OR LOWER(COALESCE(facility.dimensions, \'\')) LIKE :search)', {
        search: `%${query.search.trim().toLowerCase()}%`,
      });
    }

    if (query.status) qb.andWhere('facility.status = :status', { status: query.status });
    if (query.type) qb.andWhere('facility.type = :type', { type: query.type });
    if (query.approvalStatus && !publicOnly) {
      qb.andWhere('facility.approvalStatus = :approvalStatus', { approvalStatus: query.approvalStatus });
    }
    if (query.ownerId) qb.andWhere('facility.ownerId = :ownerId', { ownerId: query.ownerId });
    if (query.ownerState === FacilityOwnerState.ASSIGNED) {
      qb.andWhere('facility.ownerId IS NOT NULL');
    }
    if (query.ownerState === FacilityOwnerState.UNASSIGNED) {
      qb.andWhere('facility.ownerId IS NULL');
    }
    if (query.sport) {
      qb.andWhere(
        "(facility.supportedSports = :sport OR facility.supportedSports LIKE :sportPrefix OR facility.supportedSports LIKE :sportMiddle OR facility.supportedSports LIKE :sportSuffix)",
        {
          sport: query.sport,
          sportPrefix: `${query.sport},%`,
          sportMiddle: `%,${query.sport},%`,
          sportSuffix: `%,${query.sport}`,
        },
      );
    }

    this.applySort(qb, query.sortBy ?? FacilitySortField.CREATED_AT, query.sortDirection ?? SortDirection.DESC);

    qb.skip((page - 1) * pageSize).take(pageSize);

    const [raw, total] = await qb.getManyAndCount();

    const facilityIds = raw.map((f) => f.id);
    const enriched = await this.enrichWithCourtsAndBookings(raw, facilityIds);

    return {
      items: enriched,
      total,
      page,
      pageSize,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
    };
  }

  private async enrichWithCourtsAndBookings(
    items: FacilityEntity[],
    facilityIds: string[],
  ): Promise<EnrichedFacility[]> {
    if (facilityIds.length === 0) return [];

    const courtRows = await this.courts
      .createQueryBuilder('court')
      .select('court.facilityId', 'facilityId')
      .addSelect('COALESCE(SUM(court.maxCapacity), 0)', 'courtsCapacity')
      .addSelect('COUNT(*)', 'courtsCount')
      .where('court.facilityId IN (:...ids)', { ids: facilityIds })
      .andWhere('court.isActive = :active', { active: true })
      .groupBy('court.facilityId')
      .getRawMany<{ facilityId: string; courtsCapacity: string; courtsCount: string }>();

    const bookingRows = await this.bookings
      .createQueryBuilder('booking')
      .select('booking.facilityId', 'facilityId')
      .addSelect('COUNT(*)', 'bookingsCount')
      .where('booking.facilityId IN (:...ids)', { ids: facilityIds })
      .groupBy('booking.facilityId')
      .getRawMany<{ facilityId: string; bookingsCount: string }>();

    const capacityMap = new Map(courtRows.map((r) => [r.facilityId, Number(r.courtsCapacity)]));
    const courtsCountMap = new Map(courtRows.map((r) => [r.facilityId, Number(r.courtsCount)]));
    const bookingsMap = new Map(bookingRows.map((r) => [r.facilityId, Number(r.bookingsCount)]));

    return items.map((f) =>
      Object.assign(f, {
        courtsCapacity: capacityMap.get(f.id) ?? 0,
        courtsCount: courtsCountMap.get(f.id) ?? 0,
        bookingsCount: bookingsMap.get(f.id) ?? 0,
      }),
    );
  }

  private applySort(
    qb: SelectQueryBuilder<FacilityEntity>,
    sortBy: FacilitySortField,
    sortDirection: SortDirection,
  ) {
    const fieldMap: Record<FacilitySortField, string> = {
      [FacilitySortField.CREATED_AT]: 'facility.createdAt',
      [FacilitySortField.UPDATED_AT]: 'facility.updatedAt',
      [FacilitySortField.NAME]: 'facility.name',
      [FacilitySortField.STATUS]: 'facility.status',
      [FacilitySortField.TYPE]: 'facility.type',
      [FacilitySortField.APPROVAL_STATUS]: 'facility.approvalStatus',
    };

    qb.orderBy(fieldMap[sortBy], sortDirection);
  }

  private normalizeAmenities(value: string[] | undefined) {
    return Array.from(
      new Set((value ?? []).map((item) => item.trim()).filter((item) => item.length > 0)),
    );
  }

  private resolveAmenities(
    amenities: string[] | undefined,
    metadata: Record<string, unknown> | null | undefined,
    fallback: string[] = [],
  ) {
    if (amenities !== undefined) return this.normalizeAmenities(amenities);
    const metadataAmenities = Array.isArray(metadata?.amenities)
      ? (metadata?.amenities as unknown[]).filter((item): item is string => typeof item === 'string')
      : fallback;
    return this.normalizeAmenities(metadataAmenities);
  }

  private sanitizeMetadata(metadata: Record<string, unknown> | null | undefined) {
    if (!metadata) return null;

    const next = Object.fromEntries(
      Object.entries(metadata).filter(([key]) => !REMOVED_METADATA_KEYS.has(key)),
    );

    return Object.keys(next).length > 0 ? next : null;
  }
}
