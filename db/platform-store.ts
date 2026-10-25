/** Runtime storage facade for existing D1-shaped SKP API queries.
 * Vercel: PostgreSQL; local Cloudflare: D1. Never falls back to seed on PG errors.
 */
type Row = Record<string, unknown>;
type Result<T> = {results: T[]};
type Statement = {
 bind(...args: unknown[]): Statement;
 first<T extends Row>(): Promise<T|null>;
 all<T extends Row>(): Promise<Result<T>>;
 run(): Promise<{meta:{changes:number}}>;
 _sql?:string;
 _params?:unknown[];
};
type Database = {prepare(query:string):Statement;batch(statements:Statement[]):Promise<unknown>};
export type StoreEnvironment = {DB:Database;ADMIN_PASSWORD:string};
const isVercel = process.env.SKP_DATABASE_PROVIDER === "postgres";
let pgPromise: Promise<import("pg").Pool> | undefined;
async function pool(){
 if(!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for PostgreSQL");
 pgPromise ??= import("pg").then(({Pool})=>new Pool({
  connectionString:process.env.DATABASE_URL, max:5,
  connectionTimeoutMillis:5000, idleTimeoutMillis:10000
 }));
 return pgPromise;
}
function pgSql(input:string):string{
 let sql=input.replace(/datetime\('now','-24 hours'\)/gi,
   "to_char((now() AT TIME ZONE 'UTC') - interval '24 hours','YYYY-MM-DD HH24:MI:SS')");
 sql=sql.replace(/datetime\('now','-1 hour'\)/gi, "to_char((now() AT TIME ZONE 'UTC') - interval '1 hour','YYYY-MM-DD HH24:MI:SS')");
 sql=sql.replace(/datetime\('now'\)/gi, "to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI:SS')");
 let i=0;
 sql=sql.replace(/\?/g,()=>'$'+(++i));
 return sql;
}
function postgresDatabase():Database{
 return {prepare(query:string):Statement{
  const sql=pgSql(query);
  const statement=(params:unknown[]):Statement=>({
   bind(...args){return statement(args)},
   async all<T extends Row>():Promise<Result<T>>{
    const db=await pool();const response=await db.query(sql,params);return {results:response.rows as T[]};
   },
   async first<T extends Row>():Promise<T|null>{
    const db=await pool();const response=await db.query(sql,params);return (response.rows[0] as T|undefined)??null;
   },
   async run(){const db=await pool();const result=await db.query(sql,params);return {meta:{changes:result.rowCount??0}}},
   _sql:sql,_params:params
  });
  return statement([]);
 },
 async batch(statements){
  const db=await pool();const client=await db.connect();
  try{
   await client.query("BEGIN");
   for(const stmt of statements){
    if(!stmt._sql)throw Error("Unsupported batch statement");
    await client.query(stmt._sql,stmt._params||[]);
   }
   await client.query("COMMIT");
  }catch(e){await client.query("ROLLBACK");throw e}
  finally{client.release()}
 }};
}
let cfEnvPromise:Promise<StoreEnvironment>|undefined;
async function cloudflareEnv():Promise<StoreEnvironment>{
 cfEnvPromise ??= import("cloudflare:workers").then(({env})=>env as unknown as StoreEnvironment);
 return cfEnvPromise;
}
export async function storeEnv():Promise<StoreEnvironment>{
 if(isVercel) return {DB:postgresDatabase(),ADMIN_PASSWORD:process.env.ADMIN_PASSWORD||""};
 return cloudflareEnv();
}
export function isPostgres():boolean{return isVercel}
