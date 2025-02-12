import "dotenv/config";
import { Groq } from "groq-sdk";
import { NewArticle } from "../models/newArticle.model.js";
import { Trending } from "../models/trending.model.js";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY2 });

const getArticleTitles = async () => {
  const prevTrendingArticles = await Trending.find({}, { title: 1 });
  const prevTrendingTitles = prevTrendingArticles.map(
    (article) => article.title
  );

  await Trending.deleteMany({}).then(() => {
    console.log("Deleted The Previous Trending List!!!");
  });

  const articles = await NewArticle.find({}, { title: 1 });
  const titles = articles.map((article) => article.title);

  const prompt = `
  Analyze the following news headlines and return ONLY a list of the top 10 most trending article titles. there is also the list of previous trending articles if there is any updates to that or that news is still very good for trending you can still put the articles title in new trending Do not include any additional text, explanations, or JSON formatting. Just return the titles as a plain list dont even say here is the list just give me the list remove the numbering before the article title but make it so it is in order of the score.

 **Priority Order**:
 - **Highest Priority**: Nepal-related news, politics, and national news.
 - **Medium Priority**: International news and money-related topics.
 - **Lowest Priority**: Life, art, and entertainment-related topics.

 **Additional Requirements**:
 - Ensure the list is a good mix of all categories.
 - prority to accidents or news that are suprising
 - dont have two or more  articles having similar stories try avoiding titles that are similar 

 News Titles:
 ${titles}

 Previous Trending Titles:
 ${prevTrendingTitles}
 `;
  try {
    const response = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });
    const titlesString = response.choices[0].message.content.trim();

    const trendingTitles = titlesString
      .split("\n")
      .map((title) => title.trim());

    console.log(trendingTitles);

    for (let i = 0; i < 10; i++) {
      await Trending.create({
        title: trendingTitles[i],
      });
    }

    await NewArticle.deleteMany({}).then(() => {
      console.log("Deleted all the Titles!!!");
    });

    return trendingTitles;
  } catch (error) {
    console.error("Error fetching data from Groq:", error);
    throw error;
  }
};

export default getArticleTitles;
