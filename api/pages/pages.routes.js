// Path: /api/1/locales/template
// Desc: Downloads the Pages List template
router.get("/template", async (req, res, next) => {
  res.download(
    path.join(__dirname, "../../public/Test Herbal Essences en-us.xlsx")
  );
});
