import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { Command } from "commander";

const program = new Command();

const commandCommand = program
  .command("commands")
  .description("List all commands");

commandCommand
  .command("create")
  .description("Creates slash commands for a guild")
  .option("--client_id <client_id>", "Client ID")
  .option("--guild_id <guild_id>", "Guild ID")
  .option("--token <token>", "Token")
  .action(async ({ client_id: clientId, guild_id: guildId, token }) => {
    console.log(`Creating commands for guild ${guildId}`);
    const commands = [
      new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with pong!"),
      new SlashCommandBuilder()
        .setName("token")
        .setDescription("Replies with information about the token")
        .addIntegerOption((option) =>
          option.setName("id").setDescription("Token ID").setRequired(true)
        ),
    ].map((command) => command.toJSON());

    const rest = new REST({ version: "9" }).setToken(token);

    rest
      .put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      })
      .then(() => console.log("Successfully registered application commands."))
      .catch(console.error);
  });

program.parse(process.argv);
