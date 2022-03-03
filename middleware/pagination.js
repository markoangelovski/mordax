exports.pagination = (req, res, next) => {
  let { limit, skip } = req.query;

  const parsedLimit = parseInt(limit);
  if (isNaN(parsedLimit)) limit = 50;

  const parsedSkip = parseInt(skip);
  if (isNaN(parsedSkip)) skip = 0;

  limit = limit > 100 ? 100 : parsedLimit;
  limit = limit < 1 ? 1 : parsedLimit;

  skip = skip <= 0 ? 0 : parsedSkip;

  req.limit = limit || 50;
  req.skip = skip || 0;

  next();
};
