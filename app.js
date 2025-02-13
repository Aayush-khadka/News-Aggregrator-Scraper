import express from "express";
import cors from "cors";

const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//routes import
import kathmanduPost from "./routes/kathmandu.js";

//routes Declaration
app.use("/scrape", kathmanduPost);

export default app;
