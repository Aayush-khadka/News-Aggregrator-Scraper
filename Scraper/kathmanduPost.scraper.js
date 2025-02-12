// import puppeteer from "puppeteer";
// import { Article } from "../models/article.model.js";
// import { NewArticle } from "../models/newArticle.model.js";
// import Groq from "groq-sdk";
// import dotenv from "dotenv";

// dotenv.config();
// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// const urlNames = [
//   "art-culture",
//   "opinion",
//   "investigations",
//   "sports",
//   "climate-environment",
//   "money",
//   "world",
//   "health",
//   "science-technology",
//   "valley",
//   "politics",
//   "national",
// ];

// async function fetchArticleData(page, articleUrl) {
//   await page.goto(articleUrl, { waitUntil: "domcontentloaded" });

//   const articleData = await page.evaluate(() => {
//     const paragraphs = document.querySelectorAll(
//       ".subscribe--wrapperx section.story-section p"
//     );
//     const authorElement = document.querySelector(
//       ".page-detail--content.clearfix H5.text-capitalize a"
//     );
//     const titleElement = document.querySelector(".col-sm-8 h1");
//     const tagElement = document.querySelector(".col-sm-8 h4");
//     const subTitleElement = document.querySelector(".title-sub");
//     const publishedTimes = document.querySelectorAll(".updated-time");
//     const imageElement = document.querySelector(".col-sm-8 img.img-responsive");

//     return {
//       articleText: paragraphs.length
//         ? Array.from(paragraphs)
//             .map((p) => p.textContent.trim())
//             .join("\n")
//         : "No Article Text Found",
//       authorName: authorElement
//         ? authorElement.textContent.trim()
//         : "No Author Found",
//       authorLink: authorElement ? authorElement.href : "No Author Link Found",
//       title: titleElement ? titleElement.textContent.trim() : "No Title Found",
//       tag: tagElement ? tagElement.textContent.trim() : "No Tag Found",
//       subTitle: subTitleElement
//         ? subTitleElement.textContent.trim()
//         : "No Subtitle Found",
//       publishedTimes: publishedTimes.length
//         ? Array.from(publishedTimes).map((time) => time.textContent.trim())
//         : ["No Published Time Found"],
//       imageUrl: imageElement
//         ? imageElement.src
//         : "https://res.cloudinary.com/dbdyrmfbc/image/upload/v1738399320/qxh5ezn8rcalsj2cwalw.jpg",
//     };
//   });

//   return articleData;
// }

// async function fetchSummary(articleContent) {
//   const chatCompletion = await groq.chat.completions.create({
//     messages: [
//       {
//         role: "system",
//         content:
//           "You are an AI assistant that summarizes news articles in 2-3 sentences, focusing on the main points.",
//       },
//       {
//         role: "user",
//         content: `Here is the article to summarize:\n\n${articleContent.substring(
//           0,
//           4000
//         )}`, // Truncate to stay within limits
//       },
//     ],
//     model: "deepseek-r1-distill-llama-70b",
//     temperature: 0.6,
//     max_completion_tokens: 512, // Reduce completion tokens to avoid exceeding the limit
//     top_p: 0.95,
//     stream: true,
//     stop: null,
//   });

//   let fullResponse = "";
//   for await (const chunk of chatCompletion) {
//     const content = chunk.choices[0]?.delta?.content || "";
//     fullResponse += content;
//   }
//   return fullResponse.split("</think>")[1]?.trim();
// }

// export async function scrapeKathmanduPost() {
//   for (const category of urlNames) {
//     console.log(`Started Scraping The Category: ${category}`);
//     const url = `https://kathmandupost.com/${category}`;
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.goto(url, { waitUntil: "domcontentloaded" });

//     const links = await page.evaluate(() => {
//       const articleLinks = document.querySelectorAll(
//         ".block--morenews article.article-image div.image.image-sm.image-220.pull-right a"
//       );
//       return Array.from(articleLinks).map((link) => link.href);
//     });

//     console.log(`Found ${links.length} articles in the ${category} category`);

//     for (const articleUrl of links) {
//       const articlePage = await browser.newPage();
//       const {
//         articleText,
//         authorName,
//         authorLink,
//         title,
//         tag,
//         subTitle,
//         publishedTimes,
//         imageUrl,
//       } = await fetchArticleData(articlePage, articleUrl);

//       if (await Article.exists({ title })) {
//         console.log("Article is already scraped!");
//         break;
//       }

//       const aiSummary = await fetchSummary(articleText);
//       const defaultTag = category.toString();

//       try {
//         await Article.create({
//           title,
//           subTitle,
//           authorName,
//           authorProfileLink: authorLink,
//           articleLink: articleUrl,
//           articleImage: imageUrl,
//           publishedTime: publishedTimes[0],
//           updatedTime: publishedTimes[1],
//           updatedPlace: publishedTimes[2],
//           articleText,
//           summary: aiSummary,
//           tag: [tag.toLowerCase(), defaultTag],
//           source: "The Kathmandu Post",
//         });
//         console.log("Article inserted into database!");

//         await NewArticle.create({
//           title,
//           source: "The Kathmandu Post",
//           tag,
//         });
//       } catch (error) {
//         console.error("Failed to insert article:", error);
//       }

