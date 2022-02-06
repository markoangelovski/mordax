# Mordax - E-Commerce Inspector

## Hosting

### Github repo: https://github.com/markoangelovski/mordax

### Vercel project: https://vercel.com/markoangelovski/mordax

- hosts the entire application

### Heroku project: https://dashboard.heroku.com/apps/mordax

- SC does not pass seller data to Vercel app
- requests that need to fech SC data are forwarded to the same endpoint on Heroku

## Pipeline

Both Vercel and Heroku are connected to the Github repo. Pushing to master branch triggers automatic deployments for both Vercel and Heroku.

DOMAINS

- https://mordax.vercel.app
- https://mordax.herokuapp.com
