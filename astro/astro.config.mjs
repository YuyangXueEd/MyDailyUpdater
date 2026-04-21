import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { resolve } from 'node:path';

// Resolved at build time from astro/ directory (where npm run build executes)
const DATA_ROOT = resolve(process.cwd(), '../docs/data');

function normalizeBase(basePath) {
  if (!basePath || basePath === '/') return '/';
  return `/${String(basePath).replace(/^\/+|\/+$/g, '')}`;
}

const githubRepository = process.env.GITHUB_REPOSITORY ?? '';
const [repoOwner = '', repoName = ''] = githubRepository.split('/');
const isUserSiteRepo = repoOwner && repoName.toLowerCase() === `${repoOwner.toLowerCase()}.github.io`;

// Template-created repos on GitHub Pages should deploy under their own repo name
// automatically. Advanced deploys can override this with SITE_URL / SITE_BASE.
const inferredSite = repoOwner ? `https://${repoOwner}.github.io` : 'https://example.com';
const site = process.env.SITE_URL
  || process.env.PUBLIC_SITE_URL
  || inferredSite;
const base = normalizeBase(
  process.env.SITE_BASE
    || process.env.PUBLIC_SITE_BASE
    || (repoName && !isUserSiteRepo ? repoName : '/')
);

export default defineConfig({
  site,
  base,
  integrations: [mdx()],
  output: 'static',
  vite: {
    define: {
      __DATA_ROOT__: JSON.stringify(DATA_ROOT),
    }
  }
});
