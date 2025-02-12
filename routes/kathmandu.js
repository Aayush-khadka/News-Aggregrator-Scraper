import { scrapeKathmanduPost } from "../Scraper/kathmanduPost.scraper.js";
import { Router } from "express";

const router = Router();

router.route("/").get(scrapeKathmanduPost);

export default router;
