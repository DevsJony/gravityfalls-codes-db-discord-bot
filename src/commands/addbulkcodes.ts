import {BotCommand} from "../bot-utils.js";
import {
    ActionRowBuilder,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    SlashCommandBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("addbulkcodes")
        .setDescription("Add codes in bulk to the database"),
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('addBulkCodes')
            .setTitle('Add codes in bulk');

        const codesInput = new TextInputBuilder()
            .setCustomId("codes")
            .setLabel("Codes (each on new line)")
            .setPlaceholder("bill\nlife\nlove")
            .setStyle(TextInputStyle.Paragraph)

        const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(codesInput);

        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    }
} satisfies BotCommand;
