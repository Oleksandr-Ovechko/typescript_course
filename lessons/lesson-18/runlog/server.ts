/**
 * runlog — мини-версия run-summary.tsv из wl-e2e: прогон присылает результат
 * кейса, сервис его хранит и отдаёт списком. Учебное приложение для Docker.
 *
 * Без DATABASE_URL результаты живут в памяти и пропадают с перезапуском,
 * с DATABASE_URL — в Postgres.
 *
 *   curl localhost:3000/
 *   curl -X POST "localhost:3000/runs?case=C19633&status=passed"
 *   curl localhost:3000/runs
 */
import { createServer, type ServerResponse } from 'node:http';
import { hostname } from 'node:os';
import pg from 'pg';

type Run = { caseId: string; status: string };

const port = Number(process.env.PORT ?? 3000);
const db = process.env.DATABASE_URL ? new pg.Pool({ connectionString: process.env.DATABASE_URL }) : null;
const memory: Run[] = [];

if (db) {
  await db.query('CREATE TABLE IF NOT EXISTS runs (case_id text NOT NULL, status text NOT NULL)');
}

async function save(run: Run): Promise<void> {
  if (db) {
    await db.query('INSERT INTO runs (case_id, status) VALUES ($1, $2)', [run.caseId, run.status]);
  } else {
    memory.push(run);
  }
}

async function list(): Promise<Run[]> {
  if (!db) return memory;
  const result = await db.query<Run>('SELECT case_id AS "caseId", status FROM runs');
  return result.rows;
}

function send(res: ServerResponse, code: number, body: unknown): void {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body) + '\n');
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  console.log(req.method, url.pathname + url.search);
  try {
    if (url.pathname === '/') {
      send(res, 200, { service: 'runlog', node: process.version, host: hostname(), storage: db ? 'postgres' : 'memory' });
    } else if (url.pathname === '/runs' && req.method === 'POST') {
      const run = { caseId: url.searchParams.get('case'), status: url.searchParams.get('status') } as Run;
      await save(run);
      send(res, 201, run);
    } else if (url.pathname === '/runs') {
      send(res, 200, await list());
    } else {
      send(res, 404, { error: 'not found' });
    }
  } catch (error) {
    console.error(error);
    send(res, 500, { error: String(error) });
  }
}).listen(port, () => {
  console.log(`runlog: порт ${port}, хранилище ${db ? 'postgres' : 'memory'}`);
});
