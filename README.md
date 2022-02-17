# Mordax - E-Commerce Inspector

## Hosting

### Github repo: https://github.com/markoangelovski/mordax

### Heroku project: https://dashboard.heroku.com/apps/mordax

## Pipeline

Main app is hosted on Heroku and the project is connected to Github repo. Pushing to master branch triggers automatic deployment for Heroku.

---

# Mordax Proxy

## Hosting

### Github repo: https://github.com/markoangelovski/mordax-proxy

### Vercel project: https://vercel.com/markoangelovski/mordax

## Pipeline

Mordax Proxy is implemented because of Vercel's limitation on number of endpoints. Mordax Proxy is proxying all requests to Heroku app. Mordax Proxy is connected to the Github repo. Pushing to master branch triggers automatic deployment.

DOMAINS

- Vercel Proxy:

  - https://mordax.vercel.app

- Heroku main app:
  - https://mordax.herokuapp.com
