import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { buildStatic, projectRoot, verifyStaticArtifact } from '../../scripts/build-static.mjs';

test('static build is repeatable, complete and rejects stale or changed artifact files', async () => {
  const output = path.join(projectRoot, 'dist');
  const first = await buildStatic();
  const firstManifest = await readFile(path.join(output, '.aztoolbox-build.json'), 'utf8');
  const firstVerification = await verifyStaticArtifact(output);
  const second = await buildStatic();
  const secondManifest = await readFile(path.join(output, '.aztoolbox-build.json'), 'utf8');
  const secondVerification = await verifyStaticArtifact(output);
  assert.equal(second.sourceDigest, first.sourceDigest);
  assert.equal(secondManifest, firstManifest);
  assert.deepEqual(secondVerification, firstVerification);
  assert.ok(second.files.some((entry) => entry.path === 'assets/js/motion.js'));
  for (const required of ['assets/js/batch2-tools.js','assets/js/batch3-tools.js','assets/js/batch4-tools.js','assets/js/batch5-tools.js','assets/js/tool-guards.js']) {
    assert.ok(second.files.some((entry) => entry.path === required), `${required} must ship`);
  }

  const temporary = await mkdtemp(path.join(os.tmpdir(), 'aztoolbox-artifact-'));
  try {
    await cp(output, temporary, { recursive: true });
    await writeFile(path.join(temporary, 'assets/js/app.js'), '// stale artifact\n', 'utf8');
    await assert.rejects(verifyStaticArtifact(temporary), /inventory or hashes differ/u);
    await cp(output, temporary, { recursive: true, force: true });
    await writeFile(path.join(temporary, 'stale.txt'), 'stale\n', 'utf8');
    await assert.rejects(verifyStaticArtifact(temporary), /inventory or hashes differ/u);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
