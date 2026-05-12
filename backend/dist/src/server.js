import { app } from "./app.js";
import { env } from "./config/env.js";
const server = app.listen(env.PORT, () => {
    console.log(`Al Kayan API listening on ${env.API_URL}`);
});
const shutdown = async () => {
    server.close(() => {
        process.exit(0);
    });
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
