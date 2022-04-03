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
