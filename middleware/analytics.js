const parser = require("ua-parser-js");

const Analytics = require("../api/analytics/analytics.model.js");

exports.analytics = (appStart, buffer) => (req, res, next) => {
  next();
  let date = Date.now();
  const path =
    req._parsedUrl.pathname.length > 1 ? req._parsedUrl.pathname : "";
  const key = req.admin ? "admin" : req.query.key;

  const ua = parser(req.headers["user-agent"]);

  const bucket = buffer.find(item => item.key === key);

  if (bucket) {
    bucket.requests.push({
      endpoint: req.baseUrl + path,
      method: req.method,
      date: Date.now(),
      ...ua
    });
  } else {
    buffer.push({
      key,
      requests: [
        {
          endpoint: req.baseUrl + path,
          method: req.method,
          date: Date.now(),
          ...ua
        }
      ]
    });
  }

  const preparedBuffer = buffer.map(item => ({
    updateOne: {
      filter: { key: item.key },
      update: { $push: { requests: item.requests } },
      upsert: true
    }
  }));

  Analytics.bulkWrite(preparedBuffer)
    .then(_ => (buffer = []))
    .then(err => console.warn("Error saving analytics", err));
};
