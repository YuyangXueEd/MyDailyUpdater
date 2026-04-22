import type { RepoRef } from './deploy';
import { BridgeBindings, BridgeConfigError, GitHubApiError } from './github';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_API_VERSION = '2026-03-10';
const GITHUB_OAUTH_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_OAUTH_ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const STATE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export const SESSION_COOKIE_NAME = 'linnet_setup_session';

export type GitHubUser = {
  id: number;
  login: string;
  avatar_url?: string;
  html_url?: string;
};

type GitHubUserTokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
};

type GitHubInstallationRepositoriesResponse = {
  total_count: number;
  repositories: Array<{
    id: number;
    name: string;
    full_name: string;
    html_url?: string;
    private?: boolean;
    owner?: {
      login?: string;
    };
  }>;
};

export type GitHubAuthConfig = {
  clientId: string;
  clientSecret: string;
  sessionSecret: string;
};

export type GitHubAuthorizeState = {
  nonce: string;
  issuedAt: number;
  installationId: number | null;
  repo: RepoRef | null;
  returnTo: string | null;
};

export type GitHubSession = {
  version: 1;
  issuedAt: number;
  expiresAt: number;
  user: {
    id: number;
    login: string;
    avatarUrl: string | null;
    htmlUrl: string | null;
  };
  token: {
    accessToken: string;
    tokenType: string;
    scope: string;
    expiresAt: string | null;
    refreshToken: string | null;
    refreshTokenExpiresAt: string | null;
  };
};

function base64UrlEncode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

function base64UrlDecode(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'base64url'));
}

function textToBytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

