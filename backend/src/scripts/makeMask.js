import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
import { removeBackground } from '@imgly/background-removal-node';

const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) {
  console.error('Usage: node makeMask.js <input> <output.png>');
  process.exit(1);
}

const url = pathToFileURL(path.resolve(input)).href;
const blob = await removeBackground(url, {
  model: 'small',
  output: { format: 'image/png', type: 'foreground' },
});
await fs.writeFile(output, Buffer.from(await blob.arrayBuffer()));
console.log('mask-ok');
