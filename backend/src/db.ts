export async function getAdminByUsername(
  db: D1Database,
  username: string
) {
  return await db
    .prepare(
      `SELECT id, username, password_hash
       FROM admins
       WHERE username = ?
       LIMIT 1`
    )
    .bind(username)
    .first<{
      id: number;
      username: string;
      password_hash: string;
    }>();
}

export async function createSession(
  db: D1Database,
  adminId: number,
  tokenHash: string,
  expiresAt: string
) {
  await db
    .prepare(
      `INSERT INTO admin_sessions
       (admin_id, token_hash, expires_at)
       VALUES (?, ?, ?)`
    )
    .bind(adminId, tokenHash, expiresAt)
    .run();
}

export async function getSession(
  db: D1Database,
  tokenHash: string
) {
  return await db
    .prepare(
      `SELECT
         admin_sessions.id,
         admin_sessions.admin_id,
         admin_sessions.expires_at,
         admins.username
       FROM admin_sessions
       JOIN admins
         ON admins.id = admin_sessions.admin_id
       WHERE admin_sessions.token_hash = ?
         AND admin_sessions.expires_at > datetime('now')
       LIMIT 1`
    )
    .bind(tokenHash)
    .first<{
      id: number;
      admin_id: number;
      expires_at: string;
      username: string;
    }>();
}

export async function deleteSession(
  db: D1Database,
  tokenHash: string
) {
  await db
    .prepare(
      `DELETE FROM admin_sessions
       WHERE token_hash = ?`
    )
    .bind(tokenHash)
    .run();
}