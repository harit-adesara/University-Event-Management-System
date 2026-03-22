import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import { app } from "./app.js";
import { connectdb } from "./db/index.js";

const port = process.env.port || 4000;

connectdb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch(() => {
    console.log("❌DB is not connected");
    process.exit(1);
  });
