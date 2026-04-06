export type MailTemplateName =
  | 'verify-email'
  | 'welcome'
  | 'password-reset'
  | 'facility-application-submitted'
  | 'facility-application-approved'
  | 'facility-application-rejected'
  | 'staff-invitation'
  | 'booking-confirmation'
  | 'payment-receipt';

export type MailTemplate = {
  subject: string;
  html: string;
  text: string;
};

export type MailAddress = {
  email: string;
  name?: string;
};

export type SendMailInput = {
  to: string | MailAddress | Array<string | MailAddress>;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type VerifyEmailTemplateData = {
  customerName: string;
  verificationUrl: string;
  supportEmail?: string;
  expiryText?: string;
};

export type WelcomeTemplateData = {
  customerName: string;
  dashboardUrl: string;
  supportEmail?: string;
};

export type PasswordResetTemplateData = {
  customerName: string;
  resetUrl: string;
  supportEmail?: string;
  expiryText?: string;
};

export type FacilityApplicationSubmittedTemplateData = {
  customerName: string;
  facilityName: string;
  referenceId: string;
  reviewEta?: string;
  supportEmail?: string;
};

export type FacilityApplicationApprovedTemplateData = {
  customerName: string;
  facilityName: string;
  dashboardUrl: string;
  publicListingUrl?: string;
  supportEmail?: string;
};

export type FacilityApplicationRejectedTemplateData = {
  customerName: string;
  facilityName: string;
  reason?: string;
  resubmissionUrl?: string;
  supportEmail?: string;
};

export type StaffInvitationTemplateData = {
  customerName: string;
  inviterName: string;
  roleName: string;
  facilityName: string;
  acceptUrl: string;
  supportEmail?: string;
};

export type BookingConfirmationTemplateData = {
  customerName: string;
  facilityName: string;
  bookingDate: string;
  bookingTime: string;
  referenceCode: string;
  supportEmail?: string;
};

export type PaymentReceiptTemplateData = {
  customerName: string;
  amountFormatted: string;
  paymentReference: string;
  receiptUrl?: string;
  supportEmail?: string;
};
