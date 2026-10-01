# Backend CI/CD

`.github/workflows/backend-ci.yml` runs only when backend code or this workflow's
deployment script changes, on pull requests to `main` or `develop`, pushes to
those branches, and manual dispatch. It does not run the frontend build.

| Job | Environment | Gate |
| --- | --- | --- |
| Development | Django dev settings, SQLite, all backend tests | Every workflow run |
| Production | Django prod settings, PostgreSQL 16, migrations, `check --deploy`, static files, all backend tests | Every workflow run |
| Deploy development | DigitalOcean backend app sourced from `develop` | Off until repository variable `ENABLE_BACKEND_DEV_DEPLOY=true` |
| Deploy production | DigitalOcean backend app sourced from `main` | Off until repository variable `ENABLE_BACKEND_PROD_DEPLOY=true` |

The production test job uses disposable CI values and a local PostgreSQL
service. It never contacts a production database or uses production secrets.
The PostgreSQL job runs the concurrent booking test that SQLite skips.

## Enable deployment after the backend apps exist

1. Create separate backend-only DigitalOcean App Platform apps for development
   and production. Configure the service's GitHub source as this repository,
   branch `develop` or `main` respectively, and source directory `/backend`.
   Configure each app's database, runtime environment, migrations, and health
   checks according to [`DEPLOY.md`](../DEPLOY.md). Disable App Platform's
   automatic deployment on push to avoid a second, untested deployment path.
2. Create GitHub environments named `development` and `production`. Set
   `DO_APP_ID` and `DO_BACKEND_SERVICE_NAME` as environment variables, and
   `DO_API_TOKEN` as an environment secret in each. The token needs App
   Platform read and update scopes. Protect the production environment with
   required reviewers and a `main` branch restriction.
3. Set repository variable `ENABLE_BACKEND_DEV_DEPLOY=true` when the
   development app is ready. Set `ENABLE_BACKEND_PROD_DEPLOY=true` only after
   validating the production app and its environment protection rules.

Deploy jobs run only after **both** CI jobs pass on a push to their matching
branch. They verify the DigitalOcean service source before requesting a
deployment, wait for the deployment to become active, and check that its source
commit matches the tested push. The API deploys the latest configured branch
commit; the commit check detects a race with a newer push.

Do not store production database credentials in GitHub Actions. Set them on
the DigitalOcean app. Pull requests from forks receive no deployment secrets,
and manual workflow runs cannot deploy because deployment requires a push.
