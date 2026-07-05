import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  isVkConfigured,
  isYandexConfigured,
  isTelegramConfigured,
  generatePkcePair,
  generateState,
  buildAuthorizeUrl,
  normalizeVkProfile,
  normalizeYandexProfile,
  normalizeTelegramProfile,
  verifyTelegramAuth,
  createSessionToken,
  verifySessionToken,
  parseCookies,
} from '../server/oauth';

describe('provider configuration detection', () => {
  it('reports a provider as configured only when all required env vars are set', () => {
    assert.equal(isVkConfigured({ VK_CLIENT_ID: 'id', VK_CLIENT_SECRET: 'secret' }), true);
    assert.equal(isVkConfigured({ VK_CLIENT_ID: 'id' }), false);
    assert.equal(isVkConfigured({}), false);

    assert.equal(isYandexConfigured({ YANDEX_CLIENT_ID: 'id', YANDEX_CLIENT_SECRET: 'secret' }), true);
    assert.equal(isYandexConfigured({}), false);

    assert.equal(isTelegramConfigured({ TELEGRAM_BOT_TOKEN: 't', TELEGRAM_BOT_USERNAME: 'bot' }), true);
    assert.equal(isTelegramConfigured({ TELEGRAM_BOT_TOKEN: 't' }), false);
  });
});

describe('PKCE and state generation', () => {
  it('generates a verifier and an S256 challenge that match', () => {
    const { verifier, challenge } = generatePkcePair();
    assert.match(verifier, /^[A-Za-z0-9_-]+$/);
    const expectedChallenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    assert.equal(challenge, expectedChallenge);
  });

  it('generates unique, non-empty state strings', () => {
    const a = generateState();
    const b = generateState();
    assert.notEqual(a, b);
    assert.ok(a.length > 0);
  });
});

describe('buildAuthorizeUrl', () => {
  it('builds a VK ID authorize URL with PKCE parameters', () => {
    const url = new URL(
      buildAuthorizeUrl('vk', {
        clientId: 'client123',
        redirectUri: 'https://example.com/api/auth/vk/callback',
        state: 'state123',
        codeChallenge: 'challenge123',
      })
    );
    assert.equal(url.origin + url.pathname, 'https://id.vk.com/authorize');
    assert.equal(url.searchParams.get('client_id'), 'client123');
    assert.equal(url.searchParams.get('redirect_uri'), 'https://example.com/api/auth/vk/callback');
    assert.equal(url.searchParams.get('state'), 'state123');
    assert.equal(url.searchParams.get('code_challenge'), 'challenge123');
    assert.equal(url.searchParams.get('code_challenge_method'), 's256');
  });

  it('builds a Yandex authorize URL without PKCE parameters', () => {
    const url = new URL(
      buildAuthorizeUrl('yandex', {
        clientId: 'client456',
        redirectUri: 'https://example.com/api/auth/yandex/callback',
        state: 'state456',
      })
    );
    assert.equal(url.origin + url.pathname, 'https://oauth.yandex.ru/authorize');
    assert.equal(url.searchParams.get('client_id'), 'client456');
    assert.equal(url.searchParams.get('state'), 'state456');
    assert.equal(url.searchParams.has('code_challenge'), false);
  });
});

