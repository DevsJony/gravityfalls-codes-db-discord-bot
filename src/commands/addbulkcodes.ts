import {BotCommand} from "../bot-utils.js";
import {
    ActionRowBuilder,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    SlashCommandBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";

const COOLDOWN_TIME = 1000 * 60; // 1 minute

let cooldowns = new Map<string, Date>(); // Map<userId, Date>

export default {
    data: new SlashCommandBuilder()
        .setName("addbulkcodes")
        .setDescription("Add codes in bulk to the database"),
    async execute(interaction) {
        let userCooldown = cooldowns.get(interaction.user.id);
        if (userCooldown) {
            if (userCooldown > new Date()) {
                await interaction.reply({
                    content: `You are on cooldown. Try again in ${Math.ceil((userCooldown.getTime() - Date.now()) / 1000)} seconds.`,
                    ephemeral: true
                });
                return;
            } else {
                cooldowns.delete(interaction.user.id);
            }
        }

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

export function applyBulkCodesCooldown(userId: string, cooldownTime: number = COOLDOWN_TIME) {
    if (userId === "436899461588058114") return; // Skip cooldown for EpicPlayerA10
    cooldowns.set(userId, new Date(Date.now()));
}
