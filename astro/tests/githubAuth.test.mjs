import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildGitHubAppAuthorizeUrl,
  createPkceChallenge,
  exchangeGitHubAppCode,
  listAccessibleRepositories,
} from '../src/components/wizard/githubAuth.js';

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 400 ? 'Bad Request' : 'OK',
    async json() {
      return body;
    },
  };
}

test('buildGitHubAppAuthorizeUrl includes PKCE parameters', () => {
  const url = new URL(buildGitHubAppAuthorizeUrl({
    clientId: 'Iv1.123',
    redirectUri: 'https://example.com/setup',
    state: 'state-123',
    codeChallenge: 'challenge-456',
  }));

  assert.equal(url.origin, 'https://github.com');
  assert.equal(url.pathname, '/login/oauth/authorize');
  assert.equal(url.searchParams.get('client_id'), 'Iv1.123');
  assert.equal(url.searchParams.get('redirect_uri'), 'https://example.com/setup');
  assert.equal(url.searchParams.get('state'), 'state-123');
  assert.equal(url.searchParams.get('code_challenge'), 'challenge-456');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
});

test('createPkceChallenge returns expected hash for verifier', async () => {
  const challenge = await createPkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');
  assert.equal(challenge, 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
});

test('exchangeGitHubAppCode posts the expected form body', async () => {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, init });
    return jsonResponse(200, {
      access_token: 'ghu_123',
      expires_in: 28800,
      refresh_token: 'ghr_456',
      refresh_token_expires_in: 15897600,
    });
  };

  const result = await exchangeGitHubAppCode({
    clientId: 'Iv1.123',
    clientSecret: 'shhh',
    code: 'oauth-code',
    redirectUri: 'https://example.com/setup',
    codeVerifier: 'verifier-123',
    fetchImpl,
  });

  assert.equal(result.accessToken, 'ghu_123');
  assert.equal(result.refreshToken, 'ghr_456');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://github.com/login/oauth/access_token');
  const body = calls[0].init.body;
  assert.equal(body.get('client_id'), 'Iv1.123');
  assert.equal(body.get('client_secret'), 'shhh');
  assert.equal(body.get('code'), 'oauth-code');
  assert.equal(body.get('redirect_uri'), 'https://example.com/setup');
  assert.equal(body.get('code_verifier'), 'verifier-123');
});

test('listAccessibleRepositories merges repositories from all installations', async () => {
  const responses = [
    jsonResponse(200, { installations: [{ id: 1 }, { id: 2 }] }),
    jsonResponse(200, {
      repositories: [
        {
          id: 10,
          name: 'alpha',
          full_name: 'octo/alpha',
          html_url: 'https://github.com/octo/alpha',
          owner: { login: 'octo' },
        },
      ],
    }),
    jsonResponse(200, {
      repositories: [
        {
          id: 11,
          name: 'beta',
          full_name: 'octo/beta',
          html_url: 'https://github.com/octo/beta',
          owner: { login: 'octo' },
        },
        {
          id: 10,
          name: 'alpha',
          full_name: 'octo/alpha',
          html_url: 'https://github.com/octo/alpha',
          owner: { login: 'octo' },
        },
      ],
    }),
  ];

  const fetchImpl = async () => {
    const response = responses.shift();
    assert.ok(response, 'Unexpected extra fetch call');
    return response;
  };

  const repos = await listAccessibleRepositories({
    token: 'ghu_123',
    fetchImpl,
  });

  assert.deepEqual(
    repos.map((repo) => repo.fullName),
    ['octo/alpha', 'octo/beta'],
  );
});
