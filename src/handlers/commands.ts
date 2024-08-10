import path, {join} from "path";
import {readdirSync} from "fs";
import {Client, Collection, Events, REST, Routes} from "discord.js";
import {fileURLToPath} from "url";
import {BotCommand} from "../bot-utils.js";

export default async function loadCommands(client: Client) {
    console.log("Loading commands...");

    let commandsDir = join(path.dirname(fileURLToPath(import.meta.url)), "../commands");

    let commands = new Collection<string, BotCommand>();
    for (const file of readdirSync(commandsDir)) {
        let command: BotCommand = (await import(`../commands/${file}`)).default;
        commands.set(command.data.name, command);

        console.log(`🌠 Successfully loaded command ${file}`)
    }

    handleSlashCommands(client, commands);

    await registerSlashCommands(commands);
}

function handleSlashCommands(client: Client, commands: Collection<string, BotCommand>) {
    // Handle commands
    client.on(Events.InteractionCreate, async interaction => {
        if (!interaction.isChatInputCommand()) return;

        let command = commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'There was an error while executing this command!',
                    ephemeral: true
                });
            } else {
                await interaction.reply({content: 'There was an error while executing this command!', ephemeral: true});
            }
        }
    });
}

async function registerSlashCommands(commands: Collection<string, BotCommand>) {
    // Register slash commands
    const rest = new REST().setToken(process.env.TOKEN!);
    try {
        console.log(`Started refreshing ${commands.size} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
            {
                body: commands.mapValues(command => command.data.toJSON())
            },
        );

        console.log(`Successfully reloaded ${commands.size} application (/) commands.`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
}
