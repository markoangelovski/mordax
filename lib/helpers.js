exports.response = (res, statusCode, hasErrors, info, payload) => {
  payload = Array.isArray(payload) ? payload : [payload];

  res.status(statusCode);

  if (hasErrors)
    return res.json({
      hasErrors: true,
      info: { statusCode, ...info, path: res.req.originalUrl },
      errors: payload,
      result: []
    });

  const response = {
    hasErrors: false,
    errors: [],
    info,
    result: payload
  };

  return res.json(response);
};
