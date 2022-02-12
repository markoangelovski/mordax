exports.makeLocaleForDb = req => {
  const makeAttr = attribute => ({
    value: attribute,
    createdAt: new Date().toISOString()
  });

  const fieldsArray = ["url"];

  if (req.query.fields)
    fields = fieldsArray.concat(
      req.query.fields.split(",").map(field => field.trim())
    );

  return {
    createdBy: req.admin ? "admin" : req.query.key,
    brand: makeAttr(req.query.brand),
    locale: makeAttr(req.query.locale),
    url: makeAttr(req.query.url),
    fields: fieldsArray,
    capitol: makeAttr(req.query.capitol),
    scButtonKey: makeAttr(req.query.scButtonKey),
    scCarouselKey: makeAttr(req.query.scCarouselKey),
    scEcEndpointKey: makeAttr(req.query.scEcEndpointKey),
    BINLiteKey: makeAttr(req.query.BINLiteKey),
    PSKey: makeAttr(req.query.PSKey)
  };
};

exports.makeLocaleForRes = locale => ({
  createdBy: locale.createdBy,
  brand: locale.brand.value,
  locale: locale.locale.value,
  url: locale.url.value,
  fields: locale.fields,
  capitol: locale.capitol.value,
  scButtonKey: locale.scButtonKey.value,
  scCarouselKey: locale.scCarouselKey.value,
  scEcEndpointKey: locale.scEcEndpointKey.value,
  BINLiteKey: locale.BINLiteKey.value,
  PSKey: locale.PSKey.value
});

exports.updateLocale = (locale, req) => {
  const updateAttr = (prevAttr, newAttr, key) => {
    if (newAttr && prevAttr.value !== newAttr) {
      prevAttr.history.push({
        previousValue: prevAttr.value,
        updatedValue: newAttr,
        updatedAt: new Date().toISOString(),
        updatedBy: req.admin ? "admin" : key
      });
      prevAttr["value"] = newAttr;
      return prevAttr;
    }

    return prevAttr;
  };

  const { key } = req.query;

  locale.brand = updateAttr(locale.brand, req.query.brand, key);
  locale.locale = updateAttr(locale.locale, req.query.locale, key);
  locale.url = updateAttr(locale.url, req.query.newUrl, key);
  locale.capitol = updateAttr(locale.capitol, req.query.capitol, key);
  locale.scButtonKey = updateAttr(
    locale.scButtonKey,
    req.query.scButtonKey,
    key
  );
  locale.scCarouselKey = updateAttr(
    locale.scCarouselKey,
    req.query.scCarouselKey,
    key
  );
  locale.scEcEndpointKey = updateAttr(
    locale.scEcEndpointKey,
    req.query.scEcEndpointKey,
    key
  );
  locale.BINLiteKey = updateAttr(locale.BINLiteKey, req.query.BINLiteKey, key);
  locale.PSKey = updateAttr(locale.PSKey, req.query.BINLiteKey, key);

  return locale;
};

exports.sortItems = (items, attr) =>
  items.sort((first, second) => {
    var A = first[attr].toUpperCase();
    var B = second[attr].toUpperCase();
    if (A < B) {
      return -1;
    }
    if (A > B) {
      return 1;
    }
    return 0;
  });
