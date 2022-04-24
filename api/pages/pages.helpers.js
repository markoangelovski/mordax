// pageData = Title:Always Discreet Boutique Incontinence Liners Very Light;mpId:558575;scSku:0037000547501;bvId:AlwaysDiscreet_Boutique_Pads_Extra Heavy_Long
exports.parsePageData = pageData => {
  if (pageData) {
    const data = {};
    pageData.split(";").forEach(dataPair => {
      const [field, value] = dataPair.split(":");
      if (field.length)
        // In case empty field is submitted, filter out empty fields
        data[field] = {
          value,
          createdAt: new Date().toISOString(),
          history: []
        };
    });
    return data;
  }
  return;
};

exports.makePagesForRes = pages => {
  pages = Array.isArray(pages) ? pages : [pages];

  return pages.map(page => {
    page = {
      id: page._id,
      url: page.url,
      localeUrl: page.localeUrl,
      source: page.source,
      type: page.type,
      SKU: page.SKU,
      inXmlSitemap: page.inXmlSitemap,
      active: page.active,
      comment: page.comment,
      data: page.data,
      BINLite: {
        ...page.BINLite,
        matches: page.BINLite.matches.map(match => ({
          buyNowUrl: match.buyNowUrl,
          retailerName: match.retailerName
        }))
      },
      SC: {
        ...page.SC,
        matches: page.SC.matches.map(match => ({
          productName: match.productName,
          retailerName: match.retailerName,
          url: match.url,
          price: match.price,
          logo: match.logo,
          miniLogo: match.miniLogo
        }))
      },
      PS: {
        ...page.PS,
        matches: page.PS.matches.map(match => ({
          pmid: match.pmid,
          sid: match.sid,
          retailerName: match.retailerName,
          price: match.price
        }))
        // offlineMatches: page.PS.offlineMatches.map(match => ({
        //   pmid: match.pmid,
        //   sid: match.sid,
        //   retailerName: match.retailerName,
        //   price: match.price
        // }))
      },
      createdAt: page.createdAt,
      updatedAt: page.updatedAt
    };

    if (!page.BINLite?.lastScan) delete page.BINLite;
    if (!page.SC?.lastScan) delete page.SC;
    if (!page.PS?.lastScan) delete page.PS;

    delete page._id;
    delete page.__v;
    delete page.locale;
    return page;
  });
};

exports.makePagesSort = sort => {
  if (!sort) return "";

  const baseFields = [
    "url",
    "SKU",
    "active",
    "inXmlSitemap",
    "localeUrl",
    "source",
    "type",
    "createdAt",
    "updatedAt"
  ];

  const sellerFields = ["lastScan", "ok"];

  const sortArray = sort.split(",");

  return sortArray
    .map(sortItem => {
      const desc = sortItem[0] === "-";

      const tempSortItem = desc ? sortItem.slice(1) : sortItem;

      // If sort field is a base field, return the original base field
      if (baseFields.indexOf(tempSortItem) > -1) return sortItem;

      // If sort field is from sellers fields, add seller prefix
      if (sellerFields.indexOf(tempSortItem) > -1)
        return [
          `${desc ? "-" : ""}PS.${tempSortItem}`,
          `${desc ? "-" : ""}SC.${tempSortItem}`,
          `${desc ? "-" : ""}BINLite.${tempSortItem}`
        ];

      // If sort field is not from sellers fields or base fields, assume it is from data fields
      return `${desc ? "-" : ""}data.${tempSortItem}.value`;
    })
    .flat(1)
    .join(" ");
};

exports.makePagesFilter = filter => {
  if (!filter) return {};

  // filter = inXmlSitemap:false,type:product
  const baseFields = [
    "id",
    "url",
    "localeUrl",
    "source",
    "type",
    "SKU",
    "inXmlSitemap",
    "active"
  ];

  const sellerFields = [
    "SC-ok",
    "SC-lastScan",
    "PS-ok",
    "PS-lastScan",
    "BINLite-ok",
    "BINLite-lastScan"
  ];

  const filters = filter.split(",").map(filterPair => {
    let [key, value] = filterPair.split(":");
    value = /(true|false)/i.test(value)
      ? value.toLowerCase() === "true"
      : value; // If value is true or false, transform from string to boolean
    return { [key]: value };
  });

  const mappedFilters = filters.map(mappedFilter => {
    const key = Object.keys(mappedFilter)[0];

    if (baseFields.indexOf(key) > -1) return mappedFilter; // If passed filter is one of the base fields, use the filter as is.

    if (sellerFields.indexOf(key) > -1) {
      // If passed filter is one of the seller fields, add the seller prefix.
      const modKey = key.split("-").join(".");
      return { [modKey]: mappedFilter[key] };
    }

    return { [`data.${key}.value`]: mappedFilter[key] }; // For the remaining fields, assume they are from data object (custom fields)
  });

  return mappedFilters.reduce((acc, current) => ({ ...acc, ...current }), {});
};
