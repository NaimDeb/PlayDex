# PlayDex

PlayDex is a website that tries to group all video game patch notes in a normalized manner. Follow your favorite games to get the patch notes as soon as they release.
(Projet pour examen Concepteur Développeur d'applications)

## Quick Start with Docker (recommended)

The fastest way to run the whole stack (frontend + backend + MySQL database) is with Docker. You only need [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.

1. **Make sure the backend `.env` exists** with your API keys (Steam / Twitch / IGDB). See the "Set Up Environment Variables" step in the Backend Installation section below.

2. **Build and start everything** from the project root:

   ```bash
   docker compose up --build
   ```

   On the first run this will download the images and install dependencies, so it can take a few minutes. On startup the backend automatically:
   - runs the database migrations (creates the tables),
   - loads the fixtures (demo data).

3. **Access the app**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api

4. **Stop everything**:

   ```bash
   docker compose down
   ```

   Add `-v` (`docker compose down -v`) to also delete the database volume and start fresh next time.

> **Note:** the fixtures are reloaded on every startup, which **resets the database**. This is convenient for development but means data entered between two runs is lost.

The sections below describe the manual (non-Docker) installation.

## Frontend Installation

Follow these steps to set up the frontend:

1. **Install Dependencies**:

   - Navigate to the frontend directory:
     ```bash
     cd frontend
     ```
   - Install the required dependencies:
     ```bash
     npm install
     ```
2. **Run the Development Server**:

   - Start the Next.js development server:
     ```bash
     npm run dev
     ```

3. **Build for Production** (optional):

   - To create an optimized production build:
     ```bash
     npm run build
     ```
   - Start the production server:
     ```bash
     npm start
     ```

Your frontend is now ready to use!

## Backend Installation
Follow these steps to set up the backend:

1. **Get Your API Keys**:

   - Obtain your Steam API key [here](https://steamcommunity.com/dev/apikey).
   - Obtain your Twitch API key and IGDB access token by following the instructions [here](https://api-docs.igdb.com/#getting-started).

2. **Set Up Environment Variables**:

   - Create a `.env` file in the root of your project.
   - Add the following variables to the `.env` file:
     ```env
     STEAM_API_KEY=your_steam_api_key
     TWITCH_CLIENT_ID=your_twitch_client_id
     IGDB_ACCESS_TOKEN=your_igdb_access_token
     DATABASE_URL=mysql://db_user:db_password@127.0.0.1:3306/db_name

     # Steam account used by the patch note poller (see "Steam Patch Note Polling" below).
     # This is a real Steam LOGIN (username + password) — NOT the STEAM_API_KEY above.
     STEAM_USERNAME=your_steam_bot_username
     STEAM_PASSWORD=your_steam_bot_password
     ```

3. **Launch Your SQL Database**:

   - Start your SQL database server.
   - Ensure the database user and name match the credentials in the `DATABASE_URL` variable.

4. **Install Dependencies**:

   - Make sure to decomment ```;extension=sodium``` in your php config file
   - Run the following command to install PHP dependencies:
     ```bash
     composer install
     ```

5. **Set Up the Database**:

   - Create the database:
     ```bash
     php bin/console doctrine:database:create
     ```
   - Run migrations:
     ```bash
     php bin/console doctrine:migrations:migrate
     ```

6. **Fill the database**:

   - With your database created, you now need to launch the command to fill the database with IGDB's API data

     ```bash
     php bin/console app:get-igdb-data
     ```

7. **Generate JWT Tokens**:

    - Create a private key:
        ```bash
        openssl genrsa -out backend/config/jwt/private.pem -aes256 4096
        ```
    - Create a public key:
        ```bash
        openssl rsa -pubout -in backend/config/jwt/private.pem -out backend/config/jwt/public.pem
        ```

8. **Launch the scheduler**:

    To get the games automatically, you can launch the SYmfony scheduler that will launch the get-igdb-data command every day at midnight UTC:

    - ```bash
      cd backend/
      php bin/console scheduler:start
      ```



Your backend is now ready to use!

## Steam Patch Note Polling

Besides the IGDB catalog import, PlayDex can automatically collect **patch notes** published on Steam. It works in two layers:

- a small **Node.js poller** (`backend/scripts/steam-poller/`) that logs into Steam, detects recently updated apps and fetches their community "update" events;
- the Symfony command **`app:poll-steam-patchnotes`**, which runs that poller, de-duplicates the results and stores the new patch notes in the database (attributed to an auto-created `SteamBot` user).

### Prerequisites

1. **Node.js** must be installed on the machine running the backend — the PHP command shells out to `node`.

2. **Install the poller's dependencies** (separate from the main project's dependencies):

   ```bash
   cd backend/scripts/steam-poller
   npm install
   ```

3. **Set the Steam account credentials** in `backend/.env` (see step 2 of the Backend Installation):

   ```env
   STEAM_USERNAME=your_steam_bot_username
   STEAM_PASSWORD=your_steam_bot_password
   ```

   > ⚠️ Use a **dedicated Steam account** ("bot" account), not your personal one.
   >
   > These are the Steam **login** credentials, which are different from `STEAM_API_KEY` (that key is used for other Steam Web API calls, not for the poller).

### First login (one-time — Steam Guard)

A new Steam account has **Steam Guard (2FA)** enabled, so the very first login needs the code Steam emails you. Do it **once**, interactively, with the dedicated script:

```bash
cd backend/scripts/steam-poller
node firstLogin.js
```

It reads the credentials from `backend/.env`, prompts for the **Steam Guard code** (check your email), and on success saves a **device token** in `backend/var/steam-user/`. After that, Steam no longer asks for a code on this machine — so the automated command below runs headlessly.

**In production (Docker)** — the backend image already ships Node.js and the poller's dependencies, and `var/steam-user/` is mounted as the `steam_data` volume (see `docker-compose-prod.yml`), so the device token survives redeployments. Do the one-time login **on the server**, inside the running container:

```bash
docker compose exec -it backend node scripts/steam-poller/firstLogin.js
```

Enter the emailed Steam Guard code once; the token is saved in the `steam_data` volume, and every scheduled poll afterwards runs headlessly (no code, no terminal needed).

### Run it (automated)

Once the device token is saved, the Symfony command logs in **without any code**:

```bash
cd backend
php bin/console app:poll-steam-patchnotes
```

The command reports how many patch notes and games were created or skipped. Already-seen updates are skipped (cached for ~20 minutes and de-duplicated against the database), so the command is **idempotent** — running it repeatedly is safe.

### Scheduling

Unlike the IGDB import — which is scheduled to run **daily at midnight UTC** by the Symfony scheduler (see step 8 above) — the Steam poller is **not scheduled automatically**. To run it regularly, either:

- add it to the Symfony scheduler (a `#[AsCronTask]` attribute on the command, or a recurring message in `src/Schedule.php`), or
- call it from a system cron, for example every 15 minutes:

  ```cron
  */15 * * * * cd /path/to/backend && php bin/console app:poll-steam-patchnotes >> var/log/steam-poll.log 2>&1
  ```
