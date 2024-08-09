import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localpath) => {
  try {
    if (!localpath) return null;
    //upload file
    const response = await cloudinary.uploader.upload(localpath, {
      resource_type: "auto",
    });
    //file uploaded succesfuly
    console.log("file uploaded", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localpath); //remove the localy saved temporary file
    return null;
  }
};
export { uploadOnCloudinary };
