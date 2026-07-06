import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"

import { env } from "@config/env"
import * as schema from "@db/schema"

const clientConfig = env.tursoAuthToken
  ? {
      authToken: env.tursoAuthToken,
      url: env.tursoDatabaseUrl,
    }
  : {
      url: env.tursoDatabaseUrl,
    }

const client = createClient({
  ...clientConfig,
})

export const db = drizzle({ client, schema })
