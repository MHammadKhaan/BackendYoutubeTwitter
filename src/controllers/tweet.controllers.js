import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/likes.models.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "content is required");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });
  if (!tweet) {
    throw new ApiError(400, "failed to tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet created successfully"));
});
const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;
  console.log("tweetID",tweetId);
  console.log("content",content);
  
  
  
  
  if (!content) {
    throw new ApiError(400, "content is required");
  }
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "invalid tweet ID");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(400, "tweet not found");
  }
  if (req.user?._id.toString() !== tweet.owner.toString()) {
    throw new ApiError(400, "only tweet owner can edit the tweet");
  }
  const editTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {content}
    },
    {
      new: true,
    }
  );
  if (!editTweet) {
    throw new ApiError(500, "Failed to edit tweet please try again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, editTweet, "tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const {tweetId}=req.params
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "invalid tweet ID");
  }

  const tweet = Tweet.findById(tweetId)
  if(!tweet)
  {
    throw new ApiError(400,"tweet not found")
  }
   const removeTweet=await Tweet.findByIdAndDelete(tweetId)
   if(!removeTweet)
   {
    throw new ApiError(400,"tweet not removed try again")
   }
   await Like.deleteMany(
    {
        tweet:tweetId,
        likeBy:req.user?._id
    }
   )
   return res.status(200).
   json(new ApiResponse(200,removeTweet,"tweet removed succcessfully"))
  

});
const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
});
export { createTweet, getUserTweets, updateTweet,deleteTweet};
