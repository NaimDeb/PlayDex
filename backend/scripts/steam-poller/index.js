const SteamUser = require("steam-user");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const LAST_CHANGE_FILE = path.resolve(__dirname, "../../var/steam_last_changenumber.json");
const EVENT_TYPE_UPDATE = 12;
const COMMUNITY_EVENTS_URL = "https://store.steampowered.com/events/ajaxgetadjacentpartnerevents/";

const username = process.env.STEAM_USERNAME || "";
const password = process.env.STEAM_PASSWORD || "";

if (!username || !password) {
    process.stderr.write("Error: STEAM_USERNAME and STEAM_PASSWORD environment variables are required\n");
    process.exit(1);
}

const client = new SteamUser();

let lastChangenumber = 0;
if (fs.existsSync(LAST_CHANGE_FILE)) {
    try {
        lastChangenumber = JSON.parse(fs.readFileSync(LAST_CHANGE_FILE, "utf-8")).lastChangenumber || 0;
    } catch (e) {
        lastChangenumber = 0;
    }
}

function saveLastChangeNumber(num) {
    const dir = path.dirname(LAST_CHANGE_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LAST_CHANGE_FILE, JSON.stringify({ lastChangenumber: num }));
}

function getChanges() {
    return new Promise((resolve, reject) => {
        client.getProductChanges(lastChangenumber, (err, currentChangenumber, appChanges) => {
            if (err) return reject(err);
            lastChangenumber = currentChangenumber;
            saveLastChangeNumber(currentChangenumber);
            resolve(appChanges);
        });
    });
}

async function getCommunityUpdates(appIds) {
    const results = [];

    for (const id of appIds) {
        try {
            const res = await fetch(
                `${COMMUNITY_EVENTS_URL}?appid=${id}&count=10&l=english`
            );
            const json = await res.json();
            const updates = json.events
                ?.filter(e => e.event_type === EVENT_TYPE_UPDATE)
                .map(e => ({
                    appid: id,
                    gid: e.gid,
                    title: e.event_name,
                    content: e.event_description,
                    date: e.start_time
                })) || [];

            results.push(...updates);
        } catch (e) {
            process.stderr.write(`Warning: Failed to fetch community events for app ${id}: ${e.message}\n`);
        }
    }

    return results;
}

client.on("loggedOn", async () => {
    process.stderr.write("Logged on to Steam\n");

    try {
        const changes = await getChanges();
        const appIds = changes.map(a => a.appid);

        process.stderr.write(`Found ${appIds.length} changed apps\n`);

        if (appIds.length === 0) {
            process.stdout.write("[]");
            client.logOff();
            return;
        }

        const patchnotes = await getCommunityUpdates(appIds);

        process.stderr.write(`Found ${patchnotes.length} patchnotes\n`);
        process.stdout.write(JSON.stringify(patchnotes));

        client.logOff();
    } catch (err) {
        process.stderr.write(`Error: ${err.message}\n`);
        process.exit(1);
    }
});

client.on("disconnected", () => {
    process.exit(0);
});

client.on("error", (err) => {
    process.stderr.write(`Steam error: ${err.message}\n`);
    process.exit(1);
});

client.logOn({
    accountName: username,
    password: password
});