async function importSessionKey(secret: string): Promise<CryptoKey> {
  const secretBytes = textToBytes(secret);
  const digest = await crypto.subtle.digest('SHA-256', toArrayBuffer(secretBytes));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function sealJson(secret: string, payload: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importSessionKey(secret);
  const plaintext = textToBytes(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(plaintext));
  return `${base64UrlEncode(iv)}.${base64UrlEncode(new Uint8Array(ciphertext))}`;
}

async function openJson<T>(secret: string, sealedValue: string): Promise<T> {
  const [ivPart, cipherPart] = sealedValue.split('.');
  if (!ivPart || !cipherPart) throw new Error('Malformed sealed payload.');
  const iv = base64UrlDecode(ivPart);
  const ciphertext = base64UrlDecode(cipherPart);
  const key = await importSessionKey(secret);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(ciphertext),
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}

async function parseGitHubError(response: Response): Promise<GitHubApiError> {
  const text = await response.text();
  let details: unknown = null;
  try {
    details = text ? JSON.parse(text) : null;
  } catch {
    details = text || null;
  }

  let message = `${response.status} ${response.statusText}`;
  if (details && typeof details === 'object' && details !== null && 'message' in details) {
    const detailMessage = (details as { message?: unknown }).message;
    if (typeof detailMessage === 'string' && detailMessage) message = detailMessage;
  }

  return new GitHubApiError(message, response.status, details);
}

async function githubUserRequest<T>(
  token: string,
  path: string,
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const response = await fetchImpl(`${GITHUB_API_BASE}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'linnet-setup-bridge',
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
    },
  });

  if (!response.ok) throw await parseGitHubError(response);
  return (await response.json()) as T;
}

function normalizeOptional(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function requireGitHubAuthConfig(env: BridgeBindings): GitHubAuthConfig {
  const clientId = normalizeOptional(env.GITHUB_APP_CLIENT_ID);
  const clientSecret = normalizeOptional(env.GITHUB_APP_CLIENT_SECRET);
  const sessionSecret = normalizeOptional(env.SESSION_SECRET);

  const missing: string[] = [];
  if (!clientId) missing.push('GITHUB_APP_CLIENT_ID');
  if (!clientSecret) missing.push('GITHUB_APP_CLIENT_SECRET');
  if (!sessionSecret) missing.push('SESSION_SECRET');

  if (missing.length > 0) {
    throw new BridgeConfigError(
      `Missing required GitHub App auth configuration: ${missing.join(', ')}`,
      missing,
    );
  }

  return {
    clientId: clientId!,
    clientSecret: clientSecret!,
    sessionSecret: sessionSecret!,
  };
}

export async function createAuthorizeStateToken(
  config: GitHubAuthConfig,
  state: GitHubAuthorizeState,
): Promise<string> {
  return sealJson(config.sessionSecret, state);
}

export async function readAuthorizeStateToken(
  config: GitHubAuthConfig,
  value: string,
): Promise<GitHubAuthorizeState> {
  const state = await openJson<GitHubAuthorizeState>(config.sessionSecret, value);
  if (Date.now() - state.issuedAt > STATE_TTL_MS) {
    throw new Error('Authorization state has expired.');
  }
  return state;
}

export function buildGitHubAuthorizeUrl(
  config: GitHubAuthConfig,
  redirectUri: string,
  state: string,
): string {
  const url = new URL(GITHUB_OAUTH_AUTHORIZE_URL);
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeCodeForUserAccessToken(
  config: GitHubAuthConfig,
  code: string,
  redirectUri: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GitHubUserTokenResponse> {
  const response = await fetchImpl(GITHUB_OAUTH_ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'linnet-setup-bridge',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) throw await parseGitHubError(response);
  const data = (await response.json()) as GitHubUserTokenResponse & { error?: string; error_description?: string };
  if (data.error) {
    throw new GitHubApiError(data.error_description || data.error, 400, data);
  }
  return data;
}

export async function getAuthenticatedGitHubUser(
  accessToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GitHubUser> {
  return githubUserRequest<GitHubUser>(accessToken, '/user', fetchImpl);
}

export async function getUserInstallationRepositories(
  accessToken: string,
  installationId: number,
  fetchImpl: typeof fetch = fetch,
): Promise<GitHubInstallationRepositoriesResponse> {
  const repositories: GitHubInstallationRepositoriesResponse['repositories'] = [];
  let totalCount = 0;
  let page = 1;

  while (true) {
    const response = await githubUserRequest<GitHubInstallationRepositoriesResponse>(
      accessToken,
      `/user/installations/${installationId}/repositories?per_page=100&page=${page}`,
      fetchImpl,
    );
    totalCount = response.total_count;
    repositories.push(...response.repositories);
    if (repositories.length >= response.total_count || response.repositories.length === 0) break;
    page += 1;
  }

  return {
    total_count: totalCount,
    repositories,
  };
}

export async function createSessionCookieValue(
  config: GitHubAuthConfig,
  token: GitHubUserTokenResponse,
  user: GitHubUser,
): Promise<string> {
  const now = Date.now();
  const session: GitHubSession = {
    version: 1,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_MS,
    user: {
      id: user.id,
      login: user.login,
      avatarUrl: user.avatar_url ?? null,
      htmlUrl: user.html_url ?? null,
    },
    token: {
      accessToken: token.access_token,
      tokenType: token.token_type,
      scope: token.scope,
      expiresAt: token.expires_in ? new Date(now + token.expires_in * 1000).toISOString() : null,
      refreshToken: token.refresh_token ?? null,
      refreshTokenExpiresAt: token.refresh_token_expires_in
        ? new Date(now + token.refresh_token_expires_in * 1000).toISOString()
        : null,
    },
  };
  return sealJson(config.sessionSecret, session);
}

export async function readSessionCookieValue(
  config: GitHubAuthConfig,
  value: string,
): Promise<GitHubSession> {
  const session = await openJson<GitHubSession>(config.sessionSecret, value);
  if (session.version !== 1) throw new Error('Unsupported session version.');
  if (Date.now() > session.expiresAt) throw new Error('GitHub session has expired.');
  return session;
}

export async function verifyUserCanAccessRepository(
  accessToken: string,
  installationId: number,
  repo: RepoRef,
  fetchImpl: typeof fetch = fetch,
): Promise<{ verified: boolean; repositoryId: number | null }> {
  const response = await getUserInstallationRepositories(accessToken, installationId, fetchImpl);
  const fullName = `${repo.owner}/${repo.repo}`.toLowerCase();
  const match = response.repositories.find((repository) => repository.full_name.toLowerCase() === fullName);
  return {
    verified: Boolean(match),
    repositoryId: match?.id ?? null,
  };
}

export function buildCallbackUrl(requestUrl: string): string {
  const url = new URL(requestUrl);
  url.pathname = '/api/github/callback';
  url.search = '';
  return url.toString();
}

export function buildReturnUrl(returnTo: string | null, params: Record<string, string>): string {
  const url = new URL(returnTo && /^https?:\/\//.test(returnTo) ? returnTo : returnTo || '/', 'https://placeholder.local');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  if (returnTo && /^https?:\/\//.test(returnTo)) return url.toString();
  return `${url.pathname}${url.search}${url.hash}`;
}
