import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
export const shippedEntries = Object.freeze([
  'index.html',
  'favicon.ico',
  'favicon.svg',
  'about',
  'feedback',
  'privacy',
  'tool',
  'tools',
  'assets',
]);

const posixPath = (value) => value.split(path.sep).join('/');

async function hashFile(file) {
  const bytes = await readFile(file);
  return createHash('sha256').update(bytes).digest('hex');
}

async function collectEntry(root, relative, files) {
  const absolute = path.join(root, relative);
  const information = await stat(absolute);
  if (information.isDirectory()) {
    const children = (await readdir(absolute)).sort((left, right) => left.localeCompare(right, 'en'));
    for (const child of children) await collectEntry(root, path.join(relative, child), files);
    return;
  }
  if (!information.isFile()) throw new Error(`Unsupported shipped entry: ${relative}`);
  files.push({ path: posixPath(relative), size: information.size, sha256: await hashFile(absolute) });
}

export async function sourceManifest(root = projectRoot) {
  const files = [];
  for (const entry of shippedEntries) await collectEntry(root, entry, files);
  files.sort((left, right) => left.path.localeCompare(right.path, 'en'));
  const sourceDigest = createHash('sha256').update(JSON.stringify(files)).digest('hex');
  return { files, sourceDigest };
}

function gitValue(args, root) {
  try { return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return ''; }
}

function assertSafeOutput(root, output) {
  const relative = path.relative(root, output);
  if (relative !== 'dist') throw new Error(`Static output must resolve to the project dist directory, received: ${output}`);
}

export async function buildStatic({ root = projectRoot, output = path.join(root, 'dist') } = {}) {
  root = path.resolve(root); output = path.resolve(output); assertSafeOutput(root, output);
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const entry of shippedEntries) await cp(path.join(root, entry), path.join(output, entry), { recursive: true, force: true });
  const { files, sourceDigest } = await sourceManifest(root);
  const manifest = {
    schemaVersion: 1,
    commit: gitValue(['rev-parse', 'HEAD'], root) || 'unknown',
    dirty: Boolean(gitValue(['status', '--porcelain', '--untracked-files=all'], root)),
    sourceDigest,
    files,
  };
  await writeFile(path.join(output, '.aztoolbox-build.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

export async function verifyStaticArtifact(output, root = projectRoot) {
  root = path.resolve(root); output = path.resolve(output);
  const expected = await sourceManifest(root);
  const artifactFiles = [];
  const walk = async (directory, relative = '') => {
    for (const name of (await readdir(directory)).sort((left, right) => left.localeCompare(right, 'en'))) {
      if (!relative && name === '.aztoolbox-build.json') continue;
      const childRelative = path.join(relative, name); const absolute = path.join(directory, name); const information = await stat(absolute);
      if (information.isDirectory()) await walk(absolute, childRelative);
      else if (information.isFile()) artifactFiles.push({ path: posixPath(childRelative), size: information.size, sha256: await hashFile(absolute) });
      else throw new Error(`Unsupported artifact entry: ${childRelative}`);
    }
  };
  await walk(output);
  artifactFiles.sort((left, right) => left.path.localeCompare(right.path, 'en'));
  if (JSON.stringify(artifactFiles) !== JSON.stringify(expected.files)) throw new Error('Artifact inventory or hashes differ from the shipped source manifest.');
  const manifest = JSON.parse(await readFile(path.join(output, '.aztoolbox-build.json'), 'utf8'));
  if (manifest.schemaVersion !== 1 || manifest.sourceDigest !== expected.sourceDigest || JSON.stringify(manifest.files) !== JSON.stringify(expected.files)) throw new Error('Artifact provenance manifest does not match current shipped source.');
  const commit = gitValue(['rev-parse', 'HEAD'], root) || 'unknown';
  if (manifest.commit !== commit) throw new Error(`Artifact commit ${manifest.commit} does not match ${commit}.`);
  return { files: artifactFiles.length, sourceDigest: expected.sourceDigest, commit, dirty: manifest.dirty };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const manifest = await buildStatic();
  process.stdout.write(`Built ${manifest.files.length} files in dist (${manifest.sourceDigest}).\n`);
}
