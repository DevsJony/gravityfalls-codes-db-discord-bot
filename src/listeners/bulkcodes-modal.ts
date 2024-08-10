import {Client, EmbedBuilder, Events} from "discord.js";
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

        await interaction.deferReply();

        let content = "";
        for (let code of codes) {
            let response = await processCode(code, interaction.user.id);
            if (response.success) {
                content += response.message + "\n";
            }
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
