import { PgClient } from "@effect/sql-pg";
import { Effect, Redacted, String } from "effect";



export interface Env {
  // If you set another name in wrangler.toml as the value for 'binding',
  // replace "HYPERDRIVE" with the variable name you defined.
  HYPERDRIVE: Hyperdrive;
}

const query = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient
  return yield* sql`SELECT 'Hello, World!';`
}).pipe(Effect.timeout("5 seconds"))

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const runnable = query.pipe(
      Effect.provide(PgClient.layer({
        url: Redacted.make(env.HYPERDRIVE.connectionString),
        transformQueryNames: String.camelToSnake,
        transformResultNames: String.snakeToCamel,
        // idleTimeout: "5 seconds",
        // connectTimeout: "5 seconds",
        ssl: {
          rejectUnauthorized: false
        }
      })),
    )
    try {
      const result = await Effect.runPromise(runnable)
      const formattedResult = JSON.stringify({ result: result }, null, 2);
      return new Response(formattedResult, {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      console.log(e);
      return Response.json({ error: e.message }, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
