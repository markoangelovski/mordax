# Mordax - E-Commerce Inspector

## Hosting

### Github repo: https://github.com/markoangelovski/mordax

### Azure DevOps repo: https://dev.azure.com/angelovskimarko/Mordax-API

### Heroku project **Deprecated**: https://dashboard.heroku.com/apps/mordax

## Pipeline

Main app is hosted on Azure and the project is connected to Azure DevOps repo. Pushing to master branch triggers automatic deployment to Azure.

---

# Mordax Proxy

## Hosting

### Github repo: https://github.com/markoangelovski/mordax-proxy

### Vercel project: https://vercel.com/markoangelovski/mordax-backend-proxy

## Pipeline

Mordax Proxy is implemented because of Vercel's limitation on number of endpoints. Mordax Proxy is proxying all requests to Azure app. Mordax Proxy is connected to the Github repo. Pushing to master branch triggers automatic deployment.

DOMAINS

- Vercel Proxy:

  - https://mordax.vercel.app

- Azure main app:

  - https://mordax-api.azurewebsites.net

- Heroku main app **Deprecated**:
  - https://mordax.herokuapp.com

## Local development

npm run dev runs docker-compose up and starts a mongo container on local machine.
