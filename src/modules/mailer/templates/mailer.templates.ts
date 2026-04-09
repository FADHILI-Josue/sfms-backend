import type {
  BookingConfirmationTemplateData,
  FacilityApplicationApprovedTemplateData,
  FacilityApplicationRejectedTemplateData,
  FacilityApplicationSubmittedTemplateData,
  MailTemplate,
  PasswordResetTemplateData,
  PaymentReceiptTemplateData,
  StaffInvitationTemplateData,
  VerifyEmailTemplateData,
  WelcomeTemplateData,
} from '../mailer.types';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function button(label: string, url: string) {
  return `<a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 22px;border-radius:12px;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:700">${escapeHtml(label)}</a>`;
}

function layout(args: {
  preheader: string;
  title: string;
  greeting: string;
  intro: string;
  bodyHtml: string;
  supportEmail?: string;
}) {
  const supportLine = args.supportEmail
    ? `<p style="margin:24px 0 0;color:#475569;font-size:14px;line-height:1.7">If you need help, reply to this email or reach us at <a href="mailto:${escapeHtml(args.supportEmail)}" style="color:#16a34a;text-decoration:none">${escapeHtml(args.supportEmail)}</a>.</p>`
    : '';

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(args.title)}</title>
  </head>
  <body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(args.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0">
            <tr>
              <td style="padding:28px 32px;background:linear-gradient(135deg,#052e16,#166534);color:#ffffff">
                <div style="font-size:13px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;opacity:.84">SFMS Care Team</div>
                <div style="margin-top:12px;font-size:30px;line-height:1.2;font-weight:800">${escapeHtml(args.title)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px">
                <p style="margin:0 0 16px;font-size:18px;line-height:1.6">${escapeHtml(args.greeting)}</p>
                <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.8">${escapeHtml(args.intro)}</p>
                <div style="color:#0f172a;font-size:15px;line-height:1.8">${args.bodyHtml}</div>
                ${supportLine}
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;color:#64748b;font-size:13px;line-height:1.7">
                <p style="margin:0">With care,<br /><strong>SFMS Support</strong></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildVerifyEmailTemplate(data: VerifyEmailTemplateData): MailTemplate {
  const subject = 'Verify your email address';
  const html = layout({
    preheader: 'Please confirm your email address to secure your SFMS account.',
    title: 'Confirm your email',
    greeting: `Hello ${data.customerName},`,
    intro:
      'Welcome to SFMS. Before we activate everything for you, please verify your email address so we can keep your account secure and make sure important updates reach you.',
    bodyHtml: `
      <p style="margin:0 0 24px">This quick step protects your access and helps us support you better.</p>
      <div style="margin:0 0 24px">${button('Verify email', data.verificationUrl)}</div>
      <p style="margin:0 0 12px;color:#475569">This link${data.expiryText ? ` ${escapeHtml(data.expiryText)}` : ' expires soon for your security.'}</p>
      <p style="margin:0;color:#475569">If you did not create this account, you can safely ignore this email.</p>
    `,
    supportEmail: data.supportEmail,
  });
  const text = [
    `Hello ${data.customerName},`,
    '',
    'Welcome to SFMS. Please verify your email address to secure your account.',
    `Verify here: ${data.verificationUrl}`,
    data.expiryText ? `This link ${data.expiryText}.` : 'This link expires soon for your security.',
    data.supportEmail ? `Need help? Contact ${data.supportEmail}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return { subject, html, text };
}

export function buildWelcomeTemplate(data: WelcomeTemplateData): MailTemplate {
  const subject = 'Welcome to SFMS';
  const html = layout({
    preheader: 'Your SFMS account is ready.',
    title: 'Welcome aboard',
    greeting: `Hello ${data.customerName},`,
    intro:
      'We are glad to have you with us. Your SFMS account is ready, and we are here to make the experience smooth, clear, and dependable from day one.',
    bodyHtml: `
      <p style="margin:0 0 24px">You can now sign in to manage your activity, review bookings, and stay up to date with everything that matters to you.</p>
      <div style="margin:0 0 24px">${button('Open dashboard', data.dashboardUrl)}</div>
      <p style="margin:0;color:#475569">If you are unsure where to start, just reply to this email and our team will gladly guide you.</p>
    `,
    supportEmail: data.supportEmail,
  });
  const text = [
    `Hello ${data.customerName},`,
    '',
    'Welcome to SFMS. Your account is ready.',
    `Open dashboard: ${data.dashboardUrl}`,
    data.supportEmail ? `Need help? Contact ${data.supportEmail}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return { subject, html, text };
}

export function buildPasswordResetTemplate(data: PasswordResetTemplateData): MailTemplate {
  const subject = 'Reset your password';
  const html = layout({
    preheader: 'Use this secure link to reset your SFMS password.',
    title: 'Password reset request',
    greeting: `Hello ${data.customerName},`,
    intro:
      'We received a request to reset your password. If this was you, use the secure button below to choose a new password and regain access safely.',
    bodyHtml: `
      <div style="margin:0 0 24px">${button('Reset password', data.resetUrl)}</div>
      <p style="margin:0 0 12px;color:#475569">This link${data.expiryText ? ` ${escapeHtml(data.expiryText)}` : ' expires soon for your protection.'}</p>
      <p style="margin:0;color:#475569">If you did not request this, you can ignore this email. Your current password will remain unchanged.</p>
    `,
    supportEmail: data.supportEmail,
  });
  const text = [
    `Hello ${data.customerName},`,
    '',
    'We received a password reset request for your SFMS account.',
    `Reset password: ${data.resetUrl}`,
    data.expiryText ? `This link ${data.expiryText}.` : 'This link expires soon for your protection.',
    'If you did not request this, you can ignore this email.',
    data.supportEmail ? `Need help? Contact ${data.supportEmail}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return { subject, html, text };
}

export function buildFacilityApplicationSubmittedTemplate(
  data: FacilityApplicationSubmittedTemplateData,
): MailTemplate {
  const subject = 'We received your facility registration request';
  const html = layout({
    preheader: `Your request for ${data.facilityName} is now under review.`,
    title: 'Request received',
    greeting: `Hello ${data.customerName},`,
    intro:
      'Thank you for trusting SFMS with your facility onboarding. We have safely received your registration request and our team will review it carefully.',
    bodyHtml: `
      <div style="padding:18px;border:1px solid #dcfce7;border-radius:16px;background:#f0fdf4;margin-bottom:24px">
        <p style="margin:0 0 8px"><strong>Facility:</strong> ${escapeHtml(data.facilityName)}</p>
        <p style="margin:0 0 8px"><strong>Reference:</strong> ${escapeHtml(data.referenceId)}</p>
        <p style="margin:0"><strong>Expected review time:</strong> ${escapeHtml(data.reviewEta ?? 'within 1–2 business days')}</p>
      </div>
      <p style="margin:0;color:#475569">We know these approvals matter to your operations, so we aim to keep communication clear and timely throughout the process.</p>
    `,
    supportEmail: data.supportEmail,
  });
  const text = [
    `Hello ${data.customerName},`,
    '',
    `We received your facility registration request for ${data.facilityName}.`,
    `Reference: ${data.referenceId}`,
    `Expected review time: ${data.reviewEta ?? 'within 1–2 business days'}`,
    data.supportEmail ? `Need help? Contact ${data.supportEmail}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return { subject, html, text };
}

export function buildFacilityApplicationApprovedTemplate(
  data: FacilityApplicationApprovedTemplateData,
): MailTemplate {
  const subject = 'Your facility registration has been approved';
  const html = layout({
    preheader: `${data.facilityName} is now approved on SFMS.`,
    title: 'Facility approved',
    greeting: `Hello ${data.customerName},`,
    intro:
      'Great news. Your facility registration has been approved. We know how much work goes into getting a venue ready, and we are happy to welcome you officially.',
    bodyHtml: `
      <p style="margin:0 0 18px"><strong>${escapeHtml(data.facilityName)}</strong> is now approved in SFMS.</p>
      ${
        data.loginEmail && data.temporaryPassword
          ? `<table style="width:100%;border-collapse:collapse;margin:0 0 24px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
              <tr><td style="padding:16px 20px">
                <p style="margin:0 0 10px;font-weight:700;color:#0f172a">Your login credentials</p>
                <p style="margin:0 0 6px;color:#475569">Email: <strong style="color:#0f172a">${escapeHtml(data.loginEmail)}</strong></p>
                <p style="margin:0;color:#475569">Temporary password: <strong style="color:#0f172a;font-family:monospace">${escapeHtml(data.temporaryPassword)}</strong></p>
                <p style="margin:10px 0 0;font-size:13px;color:#94a3b8">Please change your password after your first login.</p>
              </td></tr>
             </table>`
          : ''
      }
      <div style="margin:0 0 24px">${button('Open your dashboard', data.dashboardUrl)}</div>
      ${
        data.publicListingUrl
          ? `<p style="margin:0 0 12px;color:#475569">Your public listing is available here: <a href="${escapeHtml(data.publicListingUrl)}" style="color:#16a34a;text-decoration:none">${escapeHtml(data.publicListingUrl)}</a></p>`
          : ''
      }
      <p style="margin:0;color:#475569">If you need help with setup, staff access, or publishing details, our team is ready to assist.</p>
    `,
    supportEmail: data.supportEmail,
  });
  const text = [
    `Hello ${data.customerName},`,
    '',
    `Your facility registration for ${data.facilityName} has been approved.`,
    data.loginEmail && data.temporaryPassword
      ? `Login email: ${data.loginEmail}\nTemporary password: ${data.temporaryPassword}\n(Please change your password after first login.)`
      : '',
    `Open dashboard: ${data.dashboardUrl}`,
    data.publicListingUrl ? `Public listing: ${data.publicListingUrl}` : '',
    data.supportEmail ? `Need help? Contact ${data.supportEmail}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return { subject, html, text };
}

export function buildFacilityApplicationRejectedTemplate(
  data: FacilityApplicationRejectedTemplateData,
): MailTemplate {
  const subject = 'Your facility registration needs some updates';
  const html = layout({
    preheader: `Your request for ${data.facilityName} was reviewed and needs revision.`,
    title: 'Request needs revision',
    greeting: `Hello ${data.customerName},`,
    intro:
      'We reviewed your facility registration request carefully. It is not approved yet, but this is usually something we can resolve together with a few updates.',
    bodyHtml: `
      <p style="margin:0 0 16px"><strong>Facility:</strong> ${escapeHtml(data.facilityName)}</p>
      ${
        data.reason
          ? `<div style="padding:18px;border:1px solid #fde68a;border-radius:16px;background:#fffbeb;margin-bottom:24px"><p style="margin:0"><strong>Review note:</strong> ${escapeHtml(data.reason)}</p></div>`
          : ''
      }
      ${
        data.resubmissionUrl
          ? `<div style="margin:0 0 24px">${button('Review and resubmit', data.resubmissionUrl)}</div>`
          : ''
      }
      <p style="margin:0;color:#475569">Please do not hesitate to reach out. We are happy to explain what is needed and help you move forward.</p>
    `,
    supportEmail: data.supportEmail,
  });
  const text = [
    `Hello ${data.customerName},`,
    '',
    `Your facility registration for ${data.facilityName} needs some updates before approval.`,
    data.reason ? `Review note: ${data.reason}` : '',
    data.resubmissionUrl ? `Review and resubmit: ${data.resubmissionUrl}` : '',
    data.supportEmail ? `Need help? Contact ${data.supportEmail}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return { subject, html, text };
}

export function buildStaffInvitationTemplate(data: StaffInvitationTemplateData): MailTemplate {
  const subject = `You have been invited as ${data.roleName}`;
  const html = layout({
    preheader: `You were invited to join ${data.facilityName} on SFMS.`,
    title: 'Staff invitation',
    greeting: `Hello ${data.customerName},`,
    intro:
      'You have been invited to join a facility team on SFMS. This invitation was sent so you can access the tools and information relevant to your role.',
    bodyHtml: `
      <p style="margin:0 0 12px"><strong>Facility:</strong> ${escapeHtml(data.facilityName)}</p>
      <p style="margin:0 0 12px"><strong>Role:</strong> ${escapeHtml(data.roleName)}</p>
      <p style="margin:0 0 24px"><strong>Invited by:</strong> ${escapeHtml(data.inviterName)}</p>
      <div style="margin:0 0 24px">${button('Accept invitation', data.acceptUrl)}</div>
      <p style="margin:0;color:#475569">If anything about this invitation looks unexpected, please contact us before taking action.</p>
    `,
    supportEmail: data.supportEmail,
  });
  const text = [
    `Hello ${data.customerName},`,
    '',
    `You were invited to join ${data.facilityName} as ${data.roleName}.`,
    `Invited by: ${data.inviterName}`,
    `Accept invitation: ${data.acceptUrl}`,
    data.supportEmail ? `Need help? Contact ${data.supportEmail}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return { subject, html, text };
}

export function buildBookingConfirmationTemplate(
  data: BookingConfirmationTemplateData,
): MailTemplate {
  const subject = 'Your booking is confirmed';
  const html = layout({
    preheader: `Your booking at ${data.facilityName} is confirmed.`,
    title: 'Booking confirmed',
    greeting: `Hello ${data.customerName},`,
    intro:
      'Your booking is confirmed. We want every part of your experience to feel dependable, so the key details are included below for quick reference.',
    bodyHtml: `
      <div style="padding:18px;border:1px solid #dcfce7;border-radius:16px;background:#f0fdf4">
        <p style="margin:0 0 8px"><strong>Facility:</strong> ${escapeHtml(data.facilityName)}</p>
        <p style="margin:0 0 8px"><strong>Date:</strong> ${escapeHtml(data.bookingDate)}</p>
        <p style="margin:0 0 8px"><strong>Time:</strong> ${escapeHtml(data.bookingTime)}</p>
        <p style="margin:0"><strong>Reference:</strong> ${escapeHtml(data.referenceCode)}</p>
      </div>
    `,
    supportEmail: data.supportEmail,
  });
  const text = [
    `Hello ${data.customerName},`,
    '',
    `Your booking at ${data.facilityName} is confirmed.`,
    `Date: ${data.bookingDate}`,
    `Time: ${data.bookingTime}`,
    `Reference: ${data.referenceCode}`,
    data.supportEmail ? `Need help? Contact ${data.supportEmail}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return { subject, html, text };
}

export function buildPaymentReceiptTemplate(data: PaymentReceiptTemplateData): MailTemplate {
  const subject = 'Your payment receipt';
  const html = layout({
    preheader: 'Thank you. Your payment has been received successfully.',
    title: 'Payment received',
    greeting: `Hello ${data.customerName},`,
    intro:
      'Thank you for your payment. We are sending this receipt so your records stay clear, accurate, and easy to access whenever you need them.',
    bodyHtml: `
      <p style="margin:0 0 12px"><strong>Amount:</strong> ${escapeHtml(data.amountFormatted)}</p>
      <p style="margin:0 0 24px"><strong>Reference:</strong> ${escapeHtml(data.paymentReference)}</p>
      ${
        data.receiptUrl
          ? `<div style="margin:0 0 24px">${button('View receipt', data.receiptUrl)}</div>`
          : ''
      }
      <p style="margin:0;color:#475569">If you notice anything unusual, please contact us and we will look into it promptly.</p>
    `,
    supportEmail: data.supportEmail,
  });
  const text = [
    `Hello ${data.customerName},`,
    '',
    `We received your payment of ${data.amountFormatted}.`,
    `Reference: ${data.paymentReference}`,
    data.receiptUrl ? `Receipt: ${data.receiptUrl}` : '',
    data.supportEmail ? `Need help? Contact ${data.supportEmail}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return { subject, html, text };
}
