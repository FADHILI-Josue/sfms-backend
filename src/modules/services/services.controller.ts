import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { CreateRatingDto } from './dto/create-rating.dto';
import { ServicesService } from './services.service';

@ApiTags('Services')
@ApiBearerAuth()
@Controller({ path: 'services', version: '1' })
export class ServicesController {
  constructor(private readonly svc: ServicesService) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────

  @Get('dashboard')
  @Permissions('services.read')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.svc.getDashboardSummary(user);
  }

  // ─── Profile ──────────────────────────────────────────────────────────────

  @Get('profile')
  @Permissions('services.read')
  getProfile(@CurrentUser() user: AuthUser) {
    return this.svc.getMyProfile(user);
  }

  @Patch('profile')
  @Permissions('services.update')
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.svc.updateMyProfile(user, dto);
  }

  // ─── Provider's own programs ──────────────────────────────────────────────

  @Get('programs')
  @Permissions('services.read')
  listPrograms(@CurrentUser() user: AuthUser) {
    return this.svc.listPrograms(user);
  }

  @Post('programs')
  @Permissions('services.create')
  createProgram(@CurrentUser() user: AuthUser, @Body() dto: CreateProgramDto) {
    return this.svc.createProgram(user, dto);
  }

  @Patch('programs/:id')
  @Permissions('services.update')
  updateProgram(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateProgramDto) {
    return this.svc.updateProgram(user, id, dto);
  }

  @Delete('programs/:id')
  @Permissions('services.delete')
  deleteProgram(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.deleteProgram(user, id);
  }

  // ─── Provider's own beneficiaries ─────────────────────────────────────────

  @Get('beneficiaries')
  @Permissions('services.read')
  listBeneficiaries(@CurrentUser() user: AuthUser, @Query('programId') programId?: string) {
    return this.svc.listBeneficiaries(user, programId);
  }

  @Post('beneficiaries')
  @Permissions('services.create')
  createBeneficiary(@CurrentUser() user: AuthUser, @Body() dto: CreateBeneficiaryDto) {
    return this.svc.createBeneficiary(user, dto);
  }

  @Patch('beneficiaries/:id')
  @Permissions('services.update')
  updateBeneficiary(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateBeneficiaryDto) {
    return this.svc.updateBeneficiary(user, id, dto);
  }

  @Delete('beneficiaries/:id')
  @Permissions('services.delete')
  deleteBeneficiary(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.deleteBeneficiary(user, id);
  }

  // ─── Provider's own sessions ──────────────────────────────────────────────

  @Get('sessions')
  @Permissions('services.read')
  listSessions(
    @CurrentUser() user: AuthUser,
    @Query('date') date?: string,
    @Query('weekStart') weekStart?: string,
    @Query('weekEnd') weekEnd?: string,
  ) {
    return this.svc.listSessions(user, date, weekStart, weekEnd);
  }

  @Post('sessions')
  @Permissions('services.create')
  createSession(@CurrentUser() user: AuthUser, @Body() dto: CreateSessionDto) {
    return this.svc.createSession(user, dto);
  }

  @Patch('sessions/:id')
  @Permissions('services.update')
  updateSession(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateSessionDto) {
    return this.svc.updateSession(user, id, dto);
  }

  @Delete('sessions/:id')
  @Permissions('services.delete')
  deleteSession(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.deleteSession(user, id);
  }

  // ─── Attendance ───────────────────────────────────────────────────────────

  @Get('attendance')
  @Permissions('services.read')
  listAttendance(@CurrentUser() user: AuthUser, @Query('date') date?: string) {
    return this.svc.listAttendance(user, date);
  }

  @Post('attendance')
  @Permissions('services.update')
  upsertAttendance(@CurrentUser() user: AuthUser, @Body() dto: UpsertAttendanceDto) {
    return this.svc.upsertAttendance(user, dto);
  }

  // ─── Ratings ──────────────────────────────────────────────────────────────

  @Get('ratings')
  @Permissions('services.read')
  listRatings(@CurrentUser() user: AuthUser) {
    return this.svc.listMyRatings(user);
  }

  @Post('ratings')
  @Permissions('services.create')
  createRating(@CurrentUser() user: AuthUser, @Body() dto: CreateRatingDto) {
    return this.svc.createRating(user, dto);
  }

  // ─── Read-only: all providers (admin/facility access) ─────────────────────

  @Get('providers')
  @Permissions('services.read')
  listProviders(@CurrentUser() user: AuthUser) {
    return this.svc.listAllProviders(user);
  }

  @Get('providers/:id/programs')
  @Permissions('services.read')
  providerPrograms(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.listProgramsForProvider(user, id);
  }

  @Get('providers/:id/ratings')
  @Permissions('services.read')
  providerRatings(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.listRatingsForProvider(user, id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FACILITY-SCOPED MANAGEMENT
  // Requires services.read/create/update/delete AND facility membership
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('facility/:facilityId/stats')
  @Permissions('services.read')
  facilityStats(@CurrentUser() user: AuthUser, @Param('facilityId') facilityId: string) {
    return this.svc.getFacilityStats(user, facilityId);
  }

  @Get('facility/:facilityId/providers')
  @Permissions('services.read')
  facilityProviders(@CurrentUser() user: AuthUser, @Param('facilityId') facilityId: string) {
    return this.svc.listProvidersInFacility(user, facilityId);
  }

  @Get('facility/:facilityId/programs')
  @Permissions('services.read')
  facilityPrograms(@CurrentUser() user: AuthUser, @Param('facilityId') facilityId: string) {
    return this.svc.listProgramsInFacility(user, facilityId);
  }

  @Get('facility/:facilityId/sessions')
  @Permissions('services.read')
  facilitySessions(
    @CurrentUser() user: AuthUser,
    @Param('facilityId') facilityId: string,
    @Query('date') date?: string,
    @Query('weekStart') weekStart?: string,
    @Query('weekEnd') weekEnd?: string,
  ) {
    return this.svc.listSessionsInFacility(user, facilityId, date, weekStart, weekEnd);
  }

  @Get('facility/:facilityId/beneficiaries')
  @Permissions('services.read')
  facilityBeneficiaries(@CurrentUser() user: AuthUser, @Param('facilityId') facilityId: string) {
    return this.svc.listBeneficiariesInFacility(user, facilityId);
  }

  @Post('facility/:facilityId/providers/:profileId/programs')
  @Permissions('services.create')
  createFacilityProgram(
    @CurrentUser() user: AuthUser,
    @Param('facilityId') facilityId: string,
    @Param('profileId') profileId: string,
    @Body() dto: CreateProgramDto,
  ) {
    return this.svc.createProgramForProvider(user, facilityId, profileId, dto);
  }

  @Patch('facility/:facilityId/programs/:programId')
  @Permissions('services.update')
  updateFacilityProgram(
    @CurrentUser() user: AuthUser,
    @Param('facilityId') facilityId: string,
    @Param('programId') programId: string,
    @Body() dto: UpdateProgramDto,
  ) {
    return this.svc.updateFacilityProgram(user, facilityId, programId, dto);
  }

  @Delete('facility/:facilityId/programs/:programId')
  @Permissions('services.delete')
  deleteFacilityProgram(
    @CurrentUser() user: AuthUser,
    @Param('facilityId') facilityId: string,
    @Param('programId') programId: string,
  ) {
    return this.svc.deleteFacilityProgram(user, facilityId, programId);
  }

  @Post('facility/:facilityId/sessions')
  @Permissions('services.create')
  createFacilitySession(
    @CurrentUser() user: AuthUser,
    @Param('facilityId') facilityId: string,
    @Body() dto: CreateSessionDto,
  ) {
    return this.svc.createFacilitySession(user, facilityId, dto);
  }

  @Patch('facility/:facilityId/sessions/:sessionId')
  @Permissions('services.update')
  updateFacilitySession(
    @CurrentUser() user: AuthUser,
    @Param('facilityId') facilityId: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.svc.updateFacilitySession(user, facilityId, sessionId, dto);
  }

  @Delete('facility/:facilityId/sessions/:sessionId')
  @Permissions('services.delete')
  deleteFacilitySession(
    @CurrentUser() user: AuthUser,
    @Param('facilityId') facilityId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.svc.deleteFacilitySession(user, facilityId, sessionId);
  }

  // ─── Super Admin: global stats ────────────────────────────────────────────

  @Get('admin/stats')
  @Permissions('services.read')
  adminStats(@CurrentUser() user: AuthUser) {
    return this.svc.getAdminStats(user);
  }
}
