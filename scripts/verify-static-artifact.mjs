import path from 'node:path';
import { projectRoot, verifyStaticArtifact } from './build-static.mjs';

const targets = process.argv.slice(2);
if (!targets.length) targets.push('dist');
for (const target of targets) {
  const output = path.resolve(projectRoot, target);
  const result = await verifyStaticArtifact(output);
  process.stdout.write(`${target}: ${result.files} files verified at ${result.sourceDigest}; commit ${result.commit}; dirty=${result.dirty}.\n`);
}
