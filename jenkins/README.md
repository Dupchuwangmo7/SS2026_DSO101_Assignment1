# Jenkins-in-Docker setup

Runs Jenkins as a Docker container, with the Docker CLI baked in so the
pipeline can build and push images to Docker Hub.

## Prerequisites

- Docker Desktop (macOS/Windows) or Docker Engine (Linux) running on your host
- Port 8080 free on your machine

## Start Jenkins

From this folder:

```bash
docker compose up -d --build
```

First-run takes a couple of minutes (downloads base image, installs Docker CLI).
Subsequent starts are instant.

## Get the initial admin password

```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Open http://localhost:8080 and paste the password into the setup wizard.

## During the wizard

1. **Install suggested plugins** (gives you Pipeline, Git, Credentials, etc. out of the box)
2. **Create First Admin User** — make a note of the username and password
3. **Instance Configuration** — leave the URL as `http://localhost:8080/`

## After the wizard, install these extra plugins

**Manage Jenkins → Plugins → Available** — search for and install:

- `NodeJS` — provides `npm` inside pipelines
- `Docker Pipeline` — provides the `docker.build` / `docker.withRegistry` DSL
- `JUnit` — to display test results from `junit.xml` (often already installed)

Restart Jenkins when prompted.

## Configure Node.js

**Manage Jenkins → Tools → NodeJS installations → Add NodeJS**:

| Field | Value |
|-------|-------|
| Name  | `NodeJS` (must match the Jenkinsfile exactly) |
| Version | NodeJS 20.x LTS |
| Install automatically | ✓ |

Save.

## Add credentials

**Manage Jenkins → Credentials → System → Global credentials → Add Credentials**:

1. **GitHub** — Username with password
   - Username: your GitHub username
   - Password: a Personal Access Token with `repo` scope
   - ID: `github-creds`

2. **Docker Hub** — Username with password
   - Username: your Docker Hub username
   - Password: a Docker Hub access token (NOT your Docker Hub login password)
   - ID: `docker-hub-creds`

## Stop / restart

```bash
docker compose down       # stop, keep data
docker compose down -v    # stop AND wipe Jenkins data (start over)
docker compose up -d      # start again
docker compose logs -f    # follow logs
```

## Troubleshooting

**"docker: command not found" inside the pipeline.** The custom image install
failed. Run `docker compose build --no-cache` and check the build log.

**"permission denied while trying to connect to the Docker daemon socket".**
The jenkins user inside the container doesn't have permission to read
`/var/run/docker.sock`. On Linux, find the host docker group's GID and
rebuild:
```bash
DOCKER_GID=$(getent group docker | cut -d: -f3) docker compose build --no-cache
docker compose up -d
```

**Port 8080 already in use.** Either stop whatever else is using it, or change
the port mapping in `docker-compose.yml` (e.g. `"8090:8080"`).

**Lost your admin password.** Reset it by removing the volume and starting over:
```bash
docker compose down -v
docker compose up -d
```
