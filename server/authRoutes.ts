/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Express routes implementing OAuth 2.0 login via VK ID, Yandex ID and the
 * Telegram Login Widget. On success the user's email, name, username and
 * avatar are persisted to Integram (see integramUsers.ts) and a signed
 * session cookie is issued so the SPA can read the profile back.
 */
import { Router, Request, Response } from 'express';
import {
  isVkConfigured,
  isYandexConfigured,
  isTelegramConfigured,
  getVkConfig,
  getYandexConfig,
  getTelegramConfig,
  generateState,
  generatePkcePair,
  buildAuthorizeUrl,
  exchangeCodeForToken,
  fetchOAuthProfile,
  verifyTelegramAuth,
  normalizeTelegramProfile,
  createSessionToken,
  verifySessionToken,
  parseCookies,
  NormalizedProfile,
} from './oauth';
import { getIntegramAuthConfig, upsertIntegramUser } from './integramUsers';

const SESSION_COOKIE = 'integram_fc_session';
const STATE_COOKIE_PREFIX = 'integram_fc_oauth_state_';
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const STATE_MAX_AGE_MS = 5 * 60 * 1000;

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || 'dev-insecure-session-secret-change-me';
}

function getRedirectUri(req: Request, provider: string): string {
  const configured = process.env.APP_URL;
  const base = configured ? configured.replace(/\/$/, '') : `${req.protocol}://${req.get('host')}`;
  return `${base}/api/auth/${provider}/callback`;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function persistAndIssueSession(res: Response, profile: NormalizedProfile): Promise<void> {
  const integramConfig = getIntegramAuthConfig();
  if (integramConfig) {
    try {
      await upsertIntegramUser(profile, integramConfig);
    } catch (err) {
      console.error(`[Integram] Failed to persist OAuth user (${profile.provider}:${profile.providerId}):`, errorMessage(err));
    }
  } else {
    console.warn('[Integram] INTEGRAM_AUTH_DB_NAME / INTEGRAM_AUTH_DB_TOKEN not set — skipping Integram persistence.');
  }

  const sessionToken = createSessionToken(profile, getSessionSecret());
  res.cookie(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_MS,
  });
}

export function createAuthRouter(): Router {
  const router = Router();

  router.get('/config', (_req: Request, res: Response) => {
    const telegram = getTelegramConfig();
    res.json({
      vk: isVkConfigured(),
      yandex: isYandexConfigured(),
      telegram: { enabled: isTelegramConfigured(), botUsername: telegram.botUsername ?? null },
    });
  });

  router.get('/vk/start', (req: Request, res: Response) => {
    if (!isVkConfigured()) {
      res.status(501).json({ error: 'VK OAuth is not configured on this server. Set VK_CLIENT_ID and VK_CLIENT_SECRET.' });
      return;
    }
    const { clientId } = getVkConfig();
    const state = generateState();
    const { verifier, challenge } = generatePkcePair();
    res.cookie(`${STATE_COOKIE_PREFIX}vk`, `${state}:${verifier}`, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: STATE_MAX_AGE_MS,
    });
    const authorizeUrl = buildAuthorizeUrl('vk', {
      clientId: clientId!,
      redirectUri: getRedirectUri(req, 'vk'),
      state,
      codeChallenge: challenge,
    });
    res.redirect(authorizeUrl);
  });

  router.get('/vk/callback', async (req: Request, res: Response) => {
    try {
      if (!isVkConfigured()) throw new Error('VK OAuth is not configured on this server.');
      const { clientId, clientSecret } = getVkConfig();
      const cookies = parseCookies(req.headers.cookie);
      const [expectedState, codeVerifier] = (cookies[`${STATE_COOKIE_PREFIX}vk`] ?? '').split(':');
      const { code, state } = req.query as Record<string, string>;
      if (!code || !state || !expectedState || state !== expectedState) {
        throw new Error('Invalid or expired OAuth state; please try signing in again.');
      }
      const { accessToken, raw } = await exchangeCodeForToken('vk', {
        code,
        clientId: clientId!,
        clientSecret: clientSecret!,
        redirectUri: getRedirectUri(req, 'vk'),
        codeVerifier,
      });
      const profile = await fetchOAuthProfile('vk', accessToken, raw);
      await persistAndIssueSession(res, profile);
      res.clearCookie(`${STATE_COOKIE_PREFIX}vk`);
      res.redirect('/?auth=success&provider=vk');
    } catch (err) {
      res.redirect(`/?auth=error&provider=vk&message=${encodeURIComponent(errorMessage(err))}`);
    }
  });

  router.get('/yandex/start', (req: Request, res: Response) => {
    if (!isYandexConfigured()) {
      res.status(501).json({ error: 'Yandex OAuth is not configured on this server. Set YANDEX_CLIENT_ID and YANDEX_CLIENT_SECRET.' });
      return;
    }
    const { clientId } = getYandexConfig();
    const state = generateState();
    res.cookie(`${STATE_COOKIE_PREFIX}yandex`, state, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: STATE_MAX_AGE_MS,
    });
    const authorizeUrl = buildAuthorizeUrl('yandex', {
      clientId: clientId!,
      redirectUri: getRedirectUri(req, 'yandex'),
      state,
    });
    res.redirect(authorizeUrl);
  });

  router.get('/yandex/callback', async (req: Request, res: Response) => {
    try {
      if (!isYandexConfigured()) throw new Error('Yandex OAuth is not configured on this server.');
      const { clientId, clientSecret } = getYandexConfig();
      const cookies = parseCookies(req.headers.cookie);
      const expectedState = cookies[`${STATE_COOKIE_PREFIX}yandex`];
      const { code, state } = req.query as Record<string, string>;
      if (!code || !state || !expectedState || state !== expectedState) {
        throw new Error('Invalid or expired OAuth state; please try signing in again.');
      }
      const { accessToken } = await exchangeCodeForToken('yandex', {
        code,
        clientId: clientId!,
        clientSecret: clientSecret!,
        redirectUri: getRedirectUri(req, 'yandex'),
      });
      const profile = await fetchOAuthProfile('yandex', accessToken);
      await persistAndIssueSession(res, profile);
      res.clearCookie(`${STATE_COOKIE_PREFIX}yandex`);
      res.redirect('/?auth=success&provider=yandex');
    } catch (err) {
      res.redirect(`/?auth=error&provider=yandex&message=${encodeURIComponent(errorMessage(err))}`);
    }
  });

  router.post('/telegram/callback', async (req: Request, res: Response) => {
    try {
      const { botToken } = getTelegramConfig();
      if (!botToken) {
        throw new Error('Telegram Login is not configured on this server. Set TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_USERNAME.');
      }
      const data = req.body as Record<string, string>;
      if (!verifyTelegramAuth(data, botToken)) {
        throw new Error('Telegram authorization data failed verification.');
      }
      const profile = normalizeTelegramProfile(data);
      await persistAndIssueSession(res, profile);
      res.json({ ok: true, profile });
    } catch (err) {
      res.status(400).json({ ok: false, error: errorMessage(err) });
    }
  });

  router.get('/session', (req: Request, res: Response) => {
    const cookies = parseCookies(req.headers.cookie);
    const profile = verifySessionToken<NormalizedProfile>(cookies[SESSION_COOKIE], getSessionSecret());
    if (!profile) {
      res.json({ authenticated: false });
      return;
    }
    res.json({ authenticated: true, profile });
  });

  router.post('/logout', (_req: Request, res: Response) => {
    res.clearCookie(SESSION_COOKIE);
    res.json({ ok: true });
  });

  return router;
}
