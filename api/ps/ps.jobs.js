const fs = require("fs");
const path = require("path");

const { getAccountDataSkusMap } = require("./ps.drivers.js");

const parseLocalesMap = async () => {
  // Formats the Data SKUs map to Locales map where map = {US: ["US_Gillette",US_GilletteVenus],CA:[CA_Gillette",CA_GilletteVenus]}
  console.log("Updating the Locales map...");

  const skusMap = await getAccountDataSkusMap("1766");

  const { countries } = skusMap;

  const countryCodes = Object.keys(countries);

  const countriesFilePath = path.join(
    __dirname,
    "data",
    "Account_Data_Countries_Map.json"
  );
  fs.writeFile(countriesFilePath, JSON.stringify(countryCodes), err => {
    if (err) console.log(err);
    else {
      console.log("Countries Map successfully written to: ", countriesFilePath);
    }
  });

  const localesMap = {};

  countryCodes.forEach(country => {
    const locales = Object.keys(countries[country])
      .map(locale => locale.replace(/ /g, "_"))
      .filter(locale => locale !== "null" && locale.length > 2);

    localesMap[country] = locales;

    locales.forEach(locale => {
      const folderPath = path.join(__dirname, "data", "skus", country);
      const filePath = path.join(__dirname, "data", "skus", country, locale);
      const skus = countries[country][locale.replace(/_/g, " ")];

      fs.mkdir(folderPath, { recursive: true }, err => {
        if (err) {
          return console.error(err);
        }
        if (skus)
          fs.writeFile(
            filePath + ".json",
            JSON.stringify(skus).replace(/\\"/g, ""),
            err => {
              if (err) console.log(err);
              else {
                console.log("File written successfully on path: ", filePath);
              }
            }
          );
      });
    });
  });

  const localesMap2 = [];

  const countryCodes2 = Object.keys(localesMap);

  countryCodes2.forEach(country => {
    localesMap[country].forEach(locale =>
      localesMap2.push({
        country,
        locale
      })
    );
  });

  const localesFilePath = path.join(
    __dirname,
    "data",
    "Account_Data_Locales_Map.json"
  );

  fs.writeFileSync(localesFilePath, JSON.stringify(localesMap2));

  console.log("Locales map updated.");
};

parseLocalesMap();
