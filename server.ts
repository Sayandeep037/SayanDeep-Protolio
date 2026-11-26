import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import nodemailer from 'nodemailer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DEFAULT_RECIPIENT = 'roysayandeep03@gmail.com';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RateBucket {
  count: number;
  resetAt: number;
}

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 5;
const rateBuckets = new Map<string, RateBucket>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (rateBuckets.size > 500) {
    for (const [key, bucket] of rateBuckets.entries()) {
      if (bucket.resetAt <= now) {
        rateBuckets.delete(key);
      }
    }
  }
  const existing = rateBuckets.get(ip);
  if (!existing || existing.resetAt <= now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (existing.count >= RATE_MAX_REQUESTS) {
    return true;
  }
  existing.count += 1;
  return false;
}

function stripHeaderBreaks(value: string): string {
  return value.replace(/[\r\n\0]+/g, ' ').trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmailHtml(
  name: string,
  email: string,
  subject: string,
  message: string
): string {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\r?\n/g, '<br />');

  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#07110c;color:#e9f4ee;padding:24px;border-radius:12px;border:1px solid #1f3b2c;max-width:600px;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#52e896;font-weight:700;">
        New Portfolio Message
      </p>
      <h2 style="margin:0 0 18px;font-size:20px;color:#ffffff;">${safeSubject}</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#98d8b5;width:90px;">From</td>
          <td style="padding:8px 0;color:#ffffff;font-weight:600;">${safeName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#98d8b5;">Reply-To</td>
          <td style="padding:8px 0;color:#52e896;">${safeEmail}</td>
        </tr>
      </table>
      <div style="padding:16px;border-radius:8px;background:#0c1d14;border:1px solid #234734;color:#dce8e1;font-size:14px;line-height:1.6;">
        ${safeMessage}
      </div>
    </div>
  `.trim();
}

async function startServer(): Promise<void> {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/contact', async (req: Request, res: Response) => {
    try {
      const clientIp = req.ip || 'unknown';
      if (isRateLimited(clientIp)) {
        res.status(429).json({
          ok: false,
          error: 'Too many messages sent recently. Please wait a few minutes and try again.',
        });
        return;
      }

      const body = req.body as Record<string, unknown> | undefined;
      if (!body || typeof body !== 'object') {
        res.status(400).json({ ok: false, error: 'Invalid request payload.' });
        return;
      }

      // Quietly drop automated bot submissions that fill the hidden honeypot field
      if (typeof body.website === 'string' && body.website.trim().length > 0) {
        res.json({ ok: true, message: 'Message received.' });
        return;
      }

      const rawName = typeof body.name === 'string' ? body.name : '';
      const rawEmail = typeof body.email === 'string' ? body.email : '';
      const rawSubject = typeof body.subject === 'string' ? body.subject : '';
      const rawMessage = typeof body.message === 'string' ? body.message : '';

      const cleanName = stripHeaderBreaks(rawName);
      const cleanEmail = stripHeaderBreaks(rawEmail);
      const cleanSubject = stripHeaderBreaks(rawSubject);
      const cleanMessage = rawMessage.trim();

      if (!cleanName || cleanName.length > 120) {
        res.status(400).json({
          ok: false,
          error: 'Please enter your name (1 to 120 characters).',
        });
        return;
      }

      if (!cleanEmail || cleanEmail.length > 160 || !EMAIL_REGEX.test(cleanEmail)) {
        res.status(400).json({
          ok: false,
          error: 'Please enter a valid email address.',
        });
        return;
      }

      if (cleanSubject.length > 200) {
        res.status(400).json({
          ok: false,
          error: 'Subject must be 200 characters or fewer.',
        });
        return;
      }

      if (!cleanMessage || cleanMessage.length > 5000) {
        res.status(400).json({
          ok: false,
          error: 'Please enter a message (1 to 5000 characters).',
        });
        return;
      }

      const toEmail = stripHeaderBreaks(
        process.env.CONTACT_TO_EMAIL || DEFAULT_RECIPIENT
      );
      const resolvedSubject =
        cleanSubject || `Portfolio Message from ${cleanName}`;
      const htmlBody = buildEmailHtml(
        cleanName,
        cleanEmail,
        resolvedSubject,
        cleanMessage
      );
      const textBody = [
        `From: ${cleanName} <${cleanEmail}>`,
        `Subject: ${resolvedSubject}`,
        '',
        cleanMessage,
      ].join('\n');

      // 1. Direct SMTP delivery (Gmail App Password or custom SMTP)
      const smtpUser = (process.env.SMTP_USER || '').trim();
      const smtpPass = (process.env.SMTP_PASS || '').trim();
      if (smtpUser && smtpPass) {
        const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
        const smtpPort = Number(process.env.SMTP_PORT || 465);
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 10000,
        });

        await transporter.sendMail({
          from: `"${cleanName.replace(/"/g, '')} (Portfolio)" <${smtpUser}>`,
          to: toEmail,
          replyTo: `"${cleanName.replace(/"/g, '')}" <${cleanEmail}>`,
          subject: `[Portfolio] ${resolvedSubject}`,
          text: textBody,
          html: htmlBody,
        });

        res.json({
          ok: true,
          provider: 'smtp',
          message: `Your message was delivered directly to ${toEmail}.`,
        });
        return;
      }

      // 2. Resend HTTP API delivery
      const resendKey = (process.env.RESEND_API_KEY || '').trim();
      if (resendKey) {
        const resendFrom = (
          process.env.RESEND_FROM || 'Portfolio Contact <onboarding@resend.dev>'
        ).trim();
        const resendResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [toEmail],
            reply_to: cleanEmail,
            subject: `[Portfolio] ${resolvedSubject}`,
            text: textBody,
            html: htmlBody,
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (resendResp.ok) {
          res.json({
            ok: true,
            provider: 'resend',
            message: `Your message was delivered directly to ${toEmail}.`,
          });
          return;
        }

        const resendErr = (await resendResp.json().catch(() => ({}))) as {
          message?: string;
        };
        res.status(502).json({
          ok: false,
          error:
            resendErr.message ||
            'Email delivery service rejected the request. Please verify your Resend API settings.',
        });
        return;
      }

      // 3. Server-side FormSubmit relay fallback when SMTP/Resend secrets are not configured
      const appOrigin = (process.env.APP_URL || '').trim() || 'https://portfolio.local';
      try {
        const relayResp = await fetch(
          `https://formsubmit.co/ajax/${encodeURIComponent(toEmail)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Origin: appOrigin,
              Referer: `${appOrigin.replace(/\/$/, '')}/`,
            },
            body: JSON.stringify({
              name: cleanName,
              email: cleanEmail,
              _replyto: cleanEmail,
              _subject: `[Portfolio] ${resolvedSubject}`,
              _template: 'table',
              _captcha: 'false',
              message: cleanMessage,
            }),
            signal: AbortSignal.timeout(7000),
          }
        );

        const relayData = (await relayResp.json().catch(() => ({}))) as {
          success?: boolean | string;
          message?: string;
        };

        if (
          relayResp.ok &&
          (relayData.success === true || relayData.success === 'true')
        ) {
          res.json({
            ok: true,
            provider: 'relay',
            message: `Your message was delivered directly to ${toEmail}.`,
          });
          return;
        }

        const relayMsg = relayData.message || '';
        const needsActivation = relayMsg.toLowerCase().includes('activat');
        res.status(503).json({
          ok: false,
          needsConfig: true,
          activationSent: needsActivation,
          error: needsActivation
            ? `Check ${toEmail} for a one-time activation email, or configure a Gmail App Password (SMTP_PASS) in Secrets for instant direct delivery.`
            : 'Email server credentials are not configured yet. Add SMTP_PASS (Gmail App Password) or RESEND_API_KEY in Secrets to deliver messages directly.',
        });
        return;
      } catch {
        res.status(503).json({
          ok: false,
          needsConfig: true,
          activationSent: false,
          error:
            'Direct mail delivery requires SMTP_PASS (Gmail App Password) or RESEND_API_KEY configured in Settings -> Secrets.',
        });
        return;
      }
    } catch (err) {
      console.error('Contact email error:', err instanceof Error ? err.message : 'Unknown error');
      res.status(500).json({
        ok: false,
        error: 'Unable to send message right now. Please try again or use the email app link below.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
