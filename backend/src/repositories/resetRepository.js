import { getPool, sql } from '../config/db.js';

export async function replaceCode(userId, codeHash, expiresAt) {
  const pool = await getPool();
  const request = pool.request();
  await request
    .input('userId', sql.Int, userId)
    .input('codeHash', sql.NVarChar(255), codeHash)
    .input('expiresAt', sql.DateTime2, expiresAt)
    .query(`
      UPDATE dbo.PasswordResets
      SET UsedAt = SYSUTCDATETIME()
      WHERE UserId = @userId AND UsedAt IS NULL;

      INSERT INTO dbo.PasswordResets (UserId, CodeHash, ExpiresAt)
      VALUES (@userId, @codeHash, @expiresAt);
    `);
}

export async function findActive(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT TOP 1 Id, CodeHash, ExpiresAt
      FROM dbo.PasswordResets
      WHERE UserId = @userId AND UsedAt IS NULL
      ORDER BY Id DESC
    `);
  return result.recordset[0] || null;
}

export async function markUsed(id) {
  const pool = await getPool();
  await pool
    .request()
    .input('id', sql.Int, id)
    .query('UPDATE dbo.PasswordResets SET UsedAt = SYSUTCDATETIME() WHERE Id = @id');
}
