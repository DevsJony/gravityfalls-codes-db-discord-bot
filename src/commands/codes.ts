import {ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder} from "discord.js";
import prisma from "../prisma.js";
import {BotCommand} from "../types.js";
import {Prisma} from "@prisma/client";

const liteCode = Prisma.validator<Prisma.CodeDefaultArgs>()({
    select: {
        code: true,
        enteredCode: true,
        foundByDiscordId: true,
        createdAt: true,
    }
});

type LiteCode = Prisma.CodeGetPayload<typeof liteCode>;

const MAX_CODES_ON_PAGE = 20;

export default {
    data: new SlashCommandBuilder()
        .setName("codes")
        .setDescription("List of codes")
        .addStringOption(option =>
            option.setName("content_type")
                .setDescription("Filter by content type")
                .setRequired(false)
                .addChoices(
                    {name: "video/mp4", value: "video/mp4"},
                    {name: "text/html", value: "text/html"},
                    {name: "image/jpeg", value: "image/jpeg"},
                    {name: "audio/mpeg", value: "audio/mpeg"},
                    {name: "image/png", value: "image/png"},
                )),
    async execute(interaction) {
        let contentType = interaction.options.getString("content_type", false) ?? undefined;

        await interaction.deferReply();

        let codesCount = await prisma.code.count();
        let codes = await prisma.code.findMany({
            take: MAX_CODES_ON_PAGE,
            where: {
                contentType: contentType
            },
            orderBy: {
                createdAt: "desc"
            },
            select: {
                code: true,
                enteredCode: true,
                foundByDiscordId: true,
                createdAt: true,
            }
        });

        let page = 0;

        let previousButton = new ButtonBuilder()
            .setCustomId("previous")
            .setEmoji("⬅️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true);
        let nextButton = new ButtonBuilder()
            .setCustomId("next")
            .setEmoji("➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(Math.ceil(codesCount / MAX_CODES_ON_PAGE) === 1);

        let row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(previousButton, nextButton);

        let currentPage = getEmbedForCodes(codes, codesCount, {
            currentPage: page + 1,
            maxPage: Math.ceil(codesCount / MAX_CODES_ON_PAGE),
        });

        const msg = await interaction.editReply({
            embeds: [currentPage],
            components: [row],
        });

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 1000 * 60 * 5,
        });

        collector.on("collect", async i => {
            if (i.customId === "next") {
                page++;
            } else if (i.customId === "previous") {
                page--;
            }

            previousButton.setDisabled(page === 0);
            nextButton.setDisabled(page === Math.ceil(codesCount / MAX_CODES_ON_PAGE) - 1);

            let nextCodes = await prisma.code.findMany({
                take: MAX_CODES_ON_PAGE,
                skip: page * MAX_CODES_ON_PAGE,
                where: {
                    contentType: contentType
                },
                orderBy: {
                    createdAt: "desc"
                },
                select: {
                    code: true,
                    enteredCode: true,
                    foundByDiscordId: true,
                    createdAt: true,
                }
            });

            currentPage = getEmbedForCodes(nextCodes, codesCount, {
                currentPage: page + 1,
                maxPage: Math.ceil(codesCount / MAX_CODES_ON_PAGE),
            });

            i.update({
                embeds: [currentPage],
                components: [row],
            });

            collector.resetTimer();
        });

        collector.on("end", () => {
            msg.edit({
                components: [],
            });
        });
    }
} satisfies BotCommand;

function getEmbedForCodes(codes: LiteCode[], allCodesCount: number, pageInfo: {
    currentPage: number,
    maxPage: number,
}): EmbedBuilder {

    let content = "";
    for (let code of codes) {
        content += `\`${code.code}\` - <t:${Math.floor(code.createdAt.getTime() / 1000)}:R> - <@${code.foundByDiscordId}>\n`;
    }

    return new EmbedBuilder()
        .setTitle(`Codes List (${allCodesCount} count)`)
        .setDescription(content)
        .setFooter({
            text: `Page ${pageInfo.currentPage}/${pageInfo.maxPage}`
        });
}
