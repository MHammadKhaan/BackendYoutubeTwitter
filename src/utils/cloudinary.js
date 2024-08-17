import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localPath) => {
  try {
    if (!localPath) return null;
    //upload file
    const response = await cloudinary.uploader.upload(localPath, {
      resource_type: "auto",
    });
    //file uploaded succesfuly
    console.log("file uploaded", response.url);
    fs.unlinkSync(localPath);
    return response;
  } catch (error) {
    fs.unlinkSync(localPath); //remove the localy saved temporary file
    return null;
  }
};
export { uploadOnCloudinary };
