const mongoose = require("mongoose");

exports.connectDb = async () => {
  if (mongoose.connections?.[0].readyState) return;

  const connectionString =
    process.env.NODE_ENV === "development"
      ? process.env.MONGO_URI_DEV
      : process.env.MONGO_URI;

  try {
    const connection = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    if (connection) {
      console.log(
        "MongoDB connected to: ",
        mongoose.connections[0].host.split(".")[0]
      );
    } else {
      console.warn("Mongoose connection failed!");
    }
  } catch (error) {
    console.warn("Mongoose connection error: ", error);
  }
};
