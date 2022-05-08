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
  .option("--discord-token <token>", "Token")
  .option("--exclude <exclude>", "Exclude commands")
  .action(
    async ({
      client_id: clientId,
      guild_id: guildId,
      discordToken: token,
      exclude,
    }) => {
      console.log(`Creating commands for guild ${guildId}`);
      exclude = exclude || "";
      exclude = exclude.split(",").map((x: string) => x.trim());
      const commands = (
        [
          [
            "ping",
            new SlashCommandBuilder()
              .setName("ping")
              .setDescription("Replies with pong!"),
          ],
          [
            "token",
            new SlashCommandBuilder()
              .setName("token")
              .setDescription("Replies with information about the token")
              .addIntegerOption((option) =>
                option
                  .setName("id")
                  .setDescription("Token ID")
                  .setRequired(true)
              ),
          ],
          [
            "mclb",
            new SlashCommandBuilder()
              .setName("mclb")
              .setDescription("Minecraft leaderboard")
              .addStringOption((option) =>
                option
                  .setName("name")
                  .setDescription(
                    "The leaderboard to show, otherwise the current/default"
                  )
              ),
          ],
        ] as [string, SlashCommandBuilder][]
      )
        .filter(([name, _]) => !exclude.includes(name))
        .map(([_, command]) => command.toJSON());

      const rest = new REST({ version: "9" }).setToken(token);

      rest
        .put(Routes.applicationGuildCommands(clientId, guildId), {
          body: commands,
        })
        .then(() =>
          console.log("Successfully registered application commands.")
        )
        .catch(console.error);
    }
  );

program.parse(process.argv);
