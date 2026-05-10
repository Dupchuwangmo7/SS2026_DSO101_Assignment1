# Custom Jenkins image with the Docker CLI installed.
# The Docker CLI is needed because the Jenkinsfile's "Docker Build & Push" stage
# calls docker.build() and docker.withRegistry(). The CLI talks to the HOST's
# Docker daemon via the socket mounted in docker-compose.yml.
#
# We do NOT install the Docker daemon inside the container — that would be
# Docker-in-Docker (DinD), which is heavier and has its own quirks. We use
# Docker-out-of-Docker (DooD) by sharing the host's daemon socket.

FROM jenkins/jenkins:lts-jdk17

USER root

# Install the Docker CLI (no daemon).
# This grabs the official Docker apt repo and installs only docker-ce-cli.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        gnupg \
        lsb-release && \
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | \
        gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
        > /etc/apt/sources.list.d/docker.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends docker-ce-cli && \
    rm -rf /var/lib/apt/lists/*

# Add the jenkins user to the docker group so it can talk to the mounted socket.
# DOCKER_GID is passed as a build arg from docker-compose.yml — set it to the
# GID of the docker group on your HOST machine (run `getent group docker` on
# Linux, or just leave it at 999 which is the common default).
ARG DOCKER_GID=999
RUN groupadd -f -g ${DOCKER_GID} docker && \
    usermod -aG docker jenkins

USER jenkins
