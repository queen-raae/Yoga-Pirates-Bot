import { writeFileSync } from "fs";
import * as dotenv from "dotenv";
dotenv.config();
import Database from "better-sqlite3";

const db = new Database(process.env.DATABASE_PATH);

const selectAllSessions = db.prepare(`
  SELECT *
  FROM session
`);

const records = selectAllSessions.all();

console.log("number of sessions", records.length);

const recordsAsString = JSON.stringify(records);

writeFileSync("sessions.json", recordsAsString);

const selectAllYogis = db.prepare(`
  SELECT *
  FROM yogis
`);

const yogis = selectAllYogis.all();

console.log("number of yogis", yogis.length);

const yogisAsString = JSON.stringify(yogis);

writeFileSync("yogis.json", yogisAsString);
