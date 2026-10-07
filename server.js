import path from 'path';
import fs from 'fs';

// Prepend custom Node binary directory to PATH for server child processes
if (fs.existsSync('/home/qkhq14bffd/node/bin')) {
  process.env.PATH = `/home/qkhq14bffd/node/bin:${process.env.PATH || ''}`;
}

import { startProdServer } from 'vinext/server/prod-server';

const port = process.env.PORT || 3000;
const host = process.env.HOST || '127.0.0.1';

const hasWebFolder = fs.existsSync(path.resolve('web'));
const rootDir = hasWebFolder ? path.resolve('web') : process.cwd();

const logMsg = `[${new Date().toISOString()}] Starting Dergo24 production server in ${rootDir} on ${host}:${port} (process.env.PORT=${process.env.PORT})\n`;
fs.appendFileSync(path.join(rootDir, 'install.log'), logMsg);

startProdServer({
  rootDir,
  port,
  host
}).then(({ port: actualPort }) => {
  const msg = `[${new Date().toISOString()}] Dergo24 production server running on port ${actualPort}\n`;
  fs.appendFileSync(path.join(rootDir, 'install.log'), msg);
}).catch((err) => {
  const errMsg = `[${new Date().toISOString()}] Failed to start production server: ${err.stack || err}\n`;
  fs.appendFileSync(path.join(rootDir, 'install.log'), errMsg);
  process.exit(1);
});
