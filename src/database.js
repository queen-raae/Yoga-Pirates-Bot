import Database from "better-sqlite3";

const db = new Database("yoga.db");

const sql = `
CREATE TABLE IF NOT EXISTS \`session\` (
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
  \`timezone\` TEXT
);
`;

db.exec(sql);
console.log("Tables created!");
