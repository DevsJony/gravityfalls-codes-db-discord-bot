import {Client, EmbedBuilder, Events, InteractionReplyOptions, MessagePayload} from "discord.js";
import {defineBotEvent} from "../bot-utils.js";
import {parseCode, processCode} from "../commands/addcode.js";
import {EMBED_COLOR} from "../consts.js";
import {applyBulkCodesCooldown} from "../commands/addcodesbulk.js";

const ALLOWED_INVALID_CODES = 40;

export default defineBotEvent({
    name: Events.InteractionCreate,
    execute: async (client: Client, interaction) => {
        if (!interaction.isModalSubmit()) return;
        if (interaction.customId !== "addBulkCodes") return;

        const codes: string[] = sanitizeCodes(interaction.fields.getTextInputValue("codes").split("\n"));

        // Apply cooldown
        applyBulkCodesCooldown(interaction.user.id);

        //await interaction.deferReply();

        let processedCount = 0;
        let added = 0;
        let alreadyExists = 0;
        let invalid = 0;
        await interaction.reply(getProcessingStatus(codes.length, processedCount, added, alreadyExists, invalid));

        let processing = true;

        // Update status every second
        let updateInterval = setInterval(async () => {
            if (!processing) {
                clearInterval(updateInterval);
                return;
            }

            await interaction.editReply(getProcessingStatus(codes.length, processedCount, added, alreadyExists, invalid));
        }, 1000);

        let content = "";
        let rateLimited = false;

        try {
            for (let code of codes) {
                let response = await processCode(code, interaction.user.id);
                if (response.status === "rateLimited") {
                    rateLimited = true;
                    continue;
                }
                if (response.success) {
                    content += response.message + "\n";
                }
                if (response.status === "added") {
                    added++;
                }
                if (response.status === "alreadyExists") {
                    alreadyExists++;
                }
                if (response.status === "invalid") {
                    invalid++;
                }
                if (invalid >= ALLOWED_INVALID_CODES && interaction.user.id !== "436899461588058114") {
                    // Punishment for too many invalid codes
                    content += "Too many invalid codes. You are on cooldown for 15 minutes";
                    applyBulkCodesCooldown(interaction.user.id, 1000 * 60 * 15);
                    break;
                }

                processedCount++;
            }
        } finally {
            // Stop updating status
            processing = false;
        }

        if (rateLimited) {
            content += "The server has rate-limited us. Try again in few seconds.";
        }

        if (content === "") {
            content = "No codes were added. Probably they already exist in the database or they are invalid.";
        }

        let embed = new EmbedBuilder()
            .setTitle("Bulk Codes Summary")
            .setColor(EMBED_COLOR)
            .setDescription(content)
            .addFields({
                name: "Added",
                value: added.toString(),
                inline: true
            }, {
                name: "Already exists",
                value: alreadyExists.toString(),
                inline: true
            }, {
                name: "Invalid",
                value: invalid.toString(),
                inline: true
            });

        await interaction.editReply({content: "", embeds: [embed]});
    }
});

function sanitizeCodes(codes: string[]): string[] {
    let codesMap = new Map<string, string>(); // parsed code -> original code

    for (let code of codes) {
        let parsed = parseCode(code);
        if (parsed.length < 2) {
            continue;
        }
        if (codesMap.has(parsed)) {
            // Already exists
            continue;
        }
        codesMap.set(parsed, code);
    }

    return Array.from(codesMap.values());
}

function getProcessingStatus(codesCount: number, processedCount: number, added: number, alreadyExists: number, invalid: number): InteractionReplyOptions {
    return {
        content: `Processing codes... ${processedCount}/${codesCount}
Added: ${added} | Already exists: ${alreadyExists} | Invalid: ${invalid}`,
    }
}
