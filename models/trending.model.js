import mongoose, { Schema } from "mongoose";

const trendingSchema = new Schema({
  title: {
    type: String,
  },
});

export const Trending = mongoose.model("Trending", trendingSchema);
