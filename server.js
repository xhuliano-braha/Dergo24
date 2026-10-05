import { spawn } from 'child_process';
import path from 'path';

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';
const webDir = path.resolve('web');

console.log(`Starting Dergo24 production server in ${webDir} on ${host}:${port}...`);

const child = spawn('npx', ['vinext', 'start', '-p', String(port), '-H', host], {
  cwd: webDir,
  stdio: 'inherit',
  shell: true,
  env: process.env
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
