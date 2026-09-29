import mongoose from "mongoose";

const connectDatabase = () => {
  const dbUri = process.env.DB_URI || process.env.DB_LOCAL_URI;

  mongoose
    .connect(dbUri)
    .then((con) => {
      console.log(
        `MongoDB Cloud Database connected with HOST: ${con.connection.host}`
      );
    })
    .catch((err) => {
      console.error(`MongoDB Connection Error: ${err.message}`);
    });
};

export default connectDatabase;
