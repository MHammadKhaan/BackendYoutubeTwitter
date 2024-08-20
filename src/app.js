import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
//setting origin to allow request
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
//configuration to accept json data
app.use(express.json({ limit: "16kb" }));
//data from url
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
//configuration :store file to public asset
app.use(express.static("public"));
app.use(cookieParser());

// routes
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import likeRouter from "./routes/like.routes.js";
import commentRouter from "./routes/comment.routes.js";
//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/comments", commentRouter);
export { app };
