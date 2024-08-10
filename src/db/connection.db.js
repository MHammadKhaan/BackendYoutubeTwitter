import mongoose from "mongoose";
import { DB_Name } from "../constants.js";
const connection = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_Name}`
    );
    console.log(`\n MongoDb Connected!! success ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log("Mongoose connection failed !!", error);
    process.exit(1);
  }
};
export default connection;
