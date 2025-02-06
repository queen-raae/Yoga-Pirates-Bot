import Database from "better-sqlite3";
import * as dotenv from "dotenv";
dotenv.config();

export const setupDatabase = async () => {
  const db = new Database(process.env.DATABASE_PATH);

  const sql = `
CREATE TABLE IF NOT EXISTS \`session\` (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  \`sessionTimestamp\` TEXT NOT NULL DEFAULT '2022-09-01T06:20:42.888Z',
  \`createdTimestamp\` TEXT NOT NULL DEFAULT '2022-09-01T06:21:10.125Z',
  \`discordUserId\` TEXT NOT NULL DEFAULT '',
  \`note\` TEXT,
  \`editedTimestamp\` TEXT,
  \`sessionDateString\` TEXT NOT NULL DEFAULT '',
  \`replyId\` TEXT,
  \`exercise\` TEXT NOT NULL DEFAULT 'yoga'
);

CREATE TABLE IF NOT EXISTS \`yogis\` (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  \`timezone\` TEXT
);
`;

  db.exec(sql);
  console.log("Tables created!");
};

// Set up the database
await setupDatabase();
