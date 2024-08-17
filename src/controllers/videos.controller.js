import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/videos.modal.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if ([title, description].some((field) => field?.trim() == "")) {
    throw new ApiError(400, "all fields are required");
  }
  // console.log(title, description);

  //get vedios
  const videoLocalPath = req.files?.videoFile[0].path;
  // console.log(videoLocalPath);

  const thumbnailLocalPath = req.files?.thumbnail[0].path;
  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "vedio file and thumbnail are missing");
  }
  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);
  if (!(videoFile || thumbnailFile)) {
    throw new ApiError(400, "video file or thumbnail not found");
  }
  const video = await Video.create({
    title,
    description,
    duration: videoFile.duration,
    videoFile: {
      url: videoFile.url,
      public_id: videoFile.public_id,
    },
    thumbnail: {
      url: thumbnailFile.url,
      public_id: thumbnailFile.public_id,
    },
    owner: req.user?._id,
    isPublished: false,
  });
  const videoUploaded = await Video.findById(video._id);
  if (!videoUploaded) {
    throw new ApiError(500, "video not uploaded try again");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video, "video uploaded successfully"));
});
const getDetailVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  console.log(videoId);

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "video is not valid");
  }
  const video = Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      }, //
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscriberCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              avatar: "avatar.url",
              subscriberCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likeBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        "videoFile.url": 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        comments: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);
  console.log("video!!!", video);

  if (!video) {
    throw new ApiError(500, "failed to fetch video detail");
  }
  const views=await Video.findByIdAndUpdate(videoId, {
    $inc: {
      views: 1,
    },
  });
  console.log("vedio views",views);
  
  await User.findByIdAndUpdate(req.user?._id, {
    $addToSet: {
      watchHistory: videoId,
    },
  });
  // loop to each stage and log
  const pipeline = video._pipeline;
  pipeline.forEach((stage, index) => {
    console.log(`Stage ${index + 1}:`, stage);
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video details fetched successfully"));
});
export { publishVideo, getDetailVideoById };
