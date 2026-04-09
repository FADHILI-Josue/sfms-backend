export enum ProgramStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  DRAFT = 'DRAFT',
}

export enum BeneficiaryStatus {
  ACTIVE = 'ACTIVE',
  GRADUATED = 'GRADUATED',
  ON_HOLD = 'ON_HOLD',
  DROPPED = 'DROPPED',
}

export enum SessionType {
  INDIVIDUAL = 'INDIVIDUAL',
  GROUP = 'GROUP',
}

export enum SessionStatus {
  CONFIRMED = 'CONFIRMED',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
}
