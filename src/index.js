//require("dotenv").config({ path: "./env" });
import dotenv from "dotenv";
dotenv.config({ path: "./env" });
import connection from "./db/connection.db.js";
import { app } from "./app.js";

connection()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`server is running at port :${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB connection failed!!", error);
  });

/*const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`);
    app.on("error", (error) => {
      console.log("err", error);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log(`app is listning on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("Error", error);
    throw err;
  }
})();*/
