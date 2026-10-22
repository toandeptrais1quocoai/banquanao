import './env.js';

const useWindowsAuth =
  String(process.env.DB_AUTH || '').toLowerCase() === 'windows' ||
  (!process.env.DB_USER && !process.env.DB_PASSWORD);

const sql = useWindowsAuth
  ? (await import('mssql/msnodesqlv8.js')).default
  : (await import('mssql')).default;

let poolPromise;

function windowsConnectionString() {
  const driver = process.env.DB_DRIVER || 'ODBC Driver 17 for SQL Server';
  const server = process.env.DB_SERVER || 'lpc:.';
  const database = process.env.DB_NAME || 'BanQuanAo';
  return `Driver={${driver}};Server=${server};Database=${database};Trusted_Connection=Yes;`;
}

function tcpConfig() {
  const server = process.env.DB_SERVER;
  if (!server) {
    throw new Error('Thiếu DB_SERVER (host Azure SQL / SQL Server).');
  }
  if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
    throw new Error('Thiếu DB_USER / DB_PASSWORD cho kết nối SQL trên cloud.');
  }

  return {
    server,
    database: process.env.DB_NAME || 'BanQuanAo',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 1433),
    options: {
      encrypt: process.env.DB_ENCRYPT !== 'false',
      trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

export function getPool() {
  if (!poolPromise) {
    const config = useWindowsAuth
      ? { connectionString: windowsConnectionString() }
      : tcpConfig();

    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .catch((error) => {
        poolPromise = null;
        throw error;
      });
  }
  return poolPromise;
}

export { sql };
