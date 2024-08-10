import {Client, Events} from "discord.js";
import {defineBotEvent} from "../bot-utils.js";

export default defineBotEvent({
    name: Events.ClientReady,
    once: true,
    execute: (client: Client) => {
        console.log(`Ready! Logged in as ${client.user?.tag} in ${client.guilds.cache.size} guilds`);

        client.user!.setStatus("dnd");
    }
});
