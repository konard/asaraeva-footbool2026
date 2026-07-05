/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Persists OAuth-authenticated user profiles (email, name, username, avatar)
 * into an Integram (ideav.ru) low-code database, following the same
 * _d_new / _d_req / _d_alias / _m_new / _m_edit REST pattern documented in
 * integram-workflow.md and demonstrated in src/components/IntegramDbSection.tsx.
 */
import fs from 'fs';
import path from 'path';
import type { NormalizedProfile } from './oauth';

const INTEGRAM_BASE_URL = 'https://ideav.ru';
const TABLE_NAME = 'OAuth Users';
const INDEX_FILE = path.join(process.cwd(), '.data', 'integram-oauth-users.json');

// Column name -> Integram column type (see integram-workflow.md column types table).
const COLUMNS: Record<string, string> = {
  Provider: '3', // SHORT
  ProviderId: '3', // SHORT
  Email: '3', // SHORT
  Name: '3', // SHORT
  Username: '3', // SHORT
  AvatarUrl: '8', // CHARS (longer free text, fits URLs)
};

export interface IntegramAuthConfig {
  dbName: string;
  token: string;
}

export function getIntegramAuthConfig(env: NodeJS.ProcessEnv = process.env): IntegramAuthConfig | null {
  if (!env.INTEGRAM_AUTH_DB_NAME || !env.INTEGRAM_AUTH_DB_TOKEN) return null;
  return { dbName: env.INTEGRAM_AUTH_DB_NAME, token: env.INTEGRAM_AUTH_DB_TOKEN };
}

interface StoredIndex {
  tableId?: string;
  columnReqIds?: Record<string, string>;
  users?: Record<string, string>; // `${provider}:${providerId}` -> row id
}

function loadIndex(): StoredIndex {
  try {
    const raw = fs.readFileSync(INDEX_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveIndex(index: StoredIndex): void {
  fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf8');
}

async function integramCall(
  config: IntegramAuthConfig,
  endpoint: string,
  method: 'GET' | 'POST',
  formParams?: Record<string, string>
): Promise<any> {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${INTEGRAM_BASE_URL}/${config.dbName}/${endpoint}${separator}JSON=1`;
  const headers: Record<string, string> = {
    'X-Authorization': config.token,
    Accept: 'application/json',
  };

  let body: string | undefined;
  if (method === 'POST') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    const params = new URLSearchParams({ token: config.token, ...(formParams ?? {}) });
    body = params.toString();
  }

  const res = await fetch(url, { method, headers, body });
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Integram API returned a non-JSON response (HTTP ${res.status}) for ${endpoint}`);
  }
  if (!res.ok || data.error) {
    throw new Error(data.error || data.msg || `Integram API request to ${endpoint} failed`);
  }
  return data;
}

async function getXsrf(config: IntegramAuthConfig): Promise<string> {
  const data = await integramCall(config, 'xsrf', 'GET');
  if (!data._xsrf) throw new Error('Failed to obtain Integram _xsrf token');
  return data._xsrf;
}

async function ensureUsersTable(
  config: IntegramAuthConfig,
  xsrf: string
): Promise<{ tableId: string; columnReqIds: Record<string, string> }> {
  const index = loadIndex();
  if (index.tableId && index.columnReqIds) {
    return { tableId: index.tableId, columnReqIds: index.columnReqIds };
  }

  const tableRes = await integramCall(config, '_d_new', 'POST', { t: '3', val: TABLE_NAME, unique: '1', _xsrf: xsrf });
  const tableId = String(tableRes.obj);

  const columnReqIds: Record<string, string> = {};
  for (const [columnName, columnType] of Object.entries(COLUMNS)) {
    const reqTypeRes = await integramCall(config, '_d_new', 'POST', { t: columnType, val: columnName, _xsrf: xsrf });
    const typeId = String(reqTypeRes.obj);

    const reqLinkRes = await integramCall(config, `_d_req/${tableId}`, 'POST', { t: typeId, _xsrf: xsrf });
    const reqId = String(reqLinkRes.id);
    columnReqIds[columnName] = reqId;

    await integramCall(config, `_d_alias/${reqId}`, 'POST', { val: columnName, _xsrf: xsrf });
  }

  saveIndex({ ...index, tableId, columnReqIds });
  return { tableId, columnReqIds };
}

/**
 * Creates or updates the Integram row for this OAuth profile.
 * Safe to call on every login; resolves once the profile is persisted.
 */
export async function upsertIntegramUser(profile: NormalizedProfile, config: IntegramAuthConfig): Promise<void> {
  const xsrf = await getXsrf(config);
  const { tableId, columnReqIds } = await ensureUsersTable(config, xsrf);

  const fieldValues: Record<string, string> = {
    Provider: profile.provider,
    ProviderId: profile.providerId,
    Email: profile.email ?? '',
    Name: profile.name,
    Username: profile.username,
    AvatarUrl: profile.avatarUrl ?? '',
  };

  const payload: Record<string, string> = { _xsrf: xsrf };
  for (const [columnName, value] of Object.entries(fieldValues)) {
    const reqId = columnReqIds[columnName];
    if (reqId) payload[`t${reqId}`] = value;
  }

  const index = loadIndex();
  const userKey = `${profile.provider}:${profile.providerId}`;
  const existingRowId = index.users?.[userKey];

  if (existingRowId) {
    await integramCall(config, `_m_edit/${existingRowId}`, 'POST', payload);
  } else {
    payload.up = tableId;
    const recRes = await integramCall(config, `_m_new/${tableId}`, 'POST', payload);
    const rowId = String(recRes.obj);
    saveIndex({ ...index, users: { ...(index.users ?? {}), [userKey]: rowId } });
  }
}
