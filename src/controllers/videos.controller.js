import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";
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

  const thumbnailLocalPath = req.files?.thumbnail[0].path;
  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "vedio file and thumbnail are missing");
  }
  const videoFile = await uploadOnCloudinary(videoLocalPath, {
    folder: "video-folder",
  });
  const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath, {
    folder: "thumbnail-folder",
  });
  console.log("thumbnail urlll!!!", thumbnailFile.url);

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
  const video = await Video.aggregate([
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
  const views = await Video.findByIdAndUpdate(videoId, {
    $inc: {
      views: 1,
    },
  });
  console.log("vedio views", views);

  await User.findByIdAndUpdate(req.user?._id, {
    $addToSet: {
      watchHistory: videoId,
    },
  });
  // loop to each stage and log
  const pipeline = video._pipeline;
  console.log("Pipeline!!!", pipeline);

  pipeline.forEach((stage, index) => {
    console.log(`Stage ${index + 1}:`, stage);
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video details fetched successfully"));
});
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid  id");
  }
  const { title, description } = req.body;
  if (!(title || description)) {
    throw new ApiError(400, "title and discription is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video not found");
  }
  if (video?.owner._id.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You can't delete this video as you are not the owner"
    );
  }
  const deletedVideoID = video.thumbnail.public_id;
  const thumbnailLocalPath = req.file?.path;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail are required");
  }
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, {
    folder: "thumbnail-folder",
  });
  console.log("thumbnail url", thumbnail.url);

  if (!thumbnail) {
    throw new ApiError(400, "thumbnail not found");
  }
  const updateVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: {
          url: thumbnail.url,
          public_id: thumbnail.public_id,
        },
      },
    },
    {
      new: true,
    }
  );
  if (!updateVideo) {
    throw new ApiError(400, "video not updated");
  }
  if (updateVideo) {
    await deleteOnCloudinary(deletedVideoID);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updateVideo, "video updated successfully"));
});
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid id for deleting video");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video not found");
  }
  const deleteVideo = await Video.findByIdAndDelete(videoId);
  if (!deleteVideo) {
    throw new ApiError(400, "video not deleted");
  }
  await deleteOnCloudinary(video.videoFile.public_id, "video");
  await deleteOnCloudinary(video.thumbnail.public_id);

  return res
    .status(200)
    .json(new ApiResponse(200, deleteVideo, "deleted video"));
});
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid  videoId");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video not found");
  }
  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You can't toggle publish status as you are not the owner"
    );
  }
  const togglePublish = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    {
      new: true,
    }
  );
  if (!togglePublish) {
    throw new ApiError(400, "failed to update toggle isPublished");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, togglePublish, "successfully updated status !!")
    );
});

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  //: get all videos based on query, sort, pagination
  const pipeline = [];
  if (query) {
    pipeline.push({
      $search: {
        index: "search-index",
        text: {
          query: query,
          path: ["title", "description"],
        },
      },
    });
  }
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }
  pipeline.push({
    $match: { owner: new mongoose.Types.ObjectId(userId) },
  });
  pipeline.push({
    $match: { isPublished: true },
  });
  //sortBy can be views, createdAt, duration
  //sortType can be ascending(-1) or descending(1)
  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    pipeline.push({
      $sort: {
        createdAt: -1,
      },
    });
  }

  // video owner detail
  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetail",
        pipeline: [
          {
            $project: {
              username: 1,
              "avatar.url": 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$ownerDetail",
    }
  );

  const videoAggregate = await Video.aggregate(pipeline);
  console.log(videoAggregate.length);

  if (videoAggregate.length === 0) {
    throw new ApiError(400, "no doc found ");
  }
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
  // const video = await Video.aggregatePaginate(videoAggregate, options);
  //pagination not done error take alot of time
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videoAggregate,
        "the search video is fetched successfully"
      )
    );
});

export {
  publishVideo,
  getDetailVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getAllVideos,
};
