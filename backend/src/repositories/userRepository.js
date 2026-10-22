import { getPool, sql } from '../config/db.js';

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.Id,
    fullName: row.FullName,
    email: row.Email,
    phone: row.Phone || '',
    passwordHash: row.PasswordHash,
    role: row.Role || 'customer',
    createdAt: row.CreatedAt,
  };
}

export async function findByEmail(email) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('email', sql.NVarChar(255), email)
    .query(`
      SELECT Id, FullName, Email, Phone, PasswordHash, Role, CreatedAt
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
      SELECT Id, FullName, Email, Phone, PasswordHash, Role, CreatedAt
      FROM dbo.Users
      WHERE Id = @id
    `);
  return mapUser(result.recordset[0]);
}

export async function createUser({ fullName, email, phone = null, passwordHash, role = 'customer' }) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('fullName', sql.NVarChar(80), fullName)
    .input('email', sql.NVarChar(255), email)
    .input('phone', sql.NVarChar(20), phone || null)
    .input('passwordHash', sql.NVarChar(255), passwordHash)
    .input('role', sql.NVarChar(20), role === 'admin' ? 'admin' : 'customer')
    .query(`
      INSERT INTO dbo.Users (FullName, Email, Phone, PasswordHash, Role)
      OUTPUT INSERTED.Id, INSERTED.FullName, INSERTED.Email, INSERTED.Phone, INSERTED.Role, INSERTED.CreatedAt
      VALUES (@fullName, @email, @phone, @passwordHash, @role)
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

export async function updatePhone(id, phone) {
  const pool = await getPool();
  await pool
    .request()
    .input('id', sql.Int, id)
    .input('phone', sql.NVarChar(20), phone || null)
    .query('UPDATE dbo.Users SET Phone = @phone WHERE Id = @id');
}

export async function upsertAdmin({ fullName, email, passwordHash }) {
  const existing = await findByEmail(email);
  if (existing) {
    const pool = await getPool();
    await pool
      .request()
      .input('email', sql.NVarChar(255), email)
      .input('passwordHash', sql.NVarChar(255), passwordHash)
      .input('fullName', sql.NVarChar(80), fullName)
      .query(`
        UPDATE dbo.Users
        SET PasswordHash = @passwordHash, FullName = @fullName, Role = N'admin'
        WHERE Email = @email
      `);
    return findByEmail(email);
  }
  return createUser({ fullName, email, passwordHash, role: 'admin' });
}
