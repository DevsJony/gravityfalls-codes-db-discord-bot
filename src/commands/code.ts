import {BotCommand} from "../bot-utils.js";
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

        await interaction.deferReply();

        let response = await processCode(enteredCode, interaction.user.id);

        await interaction.editReply({content: response.message, allowedMentions: { parse: [] }});
    }
} satisfies BotCommand;

export interface CodeResponse {
    success: boolean;
    message: string;
}

export async function processCode(enteredCode: string, foundByDiscordId: string): Promise<CodeResponse> {
    let parsedCode = enteredCode
        .toLowerCase()
        .replace(/[^a-z0-9?]/gi, "");

    let alreadyExistsCode = await prisma.code.findUnique({
        where: {
            code: parsedCode
        }
    })

    if (alreadyExistsCode !== null) {
        return {
            message: `:x: Code \`${parsedCode}\` already exists in the database. The <@${alreadyExistsCode.foundByDiscordId}> found it before you :stuck_out_tongue:`,
            success: false
        };
    }

    let formData = new FormData();
    formData.append("code", parsedCode);

    let response = await fetch("https://codes.thisisnotawebsitedotcom.com/", {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        if (response.status === 429) {
            console.log("RATE LIMITED");
            return {
                message: "The server has rate-limited us. Try again in few seconds.",
                success: false
            };
        }
        return {
            message: ":x: Invalid code.",
            success: false
        };
    }

    let responseContent = await response.arrayBuffer();

    let contentType = response.headers.get("content-type")!;

    await prisma.code.create({
        data: {
            code: parsedCode,
            enteredCode: enteredCode,
            foundByDiscordId: foundByDiscordId,

            contentType: contentType,
            data: Buffer.from(responseContent)
        }
    })

    return {
        message: `:white_check_mark: Code \`${parsedCode}\` valid! Added successfully to the database.`,
        success: true
    }
}
