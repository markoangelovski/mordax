exports.notFound = (req, res, next) => {
  res.status(404).json({
    message: "Path not found",
    path: req.originalUrl
  });
};

exports.errorHandler = (error, req, res, next) => {
  res.json({ message: "Internal error", error: error.message });
};
