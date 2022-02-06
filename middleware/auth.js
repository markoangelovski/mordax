const Keys = require("../api/keys/keys.model.js");

exports.readOnly = async (req, res, next) => {
  const { key } = req.query;

  try {
    const existingKey = await Keys.find({ key, active: true }, { _id: 1 });

    if (key && existingKey.length > 0) {
      next();
    } else {
      res.status(401);
      next({ message: "Unauthorized" });
    }
  } catch (error) {
    console.warn("Error occurred while checking the key: ", error);
    next(error);
  }
};

exports.readWrite = async (req, res, next) => {
  const { key } = req.query;

  try {
    if (key && key === process.env.MASTER_KEY) {
      // Admin can create readWrite keys
      // readWrite keys can create read keys
      req.admin = true;

      return next();
    }

    const existingKey = await Keys.find(
      { key, active: true, privilege: "readWrite" },
      { _id: 1 }
    );

    if (key && existingKey.length > 0) {
      next();
    } else {
      res.status(401);
      next({ message: "Unauthorized" });
    }
  } catch (error) {
    console.warn("Error occurred while checking the key: ", error);
    next(error);
  }
};

exports.admin = async (req, res, next) => {
  const { key } = req.query;

  try {
    if (key === process.env.MASTER_KEY) {
      next();
    } else {
      res.status(401);
      next({ message: "Unauthorized" });
    }
  } catch (error) {
    console.warn("Error occurred while checking the key: ", error);
    next(error);
  }
};
