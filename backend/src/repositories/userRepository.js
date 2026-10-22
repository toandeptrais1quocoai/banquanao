import { getPool, sql } from '../config/db.js';

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.Id,
    fullName: row.FullName,
    email: row.Email,
    passwordHash: row.PasswordHash,
    createdAt: row.CreatedAt,
  };
}

export async function findByEmail(email) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('email', sql.NVarChar(255), email)
    .query(`
      SELECT Id, FullName, Email, PasswordHash, CreatedAt
      FROM dbo.Users
      WHERE Email = @email
    `);
  return mapUser(result.recordset[0]);
}

export async function findById(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`
      SELECT Id, FullName, Email, PasswordHash, CreatedAt
      FROM dbo.Users
      WHERE Id = @id
    `);
  return mapUser(result.recordset[0]);
}

export async function createUser({ fullName, email, passwordHash }) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('fullName', sql.NVarChar(80), fullName)
    .input('email', sql.NVarChar(255), email)
    .input('passwordHash', sql.NVarChar(255), passwordHash)
    .query(`
      INSERT INTO dbo.Users (FullName, Email, PasswordHash)
      OUTPUT INSERTED.Id, INSERTED.FullName, INSERTED.Email, INSERTED.CreatedAt
      VALUES (@fullName, @email, @passwordHash)
    `);
  return mapUser(result.recordset[0]);
}

export async function updatePassword(id, passwordHash) {
  const pool = await getPool();
  await pool
    .request()
    .input('id', sql.Int, id)
    .input('passwordHash', sql.NVarChar(255), passwordHash)
    .query('UPDATE dbo.Users SET PasswordHash = @passwordHash WHERE Id = @id');
}
