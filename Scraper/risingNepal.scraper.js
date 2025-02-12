// import puppeteer from "puppeteer";
// import { Article } from "../models/article.model.js";
// import { NewArticle } from "../models/newArticle.model.js";
// import Groq from "groq-sdk";
// import dotenv from "dotenv";

// dotenv.config();
// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// const urlNames = [
//   "life-and-art",
//   "world",
//   "editorial",
//   "health",
//   "business",
//   "sports",
//   "nation",
//   "politics",
//   "society",
//   "science-tech",
// ];

// async function fetchArticleData(page, articleUrl) {
//   await page.goto(articleUrl, { waitUntil: "domcontentloaded" });

//   const articleData = await page.evaluate(() => {
//     const paragraphs = document.querySelectorAll(".blog-details p");
//     const titleElement = document.querySelector(
//       ".col-lg-12.text-center.mb-4 h1"
//     );
//     const imgElement = document.querySelector(".blog-banner img");
//     const publishedTimeElement = document.querySelector(".mr-3.font-size-16");
//     const authorElement = document.querySelector(
//       ".col-12.d-flex.align-items-center.share-inline-block.mb-4 span.mr-3.text-black.fw-medium.ml-2.font-size-16"
//     );
//     const authorLinkElement = document.querySelector(
//       ".col-12.d-flex.align-items-center.share-inline-block.mb-4 a.d-flex.align-items-center"
//     );

//     return {
//       articleText: paragraphs.length
//         ? Array.from(paragraphs)
//             .map((p) => p.textContent.trim())
//             .join("\n")
//         : "No Article Text Found",
//       title: titleElement ? titleElement.textContent.trim() : "Title Not Found",
//       imageUrl: imgElement
//         ? imgElement.src
//         : "https://res.cloudinary.com/dbdyrmfbc/image/upload/v1738399320/qxh5ezn8rcalsj2cwalw.jpg",
//       publishedTime: publishedTimeElement
//         ? publishedTimeElement.textContent.trim()
//         : "No Published Time Found",
//       authorName: authorElement
//         ? authorElement.textContent.trim()
//         : "Unable to Find the author",
//       authorLink: authorLinkElement
//         ? authorLinkElement.href
//         : "Unable to Find the author Link",
//     };
//   });

//   return articleData;
// }

// async function fetchSummary(articleContent) {
//   const chatCompletion = await groq.chat.completions.create({
//     messages: [
//       {
//         role: "user",
//         content:
//           "Can you provide a brief, high-quality summary of this article in 2-3 sentences, highlighting the main points?",
//       },
//       {
//         role: "assistant",
//         content: `<think>\nOkay, so the user is asking for a summary of this article in 2-3 sentences. They want it to be high-quality and highlight the main points. First, I need to read through the article carefully to understand what's going on. ${articleContent} `,
//       },
//     ],
//     model: "deepseek-r1-distill-llama-70b",
//     temperature: 0.6,
//     max_completion_tokens: 4096,
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

// export async function scrapeRisingNepal() {
//   for (const category of urlNames) {
//     console.log(`Started Scraping The Category: ${category}`);
//     const url = `https://risingnepaldaily.com/categories/${category}`;
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.goto(url, { waitUntil: "domcontentloaded" });

//     const links = await page.evaluate(() => {
//       const articleLinks = document.querySelectorAll(
//         ".blog-box-layout11.mb-5.w-100 div.item-img a"
//       );
//       return Array.from(articleLinks).map((link) => link.href);
//     });

//     console.log(`Found ${links.length} articles in the ${category} category`);

//     for (const articleUrl of links) {
//       const articlePage = await browser.newPage();
//       const {
//         articleText,
//         title,
//         imageUrl,
//         publishedTime,
//         authorName,
//         authorLink,
//       } = await fetchArticleData(articlePage, articleUrl);

//       if (await Article.exists({ title })) {
//         console.log("Article is already scraped!");
//         break;
//       }

//       const aiSummary = await fetchSummary(articleText);

//       try {
//         await Article.create({
//           title,
//           subTitle: "NO SUBTITLE",
//           authorName,
//           authorProfileLink: authorLink,
//           articleLink: articleUrl,
//           articleImage: imageUrl,
//           publishedTime,
//           updatedTime: "NOT FOUND",
//           updatedPlace: "NOT FOUND",
//           articleText,
//           summary: aiSummary,
//           tag: category,
//           source: "The Rising Nepal",
//         });

//         console.log("Article inserted into database!");

