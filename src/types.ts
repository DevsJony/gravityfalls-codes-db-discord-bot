import {ChatInputCommandInteraction, Client, ClientEvents, SlashCommandBuilder} from "discord.js";

export interface BotEvent<K extends keyof ClientEvents> {
    name: K,
    once?: boolean | false,
    execute: (client: Client<true>, ...args: ClientEvents[K]) => void
}

export interface BotCommand {
    data: Pick<SlashCommandBuilder, "name" | "toJSON">,
    execute: (interaction: ChatInputCommandInteraction) => void
}