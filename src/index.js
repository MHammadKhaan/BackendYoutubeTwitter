//require("dotenv").config({ path: "./env" });
import dotenv from "dotenv";
dotenv.config({ path: "./env" });
import connection from "./db/connection.db.js";
// dotenv.config({
//   path: "./env",
// });
connection();

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
