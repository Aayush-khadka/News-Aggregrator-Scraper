import dotenv from "dotenv";
import Connect_Db from "./db/index.js";
import getTrending from "./Logic/trending.js";
import { scrapeKathmanduPost } from "./Scraper/kathmanduPost.scraper.js";
import { scrapeRisingNepal } from "./Scraper/risingNepal.scraper.js";
import app from "./app.js";
import cron from "node-cron";

dotenv.config();

Connect_Db()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server Listening at : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("ERROR IN DATABASE: ", err);
  });

// cron.schedule("0 */4 * * *", () => {

// });
