import {BotCommand} from "../types.js";
import {SlashCommandBuilder} from "discord.js";
import prisma from "../prisma.js";

export default {
    data: new SlashCommandBuilder()
        .setName("code")
        .setDescription("Enter code to the database")
        .addStringOption(option =>
            option.setName("code")
                .setDescription("The code")
                .setRequired(true)),
    async execute(interaction) {
        let enteredCode = interaction.options.getString("code", true);
        let parsedCode = enteredCode
            .toLowerCase()
            .replace(/[^a-z0-9?]/gi, "");

        await interaction.deferReply();

        let alreadyExistsCode = await prisma.code.findUnique({
            where: {
                code: parsedCode
            }
        }).then(result => result !== null);

        if (alreadyExistsCode) {
            await interaction.editReply({content: `:x: Code \`${parsedCode}\` already exists in the database. Someone else found it before you :stuck_out_tongue:`});
            return;
        }

        let formData = new FormData();
        formData.append("code", parsedCode);

        let response = await fetch("https://codes.thisisnotawebsitedotcom.com/", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            if (response.status === 429) {
                await interaction.editReply({content: "The server has rate-limited us. Try again in few seconds."});
                return;
            }
            await interaction.editReply({content: ":x: Invalid code."});
            return;
        }

        let responseContent = await response.arrayBuffer();

        let contentType = response.headers.get("content-type")!;

        await prisma.code.create({
            data: {
                code: parsedCode,
                enteredCode: enteredCode,
                foundByDiscordId: interaction.user.id,

                contentType: contentType,
                data: Buffer.from(responseContent)
            }
        })

        await interaction.editReply({content: `:white_check_mark: Code \`${parsedCode}\` valid! Added successfully to the database.`});
    }
} satisfies BotCommand;
