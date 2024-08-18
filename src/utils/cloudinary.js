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
const deleteOnCloudinary = async (public_id, resource_type="image") => {
  try {
      if (!public_id) return null;

      //delete file from cloudinary
      const result = await cloudinary.uploader.destroy(public_id, {
          resource_type: `${resource_type}`
      });
  } catch (error) {
      return error;
      console.log("delete on cloudinary failed", error);
  }
};
export { uploadOnCloudinary,deleteOnCloudinary };
