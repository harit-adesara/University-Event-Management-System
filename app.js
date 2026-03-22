import express from "express";
import { router } from "./routes/routes.js";
import cors from "cors";
const app = express();

app.get("/", (req, res) => {
  res.send("UMES project");
});

app.use(
  cors({
    origin: process.env.cors?.split(",") || "https://localhost:3000",
    credentials: true,
    method: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-type", "Authorization"],
  }),
);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use(express.static("public"));

import cookieParser from "cookie-parser";

app.use(cookieParser());

app.use("/api/v1/umes", router);
export { app };
