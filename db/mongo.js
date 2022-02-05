const mongoose = require("mongoose");

exports.connectDb = async () => {
  if (mongoose.connections?.[0].readyState) return;

  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
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
