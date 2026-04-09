import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { ServiceProviderProfileEntity } from './service-provider-profile.entity';

@Entity({ name: 'service_ratings' })
export class ServiceRatingEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  providerId!: string;

  @ManyToOne(() => ServiceProviderProfileEntity, { nullable: false, onDelete: 'CASCADE' })
  provider!: ServiceProviderProfileEntity;

  @Column({ type: 'varchar', length: 180 })
  beneficiaryName!: string;

  @Column({ type: 'int' })
  rating!: number;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;
}
