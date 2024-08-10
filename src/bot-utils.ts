import {ChatInputCommandInteraction, Client, ClientEvents, SlashCommandBuilder} from "discord.js";

export interface BotEvent<K extends keyof ClientEvents> {
    name: K,
    once?: boolean,
    execute: (client: Client, ...args: ClientEvents[K]) => void
}

export interface BotCommand {
    data: Pick<SlashCommandBuilder, "name" | "toJSON">,
    execute: (interaction: ChatInputCommandInteraction) => void
}

export function defineBotEvent<T extends keyof ClientEvents>(botEvent: BotEvent<T>) {
    return botEvent;
}
