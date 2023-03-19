import { Events } from "discord.js";
import { addDays, format } from "date-fns";

import { getXataClient } from "./../xata.js";

const ALLOWED_CHANNELS = ["yoga", "exercise"];

function truncate(str, maxLength) {
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + "...";
  }
  return str;
}

// Calculate the number of days with yoga sessions
async function daysOfYoga(xata, discordUserId, sessionDateString) {
  const result = await xata.db.session.aggregate(
    {
      daysOfYoga: {
        uniqueCount: {
          column: "sessionDateString",
        },
      },
    },
    {
      discordUserId: discordUserId,
      exercise: "yoga",
      sessionDateString: {
        $not: [sessionDateString],
      },
    }
  );

  return result.aggs.daysOfYoga;
}

function allowedMessage(message) {
  const isNotBot = !message.author.bot;
  const channel = message.channel?.name?.toLowerCase();
  const startsWithCheckMark = message.content.trim().startsWith("✅");

  const isAllowed =
    isNotBot && ALLOWED_CHANNELS.includes(channel) && startsWithCheckMark;
  if (isAllowed) {
    console.log(">>>>>>> allowedMessage", message.content);
  }

  return isAllowed;
}

async function createOrUpdateSession(message, xata = getXataClient()) {
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
    const days = await daysOfYoga(xata, discordUserId, sessionDateString);
    replyContent += `\n📊 ${days + 1} days of yoga logged`;
  }

  // Get record if exists
  const existingRecord = await xata.db.session.read(message.id);
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

  // Save to Xata
  const record = await xata.db.session.createOrUpdate({
    id: message.id,
    createdTimestamp: creationDate,
    editedTimestamp: editedTimestamp,
    sessionTimestamp: sessionTimestamp,
    sessionDateString: sessionDateString,
    note: note,
    discordUserId: discordUserId,
    replyId: replyId,
    exercise: channel,
  });

  if (existingRecord) {
    console.log(">>>>>>> Updated record", record.id);
  } else {
    console.log(">>>>>>> Created record", record.id);
  }

  await message.react("🏴‍☠️");
}

async function deleteSession(message, xata = getXataClient()) {
  if (!allowedMessage(message)) return;

  // Get record if exists
  const existingRecord = await xata.db.session.read(message.id);
  const replyId = existingRecord?.replyId;

  if (replyId) {
    // Delete existing reply
    const existingReply = await message.channel.messages.fetch(replyId);
    await existingReply.delete();
  }

  // Save to Xata
  const record = await xata.db.session.delete(message.id);

  console.log(">>>>>>> Deleted record", record.id);
}

export default (discordClient) => {
  discordClient.on(Events.MessageCreate, (message) => {
    console.log(">>>>> YogaLogger", Events.MessageCreate);
    createOrUpdateSession(message);
  });

  discordClient.on(Events.MessageUpdate, (_message, updated) => {
    console.log(">>>>> YogaLogger", Events.MessageUpdate);
    createOrUpdateSession(updated);
  });

  discordClient.on(Events.MessageDelete, (message) => {
    console.log(">>>>> YogaLogger", Events.MessageDelete);
    deleteSession(message);
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
