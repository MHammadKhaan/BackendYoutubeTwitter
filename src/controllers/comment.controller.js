import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.models.js";
import { Like } from "../models/likes.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/videos.modal.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const video = Comment.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video not found");
  }
  const comment = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
        likeCount: {
          $size: "$likes",
        },
        isLiked: {
          $cond: {
            if: {
              $in: [req.user?._id, "$likes.likeBy"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        likeCount: 1,
        isLiked: 1,
        owner: {
          fullName: 1,
          username: 1,
          "avatar.url": 1,
        },
        video: {
          title: 1,
          description: 1,
          "video.url": 1,
        },
      },
    },
  ]);
  const options = {
    limit: parseInt(limit, 10),
    page: parseInt(page, 10),
  };
  const commentDetail = await Comment.aggregatePaginate(comment, options);

  return res
    .status(200)
    .json(new ApiResponse(200, commentDetail, "Comments fetched !!"));
});

const addComment = asyncHandler(async (req, res) => {
  // : add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid video Id");
  }
  if (!content) {
    throw new ApiError(400, "content is required");
  }

  const user = req.user?._id;
  const comment = await Comment.create({
    content,
    video: videoId,
    owner: user,
  });
  if (!comment) {
    throw new ApiError(500, "failed to add comment ");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment added successfully"));
});
const updateComment = asyncHandler(async (req, res) => {
  // : update a comment
  const { content } = req.body;
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "invalid comment Id");
  }
  if (!content) {
    throw new ApiError(400, "content is required");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "comment not found");
  }
  if (req.user?._id.toString() !== comment.owner?.toString()) {
    throw new ApiError(400, "only comment owner can update the comment");
  }
  const updateComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );
  if (!updateComment) {
    throw new ApiError(500, "Failed to edit comment ");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateComment, "comment updated"));
});
export { getVideoComments, addComment, updateComment };
