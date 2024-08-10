import {SlashCommandBuilder} from "discord.js";
import {BotCommand} from "../bot-utils.js";

export default {
    data: new SlashCommandBuilder()
        .setName("code")
        .setDescription("Command changed to /addcode"),
    async execute(interaction) {
        await interaction.reply({
            content: "This command has been changed to `/addcode`. Please use `/addcode` instead.",
            ephemeral: true,
        })
    }
} satisfies BotCommand;
