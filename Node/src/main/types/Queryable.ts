import type { Connection, PoolConnection, Pool } from 'mysql2';

type Queryable = Connection | PoolConnection | Pool;

export { type Queryable };
