import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

import {
  buildBookingConfirmationTemplate,
  buildFacilityApplicationApprovedTemplate,
  buildFacilityApplicationRejectedTemplate,
  buildFacilityApplicationSubmittedTemplate,
  buildPasswordResetTemplate,
  buildPaymentReceiptTemplate,
  buildStaffInvitationTemplate,
  buildVerifyEmailTemplate,
  buildWelcomeTemplate,
} from './templates/mailer.templates';
import type {
  BookingConfirmationTemplateData,
  FacilityApplicationApprovedTemplateData,
  FacilityApplicationRejectedTemplateData,
  FacilityApplicationSubmittedTemplateData,
  MailAddress,
  MailTemplate,
  PasswordResetTemplateData,
  PaymentReceiptTemplateData,
  SendMailInput,
  StaffInvitationTemplateData,
  VerifyEmailTemplateData,
  WelcomeTemplateData,
} from './mailer.types';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter: Transporter | null;
  private readonly fromName: string;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('mailer.host') ?? '';
    const port = this.configService.get<number>('mailer.port') ?? 465;
    const secure = this.configService.get<boolean>('mailer.secure') ?? true;
    const username = this.configService.get<string>('mailer.username') ?? '';
    const password = this.configService.get<string>('mailer.password') ?? '';

    this.fromName = this.configService.get<string>('mailer.fromName') ?? 'SFMS Care Team';
    this.fromAddress =
      this.configService.get<string>('mailer.fromAddress') ??
      username;

    this.transporter =
      host && username && password
        ? nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
              user: username,
              pass: password,
            },
          })
        : null;
  }

  isConfigured() {
    return Boolean(this.transporter && this.fromAddress);
  }

  async verifyConnection() {
    if (!this.transporter) return false;
    await this.transporter.verify();
    return true;
  }

  async send(input: SendMailInput) {
    if (!this.transporter || !this.fromAddress) {
      this.logger.warn(`Mailer is not configured. Skipped email with subject "${input.subject}".`);
      return { accepted: [], rejected: [], pending: true } as const;
    }

    return this.transporter.sendMail({
      from: this.formatAddress({ email: this.fromAddress, name: this.fromName }),
      to: this.formatTo(input.to),
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
  }

  buildVerifyEmailTemplate(data: VerifyEmailTemplateData): MailTemplate {
    return buildVerifyEmailTemplate(this.withSupport(data));
  }

  buildWelcomeTemplate(data: WelcomeTemplateData): MailTemplate {
    return buildWelcomeTemplate(this.withSupport(data));
  }

  buildPasswordResetTemplate(data: PasswordResetTemplateData): MailTemplate {
    return buildPasswordResetTemplate(this.withSupport(data));
  }

  buildFacilityApplicationSubmittedTemplate(
    data: FacilityApplicationSubmittedTemplateData,
  ): MailTemplate {
    return buildFacilityApplicationSubmittedTemplate(this.withSupport(data));
  }

  buildFacilityApplicationApprovedTemplate(
    data: FacilityApplicationApprovedTemplateData,
  ): MailTemplate {
    return buildFacilityApplicationApprovedTemplate(this.withSupport(data));
  }

  buildFacilityApplicationRejectedTemplate(
    data: FacilityApplicationRejectedTemplateData,
  ): MailTemplate {
    return buildFacilityApplicationRejectedTemplate(this.withSupport(data));
  }

  buildStaffInvitationTemplate(data: StaffInvitationTemplateData): MailTemplate {
    return buildStaffInvitationTemplate(this.withSupport(data));
  }

  buildBookingConfirmationTemplate(data: BookingConfirmationTemplateData): MailTemplate {
    return buildBookingConfirmationTemplate(this.withSupport(data));
  }

  buildPaymentReceiptTemplate(data: PaymentReceiptTemplateData): MailTemplate {
    return buildPaymentReceiptTemplate(this.withSupport(data));
  }

  private withSupport<T extends { supportEmail?: string }>(data: T): T {
    return {
      ...data,
      supportEmail: data.supportEmail ?? (this.fromAddress || undefined),
    };
  }

  private formatTo(value: string | MailAddress | Array<string | MailAddress>) {
    if (Array.isArray(value)) {
      return value.map((item) => this.formatAddress(item)).join(', ');
    }
    return this.formatAddress(value);
  }

  private formatAddress(value: string | MailAddress) {
    if (typeof value === 'string') return value;
    if (value.name?.trim()) {
      return `"${value.name.trim()}" <${value.email}>`;
    }
    return value.email;
  }
}
