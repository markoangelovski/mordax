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

exports.makePagesForRes = pages =>
  pages.map(page => {
    page = { id: page._id, ...page._doc };
    delete page._id;
    delete page.__v;
    delete page.locale;
    return page;
  });
