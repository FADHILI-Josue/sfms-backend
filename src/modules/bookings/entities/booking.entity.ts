import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { CourtEntity } from '../../facilities/entities/court.entity';
import { FacilityEntity } from '../../facilities/entities/facility.entity';
import { MemberEntity } from '../../memberships/entities/member.entity';
import { BookingStatus, BookingType, Recurrence } from '../booking.enums';

@Entity({ name: 'bookings' })
export class BookingEntity extends BaseEntity {
  @ManyToOne(() => FacilityEntity, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  facility!: FacilityEntity;

  @Column({ type: 'uuid' })
  @Index()
  facilityId!: string;

  @ManyToOne(() => CourtEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  court!: CourtEntity | null;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  courtId!: string | null;

  @ManyToOne(() => MemberEntity, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  member!: MemberEntity;

  @Column({ type: 'uuid' })
  @Index()
  memberId!: string;

  @Column({ type: 'simple-enum', enum: BookingType })
  type!: BookingType;

  @Column({ type: 'simple-enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status!: BookingStatus;

  @Column()
  @Index()
  startAt!: Date;

  @Column()
  @Index()
  endAt!: Date;

  @Column({ type: 'simple-enum', enum: Recurrence, default: Recurrence.NONE })
  recurrence!: Recurrence;

  @Column({ type: 'varchar', length: 240, nullable: true })
  notes!: string | null;
}
