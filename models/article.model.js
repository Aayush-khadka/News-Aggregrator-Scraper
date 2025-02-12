import mongoose, { Schema } from "mongoose";

const articleSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  subTitle: {
    type: String,
    trim: true,
  },
  authorName: {
    type: String,
    required: true,
    trim: true,
  },
  authorProfileLink: {
    type: String,
    trim: true,
  },
  articleLink: {
    type: String,
    required: true,
    trim: true,
  },
  articleImage: {
    type: String,
    trim: true,
  },
  publishedTime: {
    type: String,
  },
  updatedTime: {
    type: String,
    trim: true,
  },
  updatedPlace: {
    type: String,
    trim: true,
  },
  articleText: {
    type: String,
    required: true,
  },
  tag: {
    type: Array,
    required: true,
    trim: true,
  },
  source: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  scraptedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Article = mongoose.model("Article", articleSchema);
