import {SlashCommandBuilder} from "discord.js";
import prisma from "../prisma.js";
import {BotCommand} from "../types.js";

export default {
    data: new SlashCommandBuilder()
        .setName("codes")
        .setDescription("List of codes"),
    async execute(interaction) {
        await interaction.reply({content: "Work in progress...", ephemeral: true});
        //await interaction.deferReply();

        //let codesCount = await prisma.code.count();
        //let codes = await prisma.code.findMany();


    }
} satisfies BotCommand;