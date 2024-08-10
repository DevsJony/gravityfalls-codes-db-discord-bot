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
    critical?: boolean;
    status: "added" | "alreadyExists" | "invalid" | "rateLimited";
    message: string;
}

export function parseCode(code: string): string {
    return code
        .toLowerCase()
        .replace(/[^a-z0-9?]/gi, "");
}

export async function processCode(enteredCode: string, foundByDiscordId: string): Promise<CodeResponse> {
    let parsedCode = parseCode(enteredCode);
    if (parsedCode.length < 2) {
        return {
            message: ":x: The code is invalid on the `thisisnotawebsitedotcom.com`. Please check it first on the website before entering it here.",
            status: "invalid",
            success: false
        };
    }

    let alreadyExistsCode = await prisma.code.findUnique({
        where: {
            code: parsedCode
        }
    })

    if (alreadyExistsCode !== null) {
        return {
            message: `:x: Code \`${parsedCode}\` already exists in the database. The <@${alreadyExistsCode.foundByDiscordId}> found it before you <t:${Math.floor(alreadyExistsCode.createdAt.getTime() / 1000)}:R> :stuck_out_tongue:`,
            status: "alreadyExists",
            success: false
        };
    }

    let response = await fetchCode(parsedCode);

    if (!response.ok) {
        if (response.status === 429) {
            console.log("RATE LIMITED");
            return {
                message: "The server has rate-limited us. Try again in few seconds.",
                critical: true,
                status: "rateLimited",
                success: false
            };
        }
        return {
            message: ":x: The code is invalid on the `thisisnotawebsitedotcom.com`. Please check it first on the website before entering it here.",
            status: "invalid",
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
    });

    console.log(`Code ${parsedCode} added to the database`);

    return {
        message: `:white_check_mark: Code \`${parsedCode}\` valid! Added successfully to the database.`,
        status: "added",
        success: true
    }
}

const RETRY_COUNT = 3;

/**
 * Fetches the code with retries.
 */
async function fetchCode(code: string): Promise<Response> {
    let response;
    for (let i = 0; i < RETRY_COUNT; i++) {
        let formData = new FormData();
        formData.append("code", code);

        response = await fetch("https://codes.thisisnotawebsitedotcom.com/", {
            method: "POST",
            body: formData
        });

        if (response.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
            continue;
        }

        return response;
    }

    return response!;
}
