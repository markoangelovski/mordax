exports.response = (res, statusCode, hasErrors, info, payload) => {
  payload = Array.isArray(payload) ? payload : [payload];

  const response = {
    hasErrors: false,
    errors: [],
    info,
    result: []
  };

  res.status(statusCode);

  if (statusCode >= 200 && statusCode < 300)
    response.info = { count: payload.length };

  if (hasErrors)
    return res.json({
      ...response,
      info: { ...info, ...response.info, path: res.req.originalUrl },
      hasErrors: true,
      errors: payload
    });

  return res.json({
    ...response,
    info: { ...info, ...response.info },
    result: payload
  });
};
