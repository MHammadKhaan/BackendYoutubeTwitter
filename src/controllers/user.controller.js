import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
//get user details frm fronend depend on user model
//validation--empty
//check if user already exist
//check file --avatar ,images if available upoad to cloudinary,avatar
//crete user object--create entry in db
//emove pass and refesh token feild from response
//check for user creation
//return res

const registerUser = asyncHandler(async (req, res) => {
  const { fulName, email, username, password } = req.body; //details from fronend form and json
  console.log("email", email);
  if (
    [fulName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const ExistedUser = User.findOne({
    $or: [{ email }, { username }],
  });
  if (ExistedUser) {
    throw new ApiError(409, "User already exist");
  }

  const avatarLocatPath = req.files?.avatar[0]?.path; //on the server not on cloudinary
  const coverImageLocalPAth = req.files?.coverImage[0]?.path;

  if (!avatarLocatPath) {
    throw new ApiError(400, "avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocatPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPAth);
  if (!avatar) {
    throw new ApiError(400, "avatar file is required");
  }

  const user = await User.create({
    fulName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "registering user error");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

export { registerUser };
