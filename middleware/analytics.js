const parser = require("ua-parser-js");

const Analytics = require("../api/analytics/analytics.model.js");

exports.analytics = (req, res, next) => {
  // Do not store analytics while in local development
  if (req.get("host") === "localhost:3000") return next();

  next();
  let path = req._parsedUrl.pathname.length > 1 ? req._parsedUrl.pathname : "";

  path = path.length ? path : "/";

  const ua = parser(req.headers["user-agent"]);

  Analytics.create({
    key: req.key,
    endpoint: req.baseUrl + path,
    method: req.method,
    date: Date.now(),
    ...ua
  })
    .then(_ => _)
    .catch(err => console.warn("Error saving analytics", err));
};