//       await articlePage.close();
//     }

//     console.log(`Finished Scraping The Category: ${category}`);
//     console.log("===================================================");

//     await browser.close();
//   }
// }

import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import { Article } from "../models/article.model.js";
import { NewArticle } from "../models/newArticle.model.js";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const urlNames = [
  "art-culture",
  "opinion",
  "investigations",
  "sports",
  "climate-environment",
  "money",
  "world",
  "health",
  "science-technology",
  "valley",
  "politics",
  "national",
];

async function initializeBrowser() {
  let browser;

  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  ) {
    const executablePath = await chromium.executablePath(
      "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar"
    );
    browser = await puppeteerCore.launch({
      executablePath,
      args: chromium.args,
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
    });
  } else {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  return browser;
}

async function fetchArticleData(page, articleUrl) {
  await page.goto(articleUrl, { waitUntil: "domcontentloaded" });

  const articleData = await page.evaluate(() => {
    const paragraphs = document.querySelectorAll(
      ".subscribe--wrapperx section.story-section p"
    );
    const authorElement = document.querySelector(
      ".page-detail--content.clearfix H5.text-capitalize a"
    );
    const titleElement = document.querySelector(".col-sm-8 h1");
    const tagElement = document.querySelector(".col-sm-8 h4");
    const subTitleElement = document.querySelector(".title-sub");
    const publishedTimes = document.querySelectorAll(".updated-time");
    const imageElement = document.querySelector(".col-sm-8 img.img-responsive");

    return {
      articleText: paragraphs.length
        ? Array.from(paragraphs)
            .map((p) => p.textContent.trim())
            .join("\n")
        : "No Article Text Found",
      authorName: authorElement
        ? authorElement.textContent.trim()
        : "No Author Found",
      authorLink: authorElement ? authorElement.href : "No Author Link Found",
      title: titleElement ? titleElement.textContent.trim() : "No Title Found",
      tag: tagElement ? tagElement.textContent.trim() : "No Tag Found",
      subTitle: subTitleElement
        ? subTitleElement.textContent.trim()
        : "No Subtitle Found",
      publishedTimes: publishedTimes.length
        ? Array.from(publishedTimes).map((time) => time.textContent.trim())
        : ["No Published Time Found"],
      imageUrl: imageElement
        ? imageElement.src
        : "https://res.cloudinary.com/dbdyrmfbc/image/upload/v1738399320/qxh5ezn8rcalsj2cwalw.jpg",
    };
  });

  return articleData;
}

async function fetchSummary(articleContent) {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are an AI assistant that summarizes news articles in 2-3 sentences, focusing on the main points.",
      },
      {
        role: "user",
        content: `Here is the article to summarize:\n\n${articleContent.substring(
          0,
          4000
        )}`, // Truncate to stay within limits
      },
    ],
    model: "deepseek-r1-distill-llama-70b",
    temperature: 0.6,
    max_completion_tokens: 512,
    top_p: 0.95,
    stream: true,
    stop: null,
  });

  let fullResponse = "";
  for await (const chunk of chatCompletion) {
    const content = chunk.choices[0]?.delta?.content || "";
    fullResponse += content;
  }
  return fullResponse.split("</think>")[1]?.trim();
}

export async function scrapeKathmanduPost() {
  // Set maximum execution time for Vercel
  const maxDuration = 300; // 5 minutes

  for (const category of urlNames) {
    console.log(`Started Scraping The Category: ${category}`);
    const url = `https://kathmandupost.com/${category}`;

    const browser = await initializeBrowser();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const links = await page.evaluate(() => {
      const articleLinks = document.querySelectorAll(
        ".block--morenews article.article-image div.image.image-sm.image-220.pull-right a"
      );
      return Array.from(articleLinks).map((link) => link.href);
    });

    console.log(`Found ${links.length} articles in the ${category} category`);

    for (const articleUrl of links) {
      const articlePage = await browser.newPage();
      const {
        articleText,
        authorName,
        authorLink,
        title,
        tag,
        subTitle,
        publishedTimes,
        imageUrl,
      } = await fetchArticleData(articlePage, articleUrl);

      if (await Article.exists({ title })) {
        console.log("Article is already scraped!");
        break;
      }

      const aiSummary = await fetchSummary(articleText);
      const defaultTag = category.toString();

      try {
        await Article.create({
          title,
          subTitle,
          authorName,
          authorProfileLink: authorLink,
          articleLink: articleUrl,
          articleImage: imageUrl,
          publishedTime: publishedTimes[0],
          updatedTime: publishedTimes[1],
          updatedPlace: publishedTimes[2],
          articleText,
          summary: aiSummary,
          tag: [tag.toLowerCase(), defaultTag],
          source: "The Kathmandu Post",
        });
        console.log("Article inserted into database!");

        await NewArticle.create({
          title,
          source: "The Kathmandu Post",
          tag,
        });
      } catch (error) {
        console.error("Failed to insert article:", error);
      }

      await articlePage.close();
    }

    console.log(`Finished Scraping The Category: ${category}`);
    console.log("===================================================");

    await browser.close();
  }
}
