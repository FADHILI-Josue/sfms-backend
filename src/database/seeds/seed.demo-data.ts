import { Repository } from 'typeorm';

import { CourtEntity } from '../../modules/facilities/entities/court.entity';
import { FacilityEntity } from '../../modules/facilities/entities/facility.entity';
import { FacilityApprovalStatus, FacilityStatus, FacilityType } from '../../modules/facilities/facility.enums';
import { BookingEntity } from '../../modules/bookings/entities/booking.entity';
import { BookingStatus, BookingType, Recurrence } from '../../modules/bookings/booking.enums';
import { MemberEntity } from '../../modules/memberships/entities/member.entity';
import { MembershipCategory, MembershipStatus, PaymentPlan } from '../../modules/memberships/membership.enums';
import { PaymentEntity } from '../../modules/payments/entities/payment.entity';
import { PaymentMethod, PaymentStatus } from '../../modules/payments/payment.enums';

export async function seedDemoData(opts: {
  facilitiesRepo: Repository<FacilityEntity>;
  courtsRepo: Repository<CourtEntity>;
  membersRepo: Repository<MemberEntity>;
  bookingsRepo: Repository<BookingEntity>;
  paymentsRepo: Repository<PaymentEntity>;
  ownerUserId: string;
  superAdminUserId: string;
}) {
  const facilitiesByName = new Map<string, FacilityEntity>();
  const courtsByName = new Map<string, CourtEntity>();

  async function ensureFacility(def: Partial<FacilityEntity> & { name: string }) {
    const existing = await opts.facilitiesRepo.findOne({ where: { name: def.name } });
    if (!existing) {
      const created = opts.facilitiesRepo.create({
        name: def.name,
        type: def.type ?? FacilityType.INDOOR,
        supportedSports: def.supportedSports ?? [],
        dimensions: def.dimensions ?? null,
        maxCapacity: def.maxCapacity ?? null,
        status: def.status ?? FacilityStatus.AVAILABLE,
        approvalStatus: def.approvalStatus ?? FacilityApprovalStatus.APPROVED,
        ownerId: def.ownerId ?? null,
        approvedById: def.approvedById ?? null,
        approvedAt: def.approvedAt ?? null,
        rejectionReason: def.rejectionReason ?? null,
        nextMaintenanceAt: def.nextMaintenanceAt ?? null,
        peakRateCents: def.peakRateCents ?? null,
        offPeakRateCents: def.offPeakRateCents ?? null,
        metadata: def.metadata ?? null,
      });
      const facility = await opts.facilitiesRepo.save(created);
      facilitiesByName.set(def.name, facility);
      return facility;
    }

    existing.type = def.type ?? existing.type;
    existing.supportedSports = def.supportedSports ?? existing.supportedSports;
    existing.dimensions = def.dimensions ?? existing.dimensions;
    existing.maxCapacity = def.maxCapacity ?? existing.maxCapacity;
    existing.status = def.status ?? existing.status;
    existing.approvalStatus = def.approvalStatus ?? existing.approvalStatus;
    existing.ownerId = def.ownerId ?? existing.ownerId;
    existing.approvedById = def.approvedById ?? existing.approvedById;
    existing.approvedAt = def.approvedAt ?? existing.approvedAt;
    existing.metadata = def.metadata ?? existing.metadata;

    const facility = await opts.facilitiesRepo.save(existing);
    facilitiesByName.set(def.name, facility);
    return facility;
  }

  async function ensureCourt(facility: FacilityEntity, name: string, supportedSports: string[]) {
    let court = await opts.courtsRepo.findOne({ where: { facilityId: facility.id, name } });
    if (!court) {
      court = opts.courtsRepo.create({
        facilityId: facility.id,
        name,
        supportedSports,
        isActive: true,
        metadata: null,
      });
      court = await opts.courtsRepo.save(court);
    } else {
      court.supportedSports = supportedSports;
      court.isActive = true;
      court = await opts.courtsRepo.save(court);
    }
    courtsByName.set(`${facility.name} / ${name}`, court);
    return court;
  }

  const now = new Date();

  const thunder = await ensureFacility({
    name: 'Thunder Arena',
    type: FacilityType.INDOOR,
    supportedSports: ['Basketball', 'Volleyball'],
    dimensions: '28m x 15m',
    maxCapacity: 200,
    status: FacilityStatus.AVAILABLE,
    approvalStatus: FacilityApprovalStatus.APPROVED,
    ownerId: opts.ownerUserId,
    approvedById: opts.superAdminUserId,
    approvedAt: now,
    peakRateCents: 15000,
    offPeakRateCents: 8000,
    metadata: { address: '123 Sports Avenue', city: 'Metro City', utilization: 87 },
  });

  const velocity = await ensureFacility({
    name: 'Velocity Pitch',
    type: FacilityType.OUTDOOR,
    supportedSports: ['Football'],
    dimensions: '105m x 68m',
    maxCapacity: 500,
    status: FacilityStatus.AVAILABLE,
    approvalStatus: FacilityApprovalStatus.PENDING,
    ownerId: opts.ownerUserId,
    approvedById: null,
    approvedAt: null,
    peakRateCents: 30000,
    offPeakRateCents: 18000,
    metadata: { address: '456 Athletic Boulevard', city: 'Metro City', utilization: 92 },
  });

  const courtA = await ensureCourt(thunder, 'Court A', ['Basketball', 'Volleyball']);
  const courtB = await ensureCourt(thunder, 'Court B', ['Basketball']);
  await ensureCourt(velocity, 'Pitch 1', ['Football']);

  // Members
  const stormTeam =
    (await opts.membersRepo.findOne({ where: { name: 'Storm Basketball', facilityId: thunder.id } })) ??
    (await opts.membersRepo.save(
      opts.membersRepo.create({
        name: 'Storm Basketball',
        category: MembershipCategory.PRO_TEAM,
        sport: 'Basketball',
        status: MembershipStatus.ACTIVE,
        plan: PaymentPlan.ANNUALLY,
        memberCount: 15,
        joinedAt: new Date('2025-02-01T00:00:00Z'),
        digitalCardId: null,
        facilityId: thunder.id,
      }),
    ));

  const james =
    (await opts.membersRepo.findOne({ where: { name: 'James Okoro', facilityId: thunder.id } })) ??
    (await opts.membersRepo.save(
      opts.membersRepo.create({
        name: 'James Okoro',
        category: MembershipCategory.COMMUNITY_PLAYER,
        sport: 'Basketball',
        status: MembershipStatus.ACTIVE,
        plan: PaymentPlan.PAY_PER_SESSION,
        memberCount: 1,
        joinedAt: new Date('2026-01-05T00:00:00Z'),
        digitalCardId: 'CARD-JAMES-001',
        facilityId: thunder.id,
      }),
    ));

  // Bookings
  const start1 = new Date();
  start1.setHours(9, 0, 0, 0);
  const end1 = new Date(start1);
  end1.setHours(11, 0, 0, 0);

  const booking1 =
    (await opts.bookingsRepo.findOne({ where: { facilityId: thunder.id, memberId: stormTeam.id, startAt: start1 } })) ??
    (await opts.bookingsRepo.save(
      opts.bookingsRepo.create({
        facilityId: thunder.id,
        courtId: courtA.id,
        memberId: stormTeam.id,
        type: BookingType.TRAINING,
        status: BookingStatus.CONFIRMED,
        startAt: start1,
        endAt: end1,
        recurrence: Recurrence.WEEKLY,
        notes: null,
      }),
    ));

  // Payments
  const payment1 =
    (await opts.paymentsRepo.findOne({ where: { memberId: james.id } })) ??
    (await opts.paymentsRepo.save(
      opts.paymentsRepo.create({
        memberId: james.id,
        billingPeriod: '2026-04',
        amountDueCents: 5000,
        amountPaidCents: 5000,
        method: PaymentMethod.CARD,
        status: PaymentStatus.PAID,
        paidAt: new Date(),
        reference: 'PAY-DEMO-001',
      }),
    ));

  return {
    facilitiesByName: new Map(Array.from(facilitiesByName.entries()).map(([k, v]) => [k, { id: v.id }])),
    courtsByName: new Map(Array.from(courtsByName.entries()).map(([k, v]) => [k, { id: v.id }])),
    seeded: { stormTeamId: stormTeam.id, jamesMemberId: james.id, booking1Id: booking1.id, payment1Id: payment1.id },
  };
}
