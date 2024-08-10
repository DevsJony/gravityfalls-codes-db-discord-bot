import {BotCommand} from "../types.js";
import {EmbedBuilder, SlashCommandBuilder} from "discord.js";
import prisma from "../prisma.js";
import {EMBED_COLOR} from "../consts.js";

export default {
    data: new SlashCommandBuilder()
        .setName("top")
        .setDescription("Shows top 10 code finders"),
    async execute(interaction) {
        await interaction.deferReply();

        let top10finders = await prisma.code.groupBy({
            by: ["foundByDiscordId"],
            _count: true,
            orderBy: {
                _count: {
                    id: "desc"
                }
            },
            take: 10
        });

        let content = "";

        for (let i = 0; i < top10finders.length; i++) {
            let finder = top10finders[i]!;

            content += `${i + 1}. <@${finder.foundByDiscordId}> - **${finder._count} codes**\n`;
        }

        let embed = new EmbedBuilder()
            .setTitle("Top 10 code finders")
            .setColor(EMBED_COLOR)
            .setDescription(content);

        await interaction.editReply({embeds: [embed]});
    }
} satisfies BotCommand;
