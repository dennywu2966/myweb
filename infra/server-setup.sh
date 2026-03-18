#!/bin/bash
# Server Setup Script
# Run this on your server as root

set -e

echo "=== Denny Personal Site - Server Setup ==="

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "Installing nginx..."
    apt update && apt install -y nginx
fi

# Create web directory
echo "Creating web directory..."
mkdir -p /var/www/denny

# Copy nginx config
echo "Setting up nginx config..."
cp /tmp/denny.conf /etc/nginx/sites-available/denny.conf
ln -sf /etc/nginx/sites-available/denny.conf /etc/nginx/sites-enabled/denny.conf

# Test and reload nginx
echo "Testing nginx config..."
nginx -t
systemctl reload nginx

echo ""
echo "=== Setup Complete ==="
echo "Now deploy your site files to /var/www/denny"
echo "Then access http://123.57.180.180"
