// Email transport for notifications. Nodemailer is CommonJS, so import its
// default export (a named import fails at runtime under Node ESM). Config comes
// from the environment (not $env) so the worker process can use it too.
import nodemailer from 'nodemailer';
import type { EmailMessage } from './messages.ts';

export interface AlertConfig {
  /** SMTP connection URL, e.g. smtps://user:pass@smtp.example.com. */
  smtpUrl?: string;
  from: string;
  /** Recipient for operational alerts; alerts are skipped when unset. */
  to?: string;
}

export function alertConfigFromEnv(env: NodeJS.ProcessEnv = process.env): AlertConfig {
  return {
    smtpUrl: env.SMTP_URL,
    from: env.ALERT_EMAIL_FROM ?? 'stugorkester@localhost',
    to: env.ALERT_EMAIL_TO
  };
}

export type SendResult = 'sent' | 'logged' | 'skipped';

/**
 * Send an operational alert. Degrades gracefully so dev and CI work without a
 * mail server:
 * - no recipient configured → `skipped` (logged).
 * - recipient but no SMTP_URL → `logged` (built via a JSON transport, printed).
 * - both configured → `sent` over SMTP.
 */
export async function sendAlert(
  message: EmailMessage,
  config: AlertConfig = alertConfigFromEnv()
): Promise<SendResult> {
  if (!config.to) {
    console.log(`[notify] no ALERT_EMAIL_TO set; not sending: ${message.subject}`);
    return 'skipped';
  }

  const transport = config.smtpUrl
    ? nodemailer.createTransport(config.smtpUrl)
    : nodemailer.createTransport({ jsonTransport: true });

  await transport.sendMail({
    from: config.from,
    to: config.to,
    subject: message.subject,
    text: message.text
  });

  if (!config.smtpUrl) {
    console.log(`[notify] no SMTP_URL set; would email ${config.to}: ${message.subject}`);
    return 'logged';
  }
  return 'sent';
}
