import {Client, EmbedBuilder, Events, InteractionReplyOptions, MessagePayload} from "discord.js";
import {defineBotEvent} from "../bot-utils.js";
import {processCode} from "../commands/code.js";
import {EMBED_COLOR} from "../consts.js";
import {applyBulkCodesCooldown} from "../commands/addbulkcodes.js";

export default defineBotEvent({
    name: Events.InteractionCreate,
    execute: async (client: Client, interaction) => {
        if (!interaction.isModalSubmit()) return;
        if (interaction.customId !== "addBulkCodes") return;

        const codes = interaction.fields.getTextInputValue("codes").split("\n");

        // Apply cooldown
        applyBulkCodesCooldown(interaction.user.id);

        //await interaction.deferReply();

        let added = 0;
        let alreadyExists = 0;
        let invalid = 0;
        await interaction.reply(getProcessingStatus(codes.length, added, alreadyExists, invalid));

        let processing = true;

        // Update status every second
        let updateInterval = setInterval(async () => {
            if (!processing) {
                clearInterval(updateInterval);
                return;
            }

            await interaction.editReply(getProcessingStatus(codes.length, added, alreadyExists, invalid));
        }, 1000);

        let content = "";
        try {
            for (let code of codes) {
                let response = await processCode(code, interaction.user.id);
                if (response.success || response.critical) {
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
            }
        } finally {
            // Stop updating status
            processing = false;
        }

        if (content === "") {
            content = "No codes were added. Probably they already exist in the database or they are invalid.";
        }

        let embed = new EmbedBuilder()
            .setTitle("Bulk Codes Summary")
            .setColor(EMBED_COLOR)
            .setDescription(content);

        await interaction.editReply({embeds: [embed]});
    }
})

function getProcessingStatus(codesCount: number, added: number, alreadyExists: number, invalid: number): InteractionReplyOptions {
    return {
        content: `Processing codes... 0/${codesCount}
Added: ${added} | Already exists: ${alreadyExists} | Invalid: ${invalid}`,
    }
}
