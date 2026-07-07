// ─────────────────────────────────────────────────────────────────────────────
// Premier login Steam — À LANCER UNE SEULE FOIS, À LA MAIN, dans un terminal.
//
//   cd backend/scripts/steam-poller
//   node firstLogin.js
//
// Il lit STEAM_USERNAME / STEAM_PASSWORD depuis backend/.env, demande le code
// Steam Guard (reçu par mail au 1er login sur un nouvel appareil), puis enregistre
// le token de l'appareil dans backend/var/steam-user/.
//
// Ensuite, `php bin/console app:poll-steam-patchnotes` (qui lance index.js) se
// connecte automatiquement, SANS code, tant que ce token est présent.
// ─────────────────────────────────────────────────────────────────────────────

const SteamUser = require("steam-user");
const fs = require("fs");
const path = require("path");

// Charge STEAM_* depuis backend/.env si absents de l'environnement.
(function loadEnvFallback() {
    const envPath = path.resolve(__dirname, "../../.env");
    const needed = ["STEAM_USERNAME", "STEAM_PASSWORD", "STEAM_GUARD_CODE"];
    if (!fs.existsSync(envPath) || needed.every((k) => process.env[k])) return;
    for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
        const m = line.match(/^\s*(STEAM_USERNAME|STEAM_PASSWORD|STEAM_GUARD_CODE)\s*=\s*(.*?)\s*$/);
        if (m && !process.env[m[1]]) {
            let v = m[2];
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
            process.env[m[1]] = v;
        }
    }
})();

const username = process.env.STEAM_USERNAME || "";
const password = process.env.STEAM_PASSWORD || "";

if (!username || !password) {
    console.error("Erreur : STEAM_USERNAME et STEAM_PASSWORD sont requis (dans backend/.env ou l'environnement).");
    process.exit(1);
}

const client = new SteamUser({
    // Même dossier que index.js -> le token enregistré ici sera réutilisé par le poller.
    dataDirectory: path.resolve(__dirname, "../../var/steam-user"),
});

client.on("steamGuard", (domain, callback) => {
    const where = domain ? `email (${domain})` : "authenticator mobile";
    const envCode = (process.env.STEAM_GUARD_CODE || "").trim();
    if (envCode) {
        console.log(`Steam Guard : code depuis STEAM_GUARD_CODE (${where})`);
        callback(envCode);
        return;
    }
    const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    readline.question(`Entre le code Steam Guard (${where}) : `, (code) => {
        readline.close();
        callback(code.trim());
    });
});

client.on("loggedOn", () => {
    console.log("✅ Connecté à Steam — token de l'appareil enregistré dans backend/var/steam-user/.");
    console.log("Tu peux maintenant lancer :  php bin/console app:poll-steam-patchnotes");
    client.logOff();
});

client.on("error", (err) => {
    console.error(`❌ Erreur Steam : ${err.message}`);
    process.exit(1);
});

client.on("disconnected", () => process.exit(0));

console.log(`Connexion à Steam en tant que "${username}"...`);
client.logOn({ accountName: username, password: password });
