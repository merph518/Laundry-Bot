import oracledb from "oracledb";

const POOL_MIN = 0;
const POOL_MAX = 4;
const POOL_CLOSE_DRAIN_SECONDS = 5;

let poolPromise: Promise<oracledb.Pool> | null = null;

function getOracleConfig(): oracledb.ConnectionAttributes {
  const user = process.env.ORACLE_USER;
  const password = process.env.ORACLE_PASSWORD;
  const connectString = process.env.ORACLE_CONNECT_STRING;

  if (!user || !password || !connectString) {
    throw new Error(
      "Missing Oracle config. Set ORACLE_USER, ORACLE_PASSWORD, and ORACLE_CONNECT_STRING.",
    );
  }

  return { user, password, connectString };
}

// Created on first use. Concurrent first callers share one pool, and a failed creation is
// forgotten so the next call tries again.
function getPool(): Promise<oracledb.Pool> {
  if (!poolPromise) {
    poolPromise = oracledb
      .createPool({ ...getOracleConfig(), poolMin: POOL_MIN, poolMax: POOL_MAX })
      .catch((error: unknown) => {
        poolPromise = null;
        throw error;
      });
  }

  return poolPromise;
}

export async function withOracleConnection<T>(
  handler: (connection: oracledb.Connection) => Promise<T>,
): Promise<T> {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    return await handler(connection);
  } finally {
    await connection.close();
  }
}

export async function closeOraclePool(): Promise<void> {
  if (!poolPromise) {
    return;
  }

  const pool = await poolPromise.catch(() => null);
  poolPromise = null;
  await pool?.close(POOL_CLOSE_DRAIN_SECONDS);
}
