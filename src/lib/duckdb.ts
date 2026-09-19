import * as duckdb from "@duckdb/duckdb-wasm"
import mvpWasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url"
import mvpWorker from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url"
import ehWasm from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url"
import ehWorker from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url"

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null

export function getDuckDB(): Promise<duckdb.AsyncDuckDB> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const bundles = {
        mvp: { mainModule: mvpWasm, mainWorker: mvpWorker },
        eh: { mainModule: ehWasm, mainWorker: ehWorker },
      }
      const bundle = await duckdb.selectBundle(bundles)
      const worker = new Worker(bundle.mainWorker!)
      const logger = new duckdb.ConsoleLogger()
      const db = new duckdb.AsyncDuckDB(logger, worker)
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker)
      return db
    })()
  }
  return dbPromise
}

export interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  duration: number
}

export async function runQuery(sql: string): Promise<QueryResult> {
  const db = await getDuckDB()
  const conn = await db.connect()

  try {
    const start = performance.now()
    const result = await conn.query(sql)
    const duration = performance.now() - start

    const columns = result.schema.fields.map((f) => f.name)
    const rows = result.toArray().map((row) => {
      const obj: Record<string, unknown> = {}
      for (const col of columns) {
        obj[col] = row[col]
      }
      return obj
    })

    return { columns, rows, duration }
  } finally {
    await conn.close()
  }
}

export async function registerFile(file: File, name: string): Promise<void> {
  const db = await getDuckDB()
  const buffer = await file.arrayBuffer()
  await db.registerFileBuffer(name, new Uint8Array(buffer))
}

export async function getSchema(): Promise<Record<string, string[]>> {
  const db = await getDuckDB()
  const conn = await db.connect()

  try {
    const tablesResult = await conn.query("SHOW ALL TABLES")
    const tableNames = tablesResult
      .toArray()
      .map((row) => row["name"] as string)

    const schema: Record<string, string[]> = {}
    for (const table of tableNames) {
      const colResult = await conn.query(
        `DESCRIBE SELECT * FROM "${table}"`
      )
      schema[table] = colResult.toArray().map((row) => row["column_name"] as string)
    }
    return schema
  } finally {
    await conn.close()
  }
}
