import "dotenv/config";
import path from "path";
import {fileURLToPath} from "url";
import {readdirSync} from "fs";
import {Client, GatewayIntentBits} from "discord.js";

export let client: Client;

client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Load handlers
const handlersDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "handlers");

let handlersPromises: Promise<void>[] = [];
for (const handler of readdirSync(handlersDir)) {
    let loadedScript = await import(`./handlers/${handler}`);
    handlersPromises.push(loadedScript.default(client));
}

await Promise.all(handlersPromises);

await client.login(process.env.TOKEN);