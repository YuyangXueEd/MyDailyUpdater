import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildGitHubAuthorizeUrl,
  createAuthorizeStateToken,
  readAuthorizeStateToken,
  requireGitHubAuthConfig,
  verifyUserCanAccessRepository,
} from '../src/auth';
import type { BridgeBindings } from '../src/github';

const env: BridgeBindings = {
  GITHUB_APP_CLIENT_ID: 'Iv1.test',
  GITHUB_APP_CLIENT_SECRET: 'secret',
  SESSION_SECRET: 'test-session-secret',
};

test('requireGitHubAuthConfig reads required auth settings', () => {
  const config = requireGitHubAuthConfig(env);
  assert.equal(config.clientId, 'Iv1.test');
  assert.equal(config.clientSecret, 'secret');
  assert.equal(config.sessionSecret, 'test-session-secret');
});

test('authorize state round-trips through encrypted token', async () => {
  const config = requireGitHubAuthConfig(env);
  const token = await createAuthorizeStateToken(config, {
    nonce: 'nonce-1',
    issuedAt: Date.now(),
    installationId: 42,
    repo: { owner: 'octocat', repo: 'briefing' },
    returnTo: 'https://example.com/setup',
  });

  const state = await readAuthorizeStateToken(config, token);
  assert.equal(state.nonce, 'nonce-1');
  assert.equal(state.installationId, 42);
  assert.deepEqual(state.repo, { owner: 'octocat', repo: 'briefing' });
  assert.equal(state.returnTo, 'https://example.com/setup');
});

test('buildGitHubAuthorizeUrl includes client_id, redirect_uri, and state', () => {
  const config = requireGitHubAuthConfig(env);
  const url = new URL(
    buildGitHubAuthorizeUrl(config, 'https://bridge.example.com/api/github/callback', 'state-token'),
  );

  assert.equal(url.origin, 'https://github.com');
  assert.equal(url.pathname, '/login/oauth/authorize');
  assert.equal(url.searchParams.get('client_id'), 'Iv1.test');
  assert.equal(url.searchParams.get('redirect_uri'), 'https://bridge.example.com/api/github/callback');
  assert.equal(url.searchParams.get('state'), 'state-token');
});

test('verifyUserCanAccessRepository confirms repository visibility', async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        total_count: 2,
        repositories: [
          { id: 1, name: 'briefing', full_name: 'octocat/briefing' },
          { id: 2, name: 'other', full_name: 'octocat/other' },
        ],
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      },
    );

  const access = await verifyUserCanAccessRepository(
    'user-token',
    42,
    { owner: 'octocat', repo: 'briefing' },
    fetchImpl,
  );

  assert.deepEqual(access, {
    verified: true,
    repositoryId: 1,
  });
});
