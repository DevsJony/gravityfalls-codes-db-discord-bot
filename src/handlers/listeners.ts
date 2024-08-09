import path, {join} from "path";
import {readdirSync} from "fs";
import {Client, ClientEvents} from "discord.js";
import {fileURLToPath} from "url";
import {BotEvent} from "../types.js";

export default function loadListeners(client: Client) {
    console.log("Loading listeners...")

    let listenersDir = join(path.dirname(fileURLToPath(import.meta.url)), "../listeners");

    readdirSync(listenersDir).forEach(async file => {
        let event: BotEvent<keyof ClientEvents> = (await import(`../listeners/${file}`)).default;

        // Register event
        event.once ?
            client.once(event.name, (...args) => event.execute(client, ...args))
            :
            client.on(event.name, (...args) => event.execute(client, ...args))

        console.log(`🌠 Successfully loaded listener ${file}`)
    });
}