/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * OAuth 2.0 helpers for VK ID, Yandex ID and Telegram Login.
 * Pure/testable logic lives here; server.ts wires it into HTTP routes.
 */
import crypto from 'crypto';

export type OAuthProviderName = 'vk' | 'yandex';
export type AuthProviderName = 'vk' | 'yandex' | 'telegram';

export interface NormalizedProfile {
  provider: AuthProviderName;
  providerId: string;
  email?: string;
  name: string;
  username: string;
  avatarUrl?: string;
}

export function getVkConfig(env: NodeJS.ProcessEnv = process.env) {
  return { clientId: env.VK_CLIENT_ID, clientSecret: env.VK_CLIENT_SECRET };
}

export function getYandexConfig(env: NodeJS.ProcessEnv = process.env) {
  return { clientId: env.YANDEX_CLIENT_ID, clientSecret: env.YANDEX_CLIENT_SECRET };
}

export function getTelegramConfig(env: NodeJS.ProcessEnv = process.env) {
  return { botToken: env.TELEGRAM_BOT_TOKEN, botUsername: env.TELEGRAM_BOT_USERNAME };
}

export function isVkConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  const c = getVkConfig(env);
  return Boolean(c.clientId && c.clientSecret);
}

export function isYandexConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  const c = getYandexConfig(env);
  return Boolean(c.clientId && c.clientSecret);
}

export function isTelegramConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  const c = getTelegramConfig(env);
  return Boolean(c.botToken && c.botUsername);
}

/** PKCE pair required by the VK ID OAuth 2.1 authorization-code flow. */
export function generatePkcePair(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function buildAuthorizeUrl(
  provider: OAuthProviderName,
  params: { clientId: string; redirectUri: string; state: string; codeChallenge?: string }
): string {
  if (provider === 'vk') {
    const url = new URL('https://id.vk.com/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', params.clientId);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('state', params.state);
    url.searchParams.set('scope', 'email');
    url.searchParams.set('code_challenge', params.codeChallenge ?? '');
    url.searchParams.set('code_challenge_method', 's256');
    return url.toString();
  }
  if (provider === 'yandex') {
    const url = new URL('https://oauth.yandex.ru/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', params.clientId);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('state', params.state);
    return url.toString();
  }
  throw new Error(`Unsupported OAuth provider: ${provider}`);
}

export async function exchangeCodeForToken(
  provider: OAuthProviderName,
  opts: { code: string; clientId: string; clientSecret: string; redirectUri: string; codeVerifier?: string }
): Promise<{ accessToken: string; raw: any }> {
  if (provider === 'vk') {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: opts.code,
      client_id: opts.clientId,
      redirect_uri: opts.redirectUri,
      code_verifier: opts.codeVerifier ?? '',
    });
    const res = await fetch('https://id.vk.com/oauth2/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data: any = await res.json();
    if (!res.ok || !data.access_token) {
      throw new Error(data.error_description || data.error || 'VK token exchange failed');
    }
    return { accessToken: data.access_token, raw: data };
  }
  if (provider === 'yandex') {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: opts.code,
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
    });
    const res = await fetch('https://oauth.yandex.ru/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data: any = await res.json();
    if (!res.ok || !data.access_token) {
      throw new Error(data.error_description || data.error || 'Yandex token exchange failed');
    }
    return { accessToken: data.access_token, raw: data };
  }
  throw new Error(`Unsupported OAuth provider: ${provider}`);
}

export function normalizeVkProfile(vkUser: any, email?: string, userId?: string | number): NormalizedProfile {
  const id = String(userId ?? vkUser.id);
  const name = [vkUser.first_name, vkUser.last_name].filter(Boolean).join(' ').trim() || `vk_${id}`;
  return {
    provider: 'vk',
    providerId: id,
    email,
    name,
    username: vkUser.screen_name || `id${id}`,
    avatarUrl: vkUser.photo_200,
  };
}

export function normalizeYandexProfile(data: any): NormalizedProfile {
  const id = String(data.id);
  const avatarUrl = data.is_avatar_empty === false && data.default_avatar_id
    ? `https://avatars.yandex.net/get-yapic/${data.default_avatar_id}/islands-200`
    : undefined;
  const email = data.default_email || (Array.isArray(data.emails) ? data.emails[0] : undefined);
  return {
    provider: 'yandex',
    providerId: id,
    email,
    name: data.real_name || data.display_name || data.login,
    username: data.login,
    avatarUrl,
  };
}

export async function fetchOAuthProfile(
  provider: OAuthProviderName,
  accessToken: string,
  tokenRaw?: any
): Promise<NormalizedProfile> {
  if (provider === 'vk') {
    const url = new URL('https://api.vk.com/method/users.get');
    url.searchParams.set('access_token', accessToken);
    url.searchParams.set('v', '5.199');
    url.searchParams.set('fields', 'photo_200,screen_name');
    const res = await fetch(url.toString());
    const data: any = await res.json();
    if (data.error) throw new Error(data.error.error_msg || 'VK profile fetch failed');
    const vkUser = data.response?.[0];
    if (!vkUser) throw new Error('VK profile fetch returned no user');
    return normalizeVkProfile(vkUser, tokenRaw?.email, tokenRaw?.user_id);
  }
  if (provider === 'yandex') {
    const res = await fetch('https://login.yandex.ru/info?format=json', {
      headers: { Authorization: `OAuth ${accessToken}` },
    });
    const data: any = await res.json();
    if (data.error) throw new Error(data.error_description || data.error || 'Yandex profile fetch failed');
    return normalizeYandexProfile(data);
  }
  throw new Error(`Unsupported OAuth provider: ${provider}`);
}

/**
 * Telegram Login Widget verification: https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramAuth(
  data: Record<string, string>,
  botToken: string,
  maxAgeSeconds = 86400
): boolean {
  const { hash, ...rest } = data;
  if (!hash) return false;
  const checkString = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join('\n');
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
  if (!timingSafeEqualHex(computedHash, hash)) return false;

  const authDate = Number(rest.auth_date);
  if (!authDate) return false;
  const ageSeconds = Date.now() / 1000 - authDate;
  return ageSeconds >= 0 && ageSeconds <= maxAgeSeconds;
}

export function normalizeTelegramProfile(data: Record<string, string>): NormalizedProfile {
  const name = [data.first_name, data.last_name].filter(Boolean).join(' ').trim() || `tg_${data.id}`;
  return {
    provider: 'telegram',
    providerId: String(data.id),
    name,
    username: data.username || `id${data.id}`,
    avatarUrl: data.photo_url,
  };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

// ---- Signed session cookie helpers (HMAC-SHA256, no external deps) ----

export function createSessionToken(payload: object, secret: string): string {
  const json = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(json).digest('base64url');
  return `${json}.${signature}`;
}

export function verifySessionToken<T = any>(token: string | undefined | null, secret: string): T | null {
  if (!token) return null;
  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return null;
  const json = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  const expectedSignature = crypto.createHmac('sha256', secret).update(json).digest('base64url');
  if (signature.length !== expectedSignature.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;
  try {
    return JSON.parse(Buffer.from(json, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | undefined | null): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  cookieHeader.split(';').forEach((pair) => {
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) return;
    const key = pair.slice(0, eqIndex).trim();
    const value = pair.slice(eqIndex + 1).trim();
    if (key) result[key] = decodeURIComponent(value);
  });
  return result;
}
