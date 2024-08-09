import {ActivitiesOptions, Client, Events, ActivityType} from "discord.js";
import {BotEvent} from "../types.js";

export default {
    name: Events.ClientReady,
    once: true,
    execute: (client: Client<true>) => {
        console.log(`Ready! Logged in as ${client.user?.tag} in ${client.guilds.cache.size} guilds`);

        client.user.setStatus("dnd");
    }
} satisfies BotEvent<Events.ClientReady>;
