exports.notFound = (req, res, next) => {
  res.status(404).json({
    message: "Path not found",
    path: req.originalUrl
  });
};

exports.errorHandler = (error, req, res, next) => {
  console.log("An error occurred:", error.message);

  res.statusCode === 200 && res.status(500);

  res.json({ message: "Internal error", error: error.message });
};
