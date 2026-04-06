import { registerAs } from '@nestjs/config';

export const mailerConfig = registerAs('mailer', () => ({
  host: process.env.MAIL_HOST ?? '',
  port: Number(process.env.MAIL_PORT ?? 465),
  secure: String(process.env.MAIL_SECURE ?? 'true') === 'true',
  username: process.env.MAIL_USERNAME ?? '',
  password: process.env.MAIL_PASSWORD ?? '',
  fromName: process.env.MAIL_FROM_NAME ?? 'SFMS Care Team',
  fromAddress: process.env.MAIL_FROM_ADDRESS ?? process.env.MAIL_USERNAME ?? '',
}));
