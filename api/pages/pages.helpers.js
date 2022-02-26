// pageData = Title:Always Discreet Boutique Incontinence Liners Very Light;mpId:558575;scSku:0037000547501;bvId:AlwaysDiscreet_Boutique_Pads_Extra Heavy_Long
exports.parsePageData = pageData => {
  if (pageData) {
    const data = {};
    pageData.split(";").forEach(dataPair => {
      const [field, value] = dataPair.split(":");
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
      source: page.source,
      type: page.type,
      data: page.data,
      BINLite: {
        ...page.BINLite,
        matches: page.BINLite.matches.map(match => ({
          BuyNowUrl: match.BuyNowUrl,
          RetailerName: match.RetailerName
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
      PS: page.PS
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
