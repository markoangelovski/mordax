exports.response = (res, statusCode, hasErrors, info, payload) => {
  payload = Array.isArray(payload) ? payload : [payload];

  const response = {
    hasErrors: false,
    errors: [],
    info: { count: payload.length, path: res.req.originalUrl },
    result: []
  };

  res.status(statusCode);

  if (hasErrors)
    return res.json({
      ...response,
      info: { ...info, ...response.info },
      hasErrors: true,
      errors: payload
    });

  return res.json({
    ...response,
    info: { ...info, ...response.info },
    result: payload
  });
};
