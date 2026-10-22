import './env.js';
import sql from 'mssql/msnodesqlv8.js';

let poolPromise;

function connectionString() {
  const driver = process.env.DB_DRIVER || 'ODBC Driver 17 for SQL Server';
  const server = process.env.DB_SERVER || 'lpc:.';
  const database = process.env.DB_NAME || 'BanQuanAo';
  return `Driver={${driver}};Server=${server};Database=${database};Trusted_Connection=Yes;`;
}

export function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool({
      connectionString: connectionString(),
    })
      .connect()
      .catch((error) => {
        poolPromise = null;
        throw error;
      });
  }
  return poolPromise;
}

export { sql };
