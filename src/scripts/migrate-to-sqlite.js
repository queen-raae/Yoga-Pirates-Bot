import { getXataClient } from "../xata.js";
import { writeFileSync } from "fs";
import * as dotenv from "dotenv";
dotenv.config();

import Database from "better-sqlite3";

const db = new Database("yoga.db");

const xata = getXataClient();

const records = await xata.db.session.getAll();

const insertStatement = db.prepare(`
  INSERT OR IGNORE INTO session (
    sessionTimestamp,
    createdTimestamp,
    discordUserId,
    note,
    editedTimestamp,
    sessionDateString,
    replyId,
    exercise
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

records.forEach((record) => {
  insertStatement.run(
    record.sessionTimestamp,
    record.createdTimestamp,
    record.discordUserId,
    record.note,
    record.editedTimestamp,
    record.sessionDateString,
    record.replyId,
    record.exercise
  );
});
