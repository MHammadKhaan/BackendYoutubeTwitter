import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  deleteVideo,
  getDetailVideoById,
  publishVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/videos.controller.js";
const router = Router();
router.use(verifyJWT); //apply jwt to all routes in this file
router.route("/create").post(
  upload.fields([
    verifyJWT,
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishVideo
);
router
  .route("/:videoId")
  .get(getDetailVideoById)
  .patch(upload.single("thumbnail"), updateVideo)
  .delete(deleteVideo);
router.route("/toggle/publish/:videoId").patch(togglePublishStatus);
export default router;