//         await NewArticle.create({
//           title,
//           source: "The Rising Nepal",
//           tag: category,
//         });
//       } catch (error) {
//         console.error("Failed to insert article:", error);
//       }

//       await articlePage.close();
//     }

//     console.log(`Finished Scraping Category: ${category}`);
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
  "life-and-art",
  "world",
  "editorial",
  "health",
  "business",
  "sports",
  "nation",
  "politics",
  "society",
  "science-tech",
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
    const paragraphs = document.querySelectorAll(".blog-details p");
    const titleElement = document.querySelector(
      ".col-lg-12.text-center.mb-4 h1"
    );
    const imgElement = document.querySelector(".blog-banner img");
    const publishedTimeElement = document.querySelector(".mr-3.font-size-16");
    const authorElement = document.querySelector(
      ".col-12.d-flex.align-items-center.share-inline-block.mb-4 span.mr-3.text-black.fw-medium.ml-2.font-size-16"
    );
    const authorLinkElement = document.querySelector(
      ".col-12.d-flex.align-items-center.share-inline-block.mb-4 a.d-flex.align-items-center"
    );

    return {
      articleText: paragraphs.length
        ? Array.from(paragraphs)
            .map((p) => p.textContent.trim())
            .join("\n")
        : "No Article Text Found",
      title: titleElement ? titleElement.textContent.trim() : "Title Not Found",
      imageUrl: imgElement
        ? imgElement.src
        : "https://res.cloudinary.com/dbdyrmfbc/image/upload/v1738399320/qxh5ezn8rcalsj2cwalw.jpg",
      publishedTime: publishedTimeElement
        ? publishedTimeElement.textContent.trim()
        : "No Published Time Found",
      authorName: authorElement
        ? authorElement.textContent.trim()
        : "Unable to Find the author",
      authorLink: authorLinkElement
        ? authorLinkElement.href
        : "Unable to Find the author Link",
    };
  });

  return articleData;
}

async function fetchSummary(articleContent) {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content:
          "Can you provide a brief, high-quality summary of this article in 2-3 sentences, highlighting the main points?",
      },
      {
        role: "assistant",
        content: `<think>\nOkay, so the user is asking for a summary of this article in 2-3 sentences. They want it to be high-quality and highlight the main points. First, I need to read through the article carefully to understand what's going on. ${articleContent} `,
      },
    ],
    model: "deepseek-r1-distill-llama-70b",
    temperature: 0.6,
    max_completion_tokens: 4096,
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

export async function scrapeRisingNepal() {
  // Set maximum execution time for Vercel
  const maxDuration = 300; // 5 minutes

  for (const category of urlNames) {
    console.log(`Started Scraping The Category: ${category}`);
    const url = `https://risingnepaldaily.com/categories/${category}`;
    const browser = await initializeBrowser();
    const page = await browser.newPage();

    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 30000, // 30 second timeout
      });

      const links = await page.evaluate(() => {
        const articleLinks = document.querySelectorAll(
          ".blog-box-layout11.mb-5.w-100 div.item-img a"
        );
        return Array.from(articleLinks).map((link) => link.href);
      });

      console.log(`Found ${links.length} articles in the ${category} category`);

      for (const articleUrl of links) {
        const articlePage = await browser.newPage();
        try {
          const {
            articleText,
            title,
            imageUrl,
            publishedTime,
            authorName,
            authorLink,
          } = await fetchArticleData(articlePage, articleUrl);

          if (await Article.exists({ title })) {
            console.log("Article is already scraped!");
            await articlePage.close();
            continue;
          }

          const aiSummary = await fetchSummary(articleText);

          await Article.create({
            title,
            subTitle: "NO SUBTITLE",
            authorName,
            authorProfileLink: authorLink,
            articleLink: articleUrl,
            articleImage: imageUrl,
            publishedTime,
            updatedTime: "NOT FOUND",
            updatedPlace: "NOT FOUND",
            articleText,
            summary: aiSummary,
            tag: category,
            source: "The Rising Nepal",
          });

          console.log("Article inserted into database!");

          await NewArticle.create({
            title,
            source: "The Rising Nepal",
            tag: category,
          });
        } catch (error) {
          console.error(`Error processing article ${articleUrl}:`, error);
        } finally {
          await articlePage.close();
        }
      }
    } catch (error) {
      console.error(`Error processing category ${category}:`, error);
    } finally {
      await browser.close();
    }

    console.log(`Finished Scraping Category: ${category}`);
    console.log("===================================================");
  }
}
