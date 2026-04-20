// @ts-check

/**
 * @typedef {{ id: number, login?: string, account?: { login?: string }, permissions?: Record<string, string> }} InstallationRef
 * @typedef {{ id: number, owner: string, repo: string, fullName: string, htmlUrl: string, permissions?: Record<string, string> }} AccessibleRepo
 * @typedef {{ accessToken: string, expiresIn?: number, refreshToken?: string, refreshTokenExpiresIn?: number }} GitHubTokenResponse
 * @typedef {{ login: string, avatarUrl: string, htmlUrl: string, name?: string }} GitHubUser
 */

const GITHUB_LOGIN_BASE = 'https://github.com/login/oauth';
const GITHUB_API_BASE = 'https://api.github.com';
const API_VERSION = '2022-11-28';

/**
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * @param {number} [length]
 * @returns {string}
 */
export function createRandomVerifier(length = 64) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes).slice(0, length);
}

/**
 * @param {string} verifier
 * @returns {Promise<string>}
 */
export async function createPkceChallenge(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return toBase64Url(new Uint8Array(digest));
}

/**
 * @param {{
 *   clientId: string,
 *   redirectUri: string,
 *   state: string,
 *   codeChallenge: string,
 *   prompt?: string,
 * }} options
 * @returns {string}
 */
export function buildGitHubAppAuthorizeUrl(options) {
  const url = new URL(`${GITHUB_LOGIN_BASE}/authorize`);
  url.searchParams.set('client_id', options.clientId);
  url.searchParams.set('redirect_uri', options.redirectUri);
  url.searchParams.set('state', options.state);
  url.searchParams.set('code_challenge', options.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('prompt', options.prompt ?? 'select_account');
  return url.toString();
}

/**
 * @param {string} token
 * @returns {Record<string, string>}
 */
function githubHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': API_VERSION,
  };
}

/**
 * @param {Response} response
 * @returns {Promise<Error>}
 */
async function parseResponseError(response) {
  let message = `${response.status} ${response.statusText}`;
  try {
    const data = await response.json();
    if (typeof data?.error_description === 'string') message = data.error_description;
    else if (typeof data?.message === 'string') message = data.message;
    else if (typeof data?.error === 'string') message = data.error;
  } catch {
    // Fall back to status text.
  }
  return new Error(message);
}

/**
 * @param {{
 *   clientId: string,
 *   clientSecret: string,
 *   code: string,
 *   redirectUri: string,
 *   codeVerifier: string,
 *   fetchImpl?: typeof fetch,
 * }} options
 * @returns {Promise<GitHubTokenResponse>}
 */
export async function exchangeGitHubAppCode(options) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const body = new URLSearchParams({
    client_id: options.clientId,
    client_secret: options.clientSecret,
    code: options.code,
    redirect_uri: options.redirectUri,
    code_verifier: options.codeVerifier,
  });

  const response = await fetchImpl(`${GITHUB_LOGIN_BASE}/access_token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) throw await parseResponseError(response);

  const data = await response.json();
  if (typeof data?.error === 'string') {
    throw new Error(data.error_description ?? data.error);
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token,
    refreshTokenExpiresIn: data.refresh_token_expires_in,
  };
}

/**
 * @param {string} token
 * @param {string} path
 * @param {typeof fetch} [fetchImpl]
 * @returns {Promise<any>}
 */
async function githubGet(token, path, fetchImpl = fetch) {
  const response = await fetchImpl(`${GITHUB_API_BASE}${path}`, {
    headers: githubHeaders(token),
  });
  if (!response.ok) throw await parseResponseError(response);
  return response.json();
}

/**
 * @param {{ token: string, fetchImpl?: typeof fetch }} options
 * @returns {Promise<InstallationRef[]>}
 */
export async function listUserInstallations(options) {
  const data = await githubGet(options.token, '/user/installations?per_page=100', options.fetchImpl);
  return Array.isArray(data?.installations) ? data.installations : [];
}

/**
 * @param {{ token: string, installationId: number, fetchImpl?: typeof fetch }} options
 * @returns {Promise<AccessibleRepo[]>}
 */
export async function listInstallationRepositories(options) {
  const data = await githubGet(
    options.token,
    `/user/installations/${options.installationId}/repositories?per_page=100`,
    options.fetchImpl,
  );

  if (!Array.isArray(data?.repositories)) return [];

  return data.repositories.map(/** @param {any} repo */ (repo) => ({
    id: repo.id,
    owner: repo.owner?.login ?? '',
    repo: repo.name ?? '',
    fullName: repo.full_name ?? `${repo.owner?.login ?? ''}/${repo.name ?? ''}`,
    htmlUrl: repo.html_url ?? '',
    permissions: repo.permissions ?? {},
  }));
}

/**
 * @param {{ token: string, fetchImpl?: typeof fetch }} options
 * @returns {Promise<AccessibleRepo[]>}
 */
export async function listAccessibleRepositories(options) {
  const installations = await listUserInstallations(options);
  const repoMap = new Map();

  for (const installation of installations) {
    const repos = await listInstallationRepositories({
      token: options.token,
      installationId: installation.id,
      fetchImpl: options.fetchImpl,
    });
    for (const repo of repos) repoMap.set(repo.fullName, repo);
  }

  return [...repoMap.values()].sort((a, b) => a.fullName.localeCompare(b.fullName));
}

/**
 * @param {{ token: string, fetchImpl?: typeof fetch }} options
 * @returns {Promise<GitHubUser>}
 */
export async function getCurrentUser(options) {
  const data = await githubGet(options.token, '/user', options.fetchImpl);
  return {
    login: data.login,
    avatarUrl: data.avatar_url,
    htmlUrl: data.html_url,
    name: data.name,
  };
}
