import sqlite3 from 'sqlite3';

export interface SlackToken {
  id?: number;
  access_token: string;
  refresh_token?: string;
  team_id: string;
  user_id: string;
  expires_at?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ScheduledMessage {
  id?: number;
  channel_id: string;
  channel_name: string;
  message: string;
  scheduled_time: string;
  status: 'pending' | 'sent' | 'cancelled' | 'failed';
  team_id: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private db: sqlite3.Database | null = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database('./slack_connect.db', (err) => {
        if (err) {
          reject(err);
          return;
        }
        this.createTables()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const runQuery = (sql: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        this.db!.run(sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    };

    // Create slack_tokens table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS slack_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        team_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        expires_at INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, user_id)
      )
    `);

    // Create scheduled_messages table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS scheduled_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id TEXT NOT NULL,
        channel_name TEXT NOT NULL,
        message TEXT NOT NULL,
        scheduled_time DATETIME NOT NULL,
        status TEXT DEFAULT 'pending',
        team_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for scheduled messages by scheduled_time
    await runQuery(`
      CREATE INDEX IF NOT EXISTS idx_scheduled_messages_time 
      ON scheduled_messages(scheduled_time, status)
    `);
  }

  // Token management methods
  public async saveToken(token: SlackToken): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Validate required fields
    if (!token.access_token) throw new Error('access_token is required');
    if (!token.team_id) throw new Error('team_id is required');
    if (!token.user_id) throw new Error('user_id is required');

    return new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT OR REPLACE INTO slack_tokens 
         (access_token, refresh_token, team_id, user_id, expires_at, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [token.access_token, token.refresh_token, token.team_id, token.user_id, token.expires_at],
        function(err) {
          if (err) {
            console.error('Database error saving token:', err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  public async getToken(teamId: string, userId: string): Promise<SlackToken | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.get(
        'SELECT * FROM slack_tokens WHERE team_id = ? AND user_id = ?',
        [teamId, userId],
        (err, row: SlackToken) => {
          if (err) reject(err);
          else resolve(row || null);
        }
      );
    });
  }

  public async updateToken(teamId: string, userId: string, token: Partial<SlackToken>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const updates: string[] = [];
    const values: any[] = [];

    if (token.access_token) {
      updates.push('access_token = ?');
      values.push(token.access_token);
    }
    if (token.refresh_token) {
      updates.push('refresh_token = ?');
      values.push(token.refresh_token);
    }
    if (token.expires_at) {
      updates.push('expires_at = ?');
      values.push(token.expires_at);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(teamId, userId);

    return new Promise((resolve, reject) => {
      this.db!.run(
        `UPDATE slack_tokens SET ${updates.join(', ')} WHERE team_id = ? AND user_id = ?`,
        values,
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // Scheduled message methods
  public async saveScheduledMessage(message: ScheduledMessage): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT INTO scheduled_messages 
         (channel_id, channel_name, message, scheduled_time, team_id, user_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          message.channel_id,
          message.channel_name,
          message.message,
          message.scheduled_time,
          message.team_id,
          message.user_id,
          message.status || 'pending'
        ],
        function(err) {
          if (err) {
            console.error('Error saving scheduled message:', err);
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  public async getScheduledMessages(teamId: string, userId: string): Promise<ScheduledMessage[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.all(
        'SELECT * FROM scheduled_messages WHERE team_id = ? AND user_id = ? ORDER BY scheduled_time ASC',
        [teamId, userId],
        (err, rows: ScheduledMessage[]) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  public async getPendingMessages(): Promise<ScheduledMessage[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      // Use UTC for comparison to avoid timezone issues
      const nowUTC = new Date().toISOString();
      
      this.db!.all(
        `SELECT * FROM scheduled_messages 
         WHERE status = 'pending' AND scheduled_time <= ? 
         ORDER BY scheduled_time ASC`,
        [nowUTC],
        (err, rows: ScheduledMessage[]) => {
          if (err) {
            console.error('Error getting pending messages:', err);
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  public async updateMessageStatus(id: number, status: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.run(
        'UPDATE scheduled_messages SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  public async cancelScheduledMessage(id: number, teamId: string, userId: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.run(
        `UPDATE scheduled_messages 
         SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
         WHERE id = ? AND team_id = ? AND user_id = ? AND status = 'pending'`,
        [id, teamId, userId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
