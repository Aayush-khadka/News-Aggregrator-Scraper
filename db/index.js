import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const Connect_Db = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
  } catch (error) {
    console.error("ERROR:", error);
    process.exit(1);
  }
};

export default Connect_Db;
