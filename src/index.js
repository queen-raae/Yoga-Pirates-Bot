// Require the necessary discord.js classes
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  Partials,
} from "discord.js";

import { DISCORD_CLIENT_ID, DISCORD_CLIENT_TOKEN } from "./config.js";

import yogaLogger from "./services/yoga-logger.js";
import yogalog from "./commands/yogalog.js";
import settings from "./commands/settings.js";
import backup from "./commands/backup.js";

// Create a new discord client instance
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Reaction, Partials.User],
});

const commands = [yogalog, settings, backup];

discordClient.commands = new Collection();
commands.forEach((command) =>
  discordClient.commands.set(command.data.name, command)
);

// It is too much for Discord to deploy every time the code is changed
if (process.env.DEPLOY_COMMANDS === "true") {
  // Construct and prepare an instance of the REST module
  const rest = new REST({ version: "10" }).setToken(DISCORD_CLIENT_TOKEN);

  try {
    console.log(`Started refreshing application (/) commands.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), {
      body: commands.map((command) => command.data.toJSON()),
    });

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
}

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
discordClient.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

yogaLogger(discordClient);

// Log in to Discord with your client's token
discordClient.login(DISCORD_CLIENT_TOKEN);
