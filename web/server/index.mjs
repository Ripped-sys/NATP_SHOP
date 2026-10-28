import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
const app = createApp({ databasePath: process.env.DATABASE_PATH ? path.resolve(process.env.DATABASE_PATH) : path.join(root, '.data/store.sqlite') });
const host = process.env.HOST || '127.0.0.1';
app.server.listen(port, host, () => console.log(`NATP website + SQLite store: http://${host}:${port}`));
let stopping = false;
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, async () => { if (stopping) return; stopping = true; await app.close(); process.exit(0); });