describe('profile normalization', () => {
  it('normalizes a VK users.get response into a NormalizedProfile', () => {
    const profile = normalizeVkProfile(
      { id: 42, first_name: 'Иван', last_name: 'Петров', screen_name: 'ivan_p', photo_200: 'https://vk.com/photo.jpg' },
      'ivan@example.com',
      42
    );
    assert.deepEqual(profile, {
      provider: 'vk',
      providerId: '42',
      email: 'ivan@example.com',
      name: 'Иван Петров',
      username: 'ivan_p',
      avatarUrl: 'https://vk.com/photo.jpg',
    });
  });

  it('falls back to a generated username/name when VK screen_name/first_name are absent', () => {
    const profile = normalizeVkProfile({ id: 7 }, undefined, 7);
    assert.equal(profile.name, 'vk_7');
    assert.equal(profile.username, 'id7');
  });

  it('normalizes a Yandex login.yandex.ru/info response into a NormalizedProfile', () => {
    const profile = normalizeYandexProfile({
      id: '99',
      login: 'ivanov',
      real_name: 'Иван Иванов',
      default_email: 'ivanov@yandex.ru',
      is_avatar_empty: false,
      default_avatar_id: 'abc123',
    });
    assert.equal(profile.provider, 'yandex');
    assert.equal(profile.providerId, '99');
    assert.equal(profile.email, 'ivanov@yandex.ru');
    assert.equal(profile.name, 'Иван Иванов');
    assert.equal(profile.username, 'ivanov');
    assert.equal(profile.avatarUrl, 'https://avatars.yandex.net/get-yapic/abc123/islands-200');
  });

  it('omits the Yandex avatar URL when the user has no avatar', () => {
    const profile = normalizeYandexProfile({ id: '1', login: 'noavatar', is_avatar_empty: true });
    assert.equal(profile.avatarUrl, undefined);
  });

  it('normalizes a Telegram Login Widget payload into a NormalizedProfile', () => {
    const profile = normalizeTelegramProfile({
      id: '555',
      first_name: 'Пётр',
      last_name: 'Сидоров',
      username: 'petya',
      photo_url: 'https://t.me/photo.jpg',
      auth_date: '1700000000',
      hash: 'irrelevant-here',
    });
    assert.equal(profile.provider, 'telegram');
    assert.equal(profile.providerId, '555');
    assert.equal(profile.name, 'Пётр Сидоров');
    assert.equal(profile.username, 'petya');
    assert.equal(profile.avatarUrl, 'https://t.me/photo.jpg');
  });
});

function signTelegramData(data: Record<string, string>, botToken: string): Record<string, string> {
  const checkString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('\n');
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const hash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
  return { ...data, hash };
}

describe('verifyTelegramAuth', () => {
  const botToken = '123456:TEST-BOT-TOKEN';

  it('accepts a correctly signed, fresh payload', () => {
    const data = signTelegramData(
      { id: '1', first_name: 'Test', auth_date: String(Math.floor(Date.now() / 1000)) },
      botToken
    );
    assert.equal(verifyTelegramAuth(data, botToken), true);
  });

  it('rejects a payload with a tampered field', () => {
    const data = signTelegramData(
      { id: '1', first_name: 'Test', auth_date: String(Math.floor(Date.now() / 1000)) },
      botToken
    );
    data.first_name = 'Tampered';
    assert.equal(verifyTelegramAuth(data, botToken), false);
  });

  it('rejects a payload signed with the wrong bot token', () => {
    const data = signTelegramData(
      { id: '1', first_name: 'Test', auth_date: String(Math.floor(Date.now() / 1000)) },
      'other-bot-token'
    );
    assert.equal(verifyTelegramAuth(data, botToken), false);
  });

  it('rejects an expired auth_date', () => {
    const data = signTelegramData({ id: '1', first_name: 'Test', auth_date: '1' }, botToken);
    assert.equal(verifyTelegramAuth(data, botToken, 86400), false);
  });

  it('rejects a payload with no hash', () => {
    assert.equal(verifyTelegramAuth({ id: '1' }, botToken), false);
  });
});

describe('session token signing', () => {
  const secret = 'test-session-secret';

  it('round-trips a payload through create/verify', () => {
    const payload = { provider: 'vk' as const, providerId: '1', name: 'Test', username: 'test' };
    const token = createSessionToken(payload, secret);
    const verified = verifySessionToken<typeof payload>(token, secret);
    assert.deepEqual(verified, payload);
  });

  it('rejects a token signed with a different secret', () => {
    const token = createSessionToken({ a: 1 }, secret);
    assert.equal(verifySessionToken(token, 'wrong-secret'), null);
  });

  it('rejects a tampered token payload', () => {
    const token = createSessionToken({ a: 1 }, secret);
    const [json, signature] = token.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ a: 2 }), 'utf8').toString('base64url');
    assert.equal(verifySessionToken(`${tamperedPayload}.${signature}`, secret), null);
  });

  it('returns null for a missing or malformed token', () => {
    assert.equal(verifySessionToken(undefined, secret), null);
    assert.equal(verifySessionToken(null, secret), null);
    assert.equal(verifySessionToken('not-a-valid-token', secret), null);
  });
});

describe('parseCookies', () => {
  it('parses a standard Cookie header into a key/value map', () => {
    const cookies = parseCookies('a=1; b=2; c=hello%20world');
    assert.deepEqual(cookies, { a: '1', b: '2', c: 'hello world' });
  });

  it('returns an empty object for a missing header', () => {
    assert.deepEqual(parseCookies(undefined), {});
    assert.deepEqual(parseCookies(null), {});
  });
});
