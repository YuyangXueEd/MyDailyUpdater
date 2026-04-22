import { createPrivateKey, createSign } from 'node:crypto';

export type BridgeBindings = {
  GITHUB_APP_SLUG?: string;
  GITHUB_APP_ID?: string;
  GITHUB_APP_CLIENT_ID?: string;
  GITHUB_APP_CLIENT_SECRET?: string;
  GITHUB_APP_PRIVATE_KEY?: string;
  CORS_ALLOWED_ORIGINS?: string;
  ALLOW_UNSAFE_INSTALLATION_ID_DEPLOY?: string;
  SESSION_SECRET?: string;
};

export type GitHubAppConfigState = {
  slug: string | null;
  appId: string | null;
  clientId: string | null;
  hasClientSecret: boolean;
  hasPrivateKey: boolean;
  jwtIssuer: string | null;
  jwtIssuerSource: 'client_id' | 'app_id' | null;
  missing: string[];
};

export type GitHubAppConfig = {
  slug: string;
  appId: string;
  clientId: string | null;
  clientSecret: string | null;
  privateKey: string;
  jwtIssuer: string;
  jwtIssuerSource: 'client_id' | 'app_id';
};

type GitHubAccount = {
  login: string;
  type: string;
  html_url?: string;
};

export type GitHubInstallation = {
  id: number;
  app_id: number;
  app_slug: string;
  account: GitHubAccount;
  target_type: string;
  repository_selection: string;
  permissions: Record<string, string>;
  html_url?: string;
  repositories_url?: string;
  suspended_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_API_VERSION = '2026-03-10';

export class BridgeConfigError extends Error {
  readonly missing: string[];

  constructor(message: string, missing: string[]) {
    super(message);
    this.name = 'BridgeConfigError';
    this.missing = missing;
  }
}

export class GitHubApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details: unknown = null) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
    this.details = details;
  }
}

function normalizeOptional(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizePem(pem: string): string {
  const normalized = pem.includes('\\n') ? pem.replace(/\\n/g, '\n') : pem;
  return normalized.endsWith('\n') ? normalized : `${normalized}\n`;
}

function encodeBase64Url(value: string | Uint8Array): string {
  const bytes = typeof value === 'string' ? Buffer.from(value, 'utf8') : Buffer.from(value);
  return bytes.toString('base64url');
}

function parseJsonValue(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function readGitHubAppConfigState(env: BridgeBindings): GitHubAppConfigState {
  const slug = normalizeOptional(env.GITHUB_APP_SLUG);
  const appId = normalizeOptional(env.GITHUB_APP_ID);
  const clientId = normalizeOptional(env.GITHUB_APP_CLIENT_ID);
  const clientSecret = normalizeOptional(env.GITHUB_APP_CLIENT_SECRET);
  const privateKey = normalizeOptional(env.GITHUB_APP_PRIVATE_KEY);

  const missing: string[] = [];
  if (!slug) missing.push('GITHUB_APP_SLUG');
  if (!appId) missing.push('GITHUB_APP_ID');
  if (!privateKey) missing.push('GITHUB_APP_PRIVATE_KEY');
  if (!clientId) missing.push('GITHUB_APP_CLIENT_ID');

  return {
    slug,
    appId,
    clientId,
    hasClientSecret: Boolean(clientSecret),
    hasPrivateKey: Boolean(privateKey),
    jwtIssuer: clientId ?? appId,
    jwtIssuerSource: clientId ? 'client_id' : appId ? 'app_id' : null,
    missing,
  };
}

export function requireGitHubAppConfig(env: BridgeBindings): GitHubAppConfig {
  const state = readGitHubAppConfigState(env);
  if (state.missing.length > 0) {
    throw new BridgeConfigError(
      `Missing required GitHub App configuration: ${state.missing.join(', ')}`,
      state.missing,
    );
  }

  return {
    slug: state.slug!,
    appId: state.appId!,
    clientId: state.clientId,
    clientSecret: normalizeOptional(env.GITHUB_APP_CLIENT_SECRET),
    privateKey: normalizePem(env.GITHUB_APP_PRIVATE_KEY!),
    jwtIssuer: state.jwtIssuer!,
    jwtIssuerSource: state.jwtIssuerSource!,
  };
}

export function createGitHubAppJwt(config: GitHubAppConfig, now = Date.now()): string {
  const issuedAt = Math.floor(now / 1000) - 60;
  const expiresAt = Math.floor(now / 1000) + 10 * 60;
  const encodedHeader = encodeBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const encodedPayload = encodeBase64Url(
    JSON.stringify({
      iat: issuedAt,
      exp: expiresAt,
      iss: config.jwtIssuer,
    }),
  );
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(createPrivateKey(config.privateKey)).toString('base64url');
  return `${signingInput}.${signature}`;
}

async function parseGitHubError(response: Response): Promise<GitHubApiError> {
  const text = await response.text();
  const details = text ? parseJsonValue(text) : null;
  let message = `${response.status} ${response.statusText}`;
  if (details && typeof details === 'object' && details !== null && 'message' in details) {
    const detailMessage = (details as { message?: unknown }).message;
    if (typeof detailMessage === 'string' && detailMessage) message = detailMessage;
  }
  return new GitHubApiError(message, response.status, details);
}

async function githubAppRequest<T>(
  config: GitHubAppConfig,
  path: string,
  init: RequestInit = {},
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const jwt = createGitHubAppJwt(config);
  const response = await fetchImpl(`${GITHUB_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${jwt}`,
      'User-Agent': 'linnet-setup-bridge',
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) throw await parseGitHubError(response);
  return (await response.json()) as T;
}

export async function getInstallationForAuthenticatedApp(
  config: GitHubAppConfig,
  installationId: number,
  fetchImpl: typeof fetch = fetch,
): Promise<GitHubInstallation> {
  return githubAppRequest<GitHubInstallation>(config, `/app/installations/${installationId}`, {}, fetchImpl);
}

export async function createInstallationAccessToken(
  config: GitHubAppConfig,
  installationId: number,
  body: Record<string, unknown> = {},
  fetchImpl: typeof fetch = fetch,
): Promise<{ token: string; expires_at: string; permissions?: Record<string, string> }> {
  return githubAppRequest<{ token: string; expires_at: string; permissions?: Record<string, string> }>(
    config,
    `/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    fetchImpl,
  );
}

export function parseInstallationId(value: string | null | undefined): number | null {
  if (!value) return null;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
  return parsed;
}
