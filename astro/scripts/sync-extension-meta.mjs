import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const EXTENSIONS_DIR = resolve(process.cwd(), '../extensions');
const OUTPUT_FILE = resolve(process.cwd(), 'src/lib/generatedExtensionRegistry.ts');

const REQUIRED_KEYS = [
  'key',
  'title',
  'subtitle',
  'icon',
  'defaultOrder',
  'layout',
  'displayName',
  'description',
  'category',
  'tags',
  'setupFields',
];

const dirents = await readdir(EXTENSIONS_DIR, { withFileTypes: true });
const metaEntries = [];

for (const dirent of dirents) {
  if (!dirent.isDirectory() || dirent.name.startsWith('_')) continue;
  const metaPath = resolve(EXTENSIONS_DIR, dirent.name, 'meta.json');
  const packageInitPath = resolve(EXTENSIONS_DIR, dirent.name, '__init__.py');
  const hasPackageInit = await stat(packageInitPath).then(() => true).catch(() => false);
  const hasMeta = await stat(metaPath).then(() => true).catch(() => false);

  if (!hasMeta) {
    if (hasPackageInit) {
      throw new Error(`Missing meta.json for extension package: ${dirent.name}`);
    }
    continue;
  }

  const raw = await readFile(metaPath, 'utf8');
  const parsed = JSON.parse(raw);

  for (const key of REQUIRED_KEYS) {
    if (!(key in parsed)) {
      throw new Error(`Missing required key "${key}" in ${metaPath}`);
    }
  }
  if (parsed.key !== dirent.name) {
    throw new Error(`Meta key "${parsed.key}" must match directory name "${dirent.name}"`);
  }

  metaEntries.push(parsed);
}

metaEntries.sort((a, b) => a.defaultOrder - b.defaultOrder || a.key.localeCompare(b.key));

const registry = Object.fromEntries(metaEntries.map((entry) => [entry.key, entry]));
const source = `// Auto-generated from extensions/<name>/meta.json.
// Run \`npm run sync:extension-meta\` from astro/ to refresh.

export const GENERATED_EXTENSION_REGISTRY = ${JSON.stringify(registry, null, 2)} as const;
`;

await writeFile(OUTPUT_FILE, source);
console.log(`Wrote ${OUTPUT_FILE}`);
