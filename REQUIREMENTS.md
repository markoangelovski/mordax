# Mordax requirements

## Endpoints

- API Keys:

  - Admin key can create other keys
  - Team keys can create Editor and Read keys
  - Editor keys can create Read keys
  - Read keys cannot create keys
  - Read keys can be disabled by Admin and ReadWrite keys
  - Admin keys can review all keys, other keys can review their keys and no others

- Locale:

  - Attributes:
    - Fields: list of additional custom fields
  - Get a list of all locales
    - List includes the basic data, additional query param "include" can be added to include additional data, example: "&include:attribute1,attribute2"
  - Create a new Locale
    - Locale can be created by submitting all of the data that is unique to that locale: brand, locale, url, staging links, SC carousel and button keys, BIN Lite key, PS key, capitol for PS offline search, etc
    - Creating a new locale can fetch the xml sitemap and parse all of the pages
    - Page list template (xlsx) can be uploaded and the pages from the template will be parsed and the data added to the pages from the xml sitemap import
    - List of 3rd parties can be added
  - Edit locale
  - Fields can be added to locale that will validate the page list template and import only the whitelisted fields' data
  - Delete locale
  - Download Pages list template

- Page:

  - Attributes:
    - Type: pdp, adp, plp, alp, landing, etc.
  - Normalize url, check if https://
  - Get all pages for one locale, page has a "locale" key as a relationship to locale
    - List includes the basic data, additional query param "include" can be added to include additional data, example: "&include:attribute1,attribute2"
  - Create a new page
  - Edit a page
  - Delete a page

- Analyitcs:

  - Middleware
  - Saves each requests' key, method, endpoint
  - Each request is saved to DB when checking the key
  - Non-successfull requests are saved to a buffer, after a certain time or after a certain number of requests the buffer is flushed to DB
  - "analytics" privilege can read analytics
  - Admin key can create/add analytics priviliege

- Notifications:

  - Each locale delete request creates a new Notifications entry
  - Requestor's key and locale are stored
  - ReadWrite keys can access Notifications endpoint
  - Notifications have active:true/false attribute
  - If ReadWrite key approves of the locale delete request, locale in question is marked for deletion, approver and requestor keys and request date are stored. One month after the request, the locale is deleted.
