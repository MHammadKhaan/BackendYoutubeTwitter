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
  let flag;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const isLiked = await Like.findOne({
    video: videoId,
    likeBy: req.user?._id,
  });
  if (isLiked) {
    await Like.findByIdAndDelete(isLiked?._id);
    flag = false;
  } else {
    await Like.create({
      video: videoId,
      likeBy: req.user?._id,
    });
    flag = true;
  }

  console.log("====================================");
  // console.log(likeDoc);
  console.log("====================================");
  const likeCount = await Like.countDocuments({ video: videoId });

  return res
    .status(200)
    .json(new ApiResponse(200, { isLike: flag, likeCount: likeCount }));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentID");
  }
  let flag;
  const isLike = await Like.findOne({
    comment: commentId,
    likeBy: req.user?._id,
  });
  if (isLike) {
    await Like.findByIdAndDelete(isLike?._id);
    flag = false;
  } else {
    await Like.create({
      comment: commentId,
      likeBy: req.user?._id,
    });
    flag = true;
  }
  const commentLikeCount = await Like.countDocuments({ comment: commentId });
  Comment.$addFields({ commentLikeCount });

  return res.status(200).json(
    new ApiResponse(200, {
      isCommentLike: flag,
      commentLikeCount: commentLikeCount,
    })
  );
});
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //: toggle like on tweet
  console.log("tweetID",tweetId);
  
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }
  let flag;
  const isLike = await Like.findOne({
    tweet: tweetId,
    likeBy: req.user?._id,
  });
  if (isLike) {
    await Like.findByIdAndDelete(isLike?._id);
    flag = false;
  } else {
    await Like.create({
      tweet: tweetId,
      likeBy: req.user?._id,
    });
    flag = true;
  }

  const tweetLikeCount = Like.countDocuments({ tweet: tweetId });
  return res.status(200).json(
    new ApiResponse(200,{tweetLike:flag},"tweet liked")
  );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //: get all liked videos
  const likeVideos = await Like.aggregate([
    {
      $match: { likeBy: new mongoose.Types.ObjectId(req.user?._id) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },

          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
          {
            $unwind: "$owner",
          },
        ],
      },
    },
    {
      $addFields: {
        detail: {
          $first: "$video",
        },
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, likeVideos, "like videos"));
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
