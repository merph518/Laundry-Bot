import dotenv from "dotenv";

// Imported first by the entrypoint so .env values are in process.env before anything reads them.
dotenv.config({ quiet: true });
