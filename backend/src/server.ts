import { app } from "./app.js";
import { env } from "./config/env.js";

let server: ReturnType<typeof app.listen> | undefined;

if (process.env.NODE_ENV !== "production") {
  server = app.listen(env.PORT, () => {
    console.log(`Al Kayan API listening on ${env.API_URL}`);
  });
}

const shutdown = async () => {
  if (server) {
    server.close(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export default app;
