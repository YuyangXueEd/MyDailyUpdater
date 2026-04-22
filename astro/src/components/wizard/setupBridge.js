// @ts-check

/**
 * @typedef {{ owner: string, repo: string }} RepoRef
 */

/**
 * @param {string | undefined | null} value
 * @returns {string}
 */
export function normalizeBridgeUrl(value) {
  return (value ?? '').trim().replace(/\/+$/, '');
}

/**
 * @param {Location | URL} [locationLike]
 * @returns {number | null}
 */
export function readInstallationIdFromLocation(locationLike = window.location) {
  const url = locationLike instanceof URL ? locationLike : new URL(locationLike.href);
  const value = url.searchParams.get('installation_id');
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * @param {string} href
 * @returns {string}
 */
export function buildCleanReturnTo(href) {
  const url = new URL(href);
  url.searchParams.delete('github_auth');
  return url.toString();
}

/**
 * @param {string} bridgeUrl
 * @param {string} path
 * @param {Record<string, string | number | undefined | null>} [params]
 * @returns {string}
 */
export function buildBridgeUrl(bridgeUrl, path, params = {}) {
  const url = new URL(path, `${normalizeBridgeUrl(bridgeUrl)}/`);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/**
 * @param {{ bridgeUrl: string, redirect?: (url: string) => void }} options
 */
export function startBridgeInstall(options) {
  const next = buildBridgeUrl(options.bridgeUrl, '/api/github/install');
  (options.redirect ?? ((url) => { window.location.href = url; }))(next);
}

/**
 * @param {{ bridgeUrl: string, installationId: number, returnTo: string, repo?: RepoRef | null, redirect?: (url: string) => void }} options
 */
export function startBridgeAuthorize(options) {
  const next = buildBridgeUrl(options.bridgeUrl, '/api/github/authorize', {
    installation_id: options.installationId,
    owner: options.repo?.owner,
    repo: options.repo?.repo,
    return_to: options.returnTo,
  });
  (options.redirect ?? ((url) => { window.location.href = url; }))(next);
}

/**
 * @param {{ bridgeUrl: string, installationId?: number | null, repo?: RepoRef | null, fetchImpl?: typeof fetch }} options
 */
export async function fetchBridgeSession(options) {
  const url = buildBridgeUrl(options.bridgeUrl, '/api/github/session', {
    installation_id: options.installationId ?? undefined,
    owner: options.repo?.owner,
    repo: options.repo?.repo,
  });
  const response = await (options.fetchImpl ?? fetch)(url, {
    credentials: 'include',
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : `${response.status} ${response.statusText}`);
  }
  return data;
}

/**
 * @param {{ bridgeUrl: string, fetchImpl?: typeof fetch }} options
 */
export async function logoutBridgeSession(options) {
  const response = await (options.fetchImpl ?? fetch)(buildBridgeUrl(options.bridgeUrl, '/api/github/logout'), {
    method: 'POST',
    credentials: 'include',
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : `${response.status} ${response.statusText}`);
  }
  return data;
}

/**
 * @param {{ bridgeUrl: string, payload: unknown, fetchImpl?: typeof fetch }} options
 */
export async function deployViaBridge(options) {
  const response = await (options.fetchImpl ?? fetch)(buildBridgeUrl(options.bridgeUrl, '/api/deploy'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options.payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : `${response.status} ${response.statusText}`);
  }
  return data;
}
