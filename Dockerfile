FROM golang:1.24-alpine AS builder
ENV CGO_ENABLED=0
WORKDIR /backend
COPY backend/go.* .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go mod download
COPY backend/. .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -trimpath -ldflags="-s -w" -o bin/service .

FROM --platform=$BUILDPLATFORM node:20-alpine AS client-builder
WORKDIR /ui
# cache packages in layer
COPY ui/package.json /ui/package.json
COPY ui/package-lock.json /ui/package-lock.json
RUN --mount=type=cache,target=/usr/src/app/.npm \
    npm set cache /usr/src/app/.npm && \
    npm ci
# install
COPY ui /ui
RUN npm run build

FROM alpine:latest
LABEL org.opencontainers.image.title="Remote Docker"
LABEL org.opencontainers.image.description="Manage and monitor remote Docker environments via SSH tunneling.\
    Access containers, images, networks, volumes, logs, and stats with a familiar UI."
LABEL org.opencontainers.image.vendor="Ege Kocabaş"
LABEL com.docker.desktop.extension.api.version="0.3.4"
LABEL com.docker.extension.categories="utility-tools,container-orchestration"
LABEL com.docker.extension.account-info=""
LABEL com.docker.desktop.extension.icon="https://raw.githubusercontent.com/telkombe/remote-docker/refs/heads/main/assets/extension-icon.svg"
LABEL com.docker.extension.screenshots="[\
    {\"alt\": \"Dashboard\", \"url\": \"https:\/\/raw.githubusercontent.com\/telkombe\/remote-docker\/refs\/heads\/main\/assets\/01_dashboard.png\"},\
    {\"alt\": \"Containers\", \"url\": \"https:\/\/raw.githubusercontent.com\/telkombe\/remote-docker\/refs\/heads\/main\/assets\/02_containers.png\"}, \
    {\"alt\": \"Compose logs\", \"url\": \"https:\/\/raw.githubusercontent.com\/telkombe\/remote-docker\/refs\/heads\/main\/assets\/03_compose_logs.png\"}, \
    {\"alt\": \"Images\", \"url\": \"https:\/\/raw.githubusercontent.com\/telkombe\/remote-docker\/refs\/heads\/main\/assets\/04_images.png\"}, \
    {\"alt\": \"Volumes\", \"url\": \"https:\/\/raw.githubusercontent.com\/telkombe\/remote-docker\/refs\/heads\/main\/assets\/05_volumes.png\"}, \
    {\"alt\": \"Networks\", \"url\": \"https:\/\/raw.githubusercontent.com\/telkombe\/remote-docker\/refs\/heads\/main\/assets\/06_networks.png\"}, \
    {\"alt\": \"Environments\", \"url\": \"https:\/\/raw.githubusercontent.com\/telkombe\/remote-docker\/refs\/heads\/main\/assets\/07_environments.png\"}, \
    {\"alt\": \"Environment Selection\", \"url\": \"https:\/\/raw.githubusercontent.com\/telkombe\/remote-docker\/refs\/heads\/main\/assets\/08_environment_selection.png\"}, \
    {\"alt\": \"Disconnect\", \"url\": \"https:\/\/raw.githubusercontent.com\/telkombe\/remote-docker\/refs\/heads\/main\/assets\/09_disconnect.png\"}, \
    {\"alt\": \"Container Logs\", \"url\": \"https:\/\/raw.githubusercontent.com\/telkombe\/remote-docker\/refs\/heads\/main\/assets\/10_container_logs.png\"}]"
LABEL com.docker.extension.detailed-description="\
    A Docker Desktop extension that brings remote Docker management with a user-friendly UI.<br><br>\
    <b>Key Features:</b><br><br>\
    - Full remote Docker environment management via SSH tunneling<br>\
    - Real-time container logs for quick troubleshooting<br>\
    - Compact CLI-style log view<br>\
    - Isolated tabbed views per container<br>\
    - Persistent environment settings for easy access<br>\
    - Dashboard with live container, image, volume, and network insights<br><br>\
    <b>Architecture:</b><br><br>\
    - <b>Backend (Go)</b>: Handles SSH tunnel creation and proxies Docker commands to remote hosts<br>\
    - <b>Frontend (React/TypeScript)</b>: Provides a responsive UI for managing remote Docker instances<br><br>\
    <b>Security Considerations:</b><br>\
    - Mounts your local SSH keys as read-only from <code>~/.ssh</code> into the extension container<br>\
    - Uses an isolated OpenSSH client inside the extension<br>\
    - Executes all commands securely over an SSH tunnel<br>\
    - No external API calls are made<br><br>\
    <b>Usage:</b><br>\
    - Install the extension<br>\
    - Configure remote environments<br>\
    - Select a remote instance and start managing Docker remotely<br><br>\
    <b>Warning:</b> Use this extension at your own risk. Always review the code and validate actions before running or installing it.<br><br>"
LABEL com.docker.extension.publisher-url="https://github.com/telkombe/remote-docker"
LABEL com.docker.extension.additional-urls="\
    [{\"title\":\"GitHub\",\"url\":\"https:\/\/github.com\/telkombe\/remote-docker\"},\
    {\"title\":\"MIT License\",\"url\":\"https://github.com/telkombe/remote-docker/blob/main/LICENSE\"}]"
LABEL com.docker.extension.changelog="<ul><li>Initial release</li></ul>"


# Install SSH client
RUN apk add --no-cache openssh-client docker

# Install ca-certificates for Docker client
RUN apk add --no-cache ca-certificates

# Create necessary SSH directories
RUN mkdir -p /root/.ssh && chmod 700 /root/.ssh

# Add a startup script to fix SSH permissions
RUN echo '#!/bin/sh' > /fix-ssh-permissions.sh && \
    echo 'if [ -d /root/.ssh-host ]; then' >> /fix-ssh-permissions.sh && \
    echo '  cp -r /root/.ssh-host/* /root/.ssh/ 2>/dev/null || true' >> /fix-ssh-permissions.sh && \
    echo '  chmod 700 /root/.ssh' >> /fix-ssh-permissions.sh && \
    echo '  chmod 600 /root/.ssh/id_* 2>/dev/null || true' >> /fix-ssh-permissions.sh && \
    echo '  chmod 644 /root/.ssh/*.pub 2>/dev/null || true' >> /fix-ssh-permissions.sh && \
    echo 'fi' >> /fix-ssh-permissions.sh && \
    echo 'exec "$@"' >> /fix-ssh-permissions.sh && \
    chmod +x /fix-ssh-permissions.sh

# Force cache invalidation
ARG CACHEBUST=1

COPY --from=builder /backend/bin/service /
COPY docker-compose.yaml .
COPY metadata.json .
COPY assets/extension-icon.svg .
COPY --from=client-builder /ui/build/ ui/

ENTRYPOINT ["/fix-ssh-permissions.sh"]
CMD ["/service", "-socket", "/run/guest-services/backend.sock"]
