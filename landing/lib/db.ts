import { neon } from '@neondatabase/serverless';

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(process.env.DATABASE_URL);
}

export interface WaitlistEntry {
  id: number;
  email: string;
  name: string | null;
  device_os: string[];
  daily_screen_time: string;
  created_at: Date;
  email_sent: boolean;
}

export async function addToWaitlist(data: {
  email: string;
  name: string | null;
  deviceOS: string[];
  dailyScreenTime: string;
}): Promise<{ id: number; isNew: boolean }> {
  const sql = getDb();

  // Check if email already exists
  const existing = await sql`
    SELECT id FROM waitlist WHERE email = ${data.email}
  `;

  if (existing.length > 0) {
    // Update existing entry
    await sql`
      UPDATE waitlist SET
        name = COALESCE(${data.name}, name),
        device_os = ${data.deviceOS},
        daily_screen_time = ${data.dailyScreenTime}
      WHERE email = ${data.email}
    `;
    return { id: existing[0].id as number, isNew: false };
  }

  // Insert new entry
  const result = await sql`
    INSERT INTO waitlist (email, name, device_os, daily_screen_time)
    VALUES (${data.email}, ${data.name}, ${data.deviceOS}, ${data.dailyScreenTime})
    RETURNING id
  `;

  return { id: result[0].id as number, isNew: true };
}

export async function markEmailSent(id: number): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE waitlist SET email_sent = true WHERE id = ${id}
  `;
}

// SQL to create the table (run this once)
export const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS waitlist (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    device_os TEXT[] NOT NULL,
    daily_screen_time VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    email_sent BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);
`;
