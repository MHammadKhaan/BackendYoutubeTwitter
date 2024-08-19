import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { Like } from "../models/likes.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //toggle like on video
  console.log("====================================");
  console.log(videoId);
  console.log("====================================");

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const alreadyLiked = await Like.findOne({
    video: videoId,
    likeBy: req.user?._id,
  });
  if (alreadyLiked) {
    await Like.findByIdAndDelete(alreadyLiked?._id);
    return res.status(200).json(new ApiResponse(200, { isLike: false }));
  }
  const likeDoc = await Like.create({
    video: videoId,
    likeBy: req.user?._id,
  });
  console.log("====================================");
  console.log(likeDoc);
  console.log("====================================");

  return res.status(200).json(new ApiResponse(200, { isLike: true }));
});

export { toggleVideoLike };
