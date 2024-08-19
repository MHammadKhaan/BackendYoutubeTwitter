import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";

const router = Router();
router.use(verifyJWT);
router.route("/toggle/:videoId").post(toggleVideoLike);
router.route("/toggle/:commentId").post(toggleCommentLike);
router.route("/toggle/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getLikedVideos);
export default router;
