export enum FacilityType {
  INDOOR = 'INDOOR',
  OUTDOOR = 'OUTDOOR',
}

export enum FacilitySport {
  BASKETBALL = 'BASKETBALL',
  FOOTBALL = 'FOOTBALL',
  VOLLEYBALL = 'VOLLEYBALL',
  TENNIS = 'TENNIS',
  SWIMMING = 'SWIMMING',
  CRICKET = 'CRICKET',
  BADMINTON = 'BADMINTON',
  TABLE_TENNIS = 'TABLE_TENNIS',
  RUGBY = 'RUGBY',
  HOCKEY = 'HOCKEY',
  ATHLETICS = 'ATHLETICS',
  FUTSAL = 'FUTSAL',
  HANDBALL = 'HANDBALL',
}

export enum FacilityStatus {
  AVAILABLE = 'AVAILABLE',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  CLOSED = 'CLOSED',
}

export enum FacilityApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum FacilitySortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  NAME = 'name',
  STATUS = 'status',
  TYPE = 'type',
  APPROVAL_STATUS = 'approvalStatus',
}
