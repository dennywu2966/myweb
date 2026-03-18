#!/bin/bash
# Server Setup Script for Denny Personal Site - Staging
# Run this ONCE on your server as root or with sudo

set -e

echo "=== Denny Personal Site - Staging Server Setup ==="
echo "Target: https://www.winter-prospect.com/staging"
echo ""

STAGING_DIR="/home/web/projects/staging/myweb"

# Create directory structure
echo "Creating directory structure..."
mkdir -p $STAGING_DIR/infra/docker
mkdir -p $STAGING_DIR/dist

# Check if SSH key is set up for GitHub Actions
echo ""
echo "=== GitHub Actions SSH Key Setup ==="
echo "Make sure you have added the following secrets to your GitHub repository:"
echo "  STAGING_HOST: www.winter-prospect.com"
echo "  STAGING_USER: web"
echo "  STAGING_SSH_KEY: Your SSH private key"
echo ""

# Docker installation check
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Please install Docker first:"
    echo "  curl -fsSL https://get.docker.com | sh"
    echo "  sudo usermod -aG docker web"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "Docker Compose not found. Please install it."
    exit 1
fi

echo "Docker is installed."

# Create docker-compose file on server
echo ""
echo "Creating docker-compose.yml..."
cat > $STAGING_DIR/infra/docker/docker-compose.yml << 'EOF'
services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ~/projects/staging/myweb/dist:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    restart: always
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
EOF

# Create nginx config for subdirectory
echo "Creating nginx.conf..."
cat > $STAGING_DIR/infra/docker/nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location /staging/ {
        alias /usr/share/nginx/html/;
        try_files $uri $uri/ $uri.html =404;
    }

    location ~ ^/staging/[^.]+\.(html|js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
}
EOF

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Make sure www.winter-prospect.com has nginx/proxy routing /staging to port 8080"
echo "2. Initial deployment will happen automatically when you push to main branch"
echo "3. Or manually: rsync -avz ./dist/ web@www.winter-prospect.com:~/projects/staging/myweb/dist/"
echo ""
echo "Docker auto-start and self-healing is configured (restart: always)"
