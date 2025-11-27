# PlayDex

PlayDex is a website that tries to group all video game patch notes in a normalized manner. Follow your favorite games to get the patch notes as soon as they release.

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
     ```

3. **Launch Your SQL Database**:

   - Start your SQL database server.
   - Ensure the database user and name match the credentials in the `DATABASE_URL` variable.

4. **Install Dependencies**:

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
        openssl genrsa -out config/jwt/private.pem -aes256 4096
        ```
    - Create a public key:
        ```bash
        openssl rsa -pubout -in config/jwt/private.pem -out config/jwt/public.pem
        ```

8. **Launch the scheduler**:

    To get the games automatically, you can launch the SYmfony scheduler that will launch the get-igdb-data command every day at midnight UTC:

    - ```bash
      cd backend/
      php bin/console scheduler:start
      ```



Your backend is now ready to use!
