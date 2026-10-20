import pool from '../db';

export async function logActivity(
  userId: number | string | null | undefined,
  action: string,
  details?: string | Record<string, any>,
  ipAddress?: string
): Promise<void> {
  try {
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details || '';
    const validUserId = userId ? Number(userId) : null;

    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [validUserId, action, detailsStr, ipAddress || '127.0.0.1']
    );
  } catch (err) {
    console.error('Failed to record activity log:', err);
  }
}
