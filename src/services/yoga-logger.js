import { Events } from "discord.js";
import { addDays, format } from "date-fns";
import Database from "better-sqlite3";

const db = new Database(process.env.DATABASE_PATH);

const ALLOWED_CHANNELS = ["yoga", "exercise"];

function truncate(str, maxLength) {
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + "...";
  }
  return str;
}

const daysOfYogaStatement = db.prepare(`
  SELECT COUNT(DISTINCT sessionDateString) AS daysOfYoga
  FROM session
  WHERE 
    discordUserId = ? AND 
    exercise = 'yoga' AND
    sessionDateString != ?
`);

const getSessionStatement = db.prepare(`
  SELECT *
  FROM session
  WHERE
    id = ?
`);

const deleteSessionStatement = db.prepare(`
  DELETE FROM session
  WHERE
    id = ?
`);

const createOrUpdateSessionStatement = db.prepare(`
  INSERT OR REPLACE INTO session (
    id,
    createdTimestamp,
    editedTimestamp,
    sessionTimestamp,
    sessionDateString,
    note,
    discordUserId,
    replyId,
    exercise
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Calculate the number of days with yoga sessions
async function daysOfYoga(discordUserId, sessionDateString) {
  const result = daysOfYogaStatement.get(discordUserId, sessionDateString);

  return result.daysOfYoga;
}

function allowedMessage(message) {
  const isNotBot = !message.author?.bot;
  const channel = message.channel?.name?.toLowerCase();
  const startsWithCheckMark = message.content.trim().startsWith("✅");

  const isAllowed =
    isNotBot && ALLOWED_CHANNELS.includes(channel) && startsWithCheckMark;
  if (isAllowed) {
    console.log(">>>>>>> allowedMessage", message.content);
  }

  return isAllowed;
}

async function createOrUpdateSession(message) {
  if (!allowedMessage(message)) return;

  const messageContent = message.content.trim();
  const discordUserId = message.author.id;
  const channel = message.channel?.name?.toLowerCase();

  // This should be "✅" or "✅-3" etc
  const sessionContent = messageContent.split(" ")[0];

  // When removing ✅ from sessionContent should have "-3", "-1", "" etc
  const timeShiftNumber = parseInt(sessionContent.replace("✅", ""));

  // Note
  const note = messageContent.replace(sessionContent, "").trim();

  // Get the dates right
  const creationDate = new Date(message.createdTimestamp);
  const editedTimestamp = message.editedTimestamp
    ? new Date(message.editedTimestamp)
    : null;
  let sessionTimestamp = creationDate;

  if (!isNaN(timeShiftNumber)) {
    sessionTimestamp = addDays(sessionTimestamp, timeShiftNumber);
  }

  const sessionDateString = format(sessionTimestamp, "yyyy-MM-dd");

  // Create reply content
  const readableData = format(sessionTimestamp, "EEEE");
  let replyContent = `☑️ ${readableData} logged${
    note && ": " + truncate(note, 35)
  }`;

  if (channel === "yoga") {
    const days = await daysOfYoga(discordUserId, sessionDateString);
    replyContent += `\n📊 ${days + 1} days of yoga logged`;
  }

  // Get record if exists
  const existingRecord = getSessionStatement.get(message.id);
  let replyId = existingRecord?.replyId;

  if (!replyId) {
    // Reply and save reply message id
    const reply = await message.reply(replyContent);
    replyId = reply.id;
  } else {
    // Update existing reply
    const existingReply = await message.channel.messages.fetch(replyId);
    await existingReply.edit(replyContent);
  }

  // Save to database
  const result = createOrUpdateSessionStatement.run(
    message.id,
    creationDate.toISOString(),
    editedTimestamp?.toISOString(),
    sessionTimestamp.toISOString(),
    sessionDateString,
    note,
    discordUserId,
    replyId,
    channel
  );

  if (existingRecord) {
    console.log(">>>>>>> Updated record", result.lastInsertRowid);
  } else {
    console.log(">>>>>>> Created record", result.lastInsertRowid);
  }

  await message.react("🏴‍☠️");
}

async function deleteSession(message) {
  if (!allowedMessage(message)) return;

  // Get record if exists
  const existingRecord = getSessionStatement.get(message.id);
  const replyId = existingRecord?.replyId;

  if (replyId) {
    // Delete existing reply
    const existingReply = await message.channel.messages.fetch(replyId);
    await existingReply.delete();
  }

  // Save to database
  const result = deleteSessionStatement.run(message.id);

  console.log(">>>>>>> Deleted record", result.lastInsertRowid);
}

async function handlePartial(message, callback) {
  if (message.partial) {
    try {
      const fullMessage = await message.fetch();
      callback(fullMessage);
    } catch (error) {
      console.error("Something went wrong when fetching the message:", error);
      return;
    }
  } else {
    callback(message);
  }
}

export default (discordClient) => {
  discordClient.on(Events.MessageCreate, (message) => {
    console.log(">>>>> YogaLogger", Events.MessageCreate);
    handlePartial(message, createOrUpdateSession);
  });

  discordClient.on(Events.MessageUpdate, (message, updated) => {
    console.log(">>>>> YogaLogger", Events.MessageUpdate);
    handlePartial(message, createOrUpdateSession);
  });

  discordClient.on(Events.MessageDelete, (message) => {
    console.log(">>>>> YogaLogger", Events.MessageDelete);
    handlePartial(message, deleteSession);
  });

  discordClient.on(Events.MessageReactionAdd, async (reaction) => {
    console.log(">>>>> YogaLogger", Events.MessageReactionAdd);

    handlePartial(reaction.message, createOrUpdateSession);
  });

  discordClient.on(Events.MessageReactionRemove, async (reaction) => {
    console.log(">>>>> YogaLogger", Events.MessageReactionRemove);

    handlePartial(reaction.message, createOrUpdateSession);
  });

  discordClient.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}`);
      console.error(error);
    }
  });
};
