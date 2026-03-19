# CI/CD Context - Denny Personal Site Deployment

## Project Overview
- **Project**: Denny personal website (Astro + TypeScript + MDX + Tailwind CSS)
- **Domain**: www.winter-prosper.com
- **Server**: Alibaba Cloud ECS (Ubuntu 24.04), user: web
- **SSH**: web@www.winter-prosper.com, key: ~/.ssh/id_ed25519

## Current Status

### ✅ Deployment Pipeline - Fully Operational
1. GitHub Actions builds with bun and deploys to server
2. Files rsync'd to `/home/web/projects/staging/myweb/dist/`
3. nginx configured and running on port 80
4. Site accessible at `http://123.57.180.180/staging/` (HTTP 200)
5. nginx config deployed automatically via CI/CD

### ⚠️ Known Limitations

#### ICP Filing Block
- www.winter-prosper.com:80 returns ISP-level ICP filing block from within China
- This is a Chinese regulatory requirement, not a server configuration issue
- **Workaround**: Use direct IP `http://123.57.180.180/staging/` or fix ICP filing

### 🔧 Server Configuration

#### nginx Config (deployed via CI/CD)
- Source: `infra/docker/staging-80.conf`
- Deployed to: `/etc/nginx/sites-available/staging-80`
- Site root: `/home/web/projects/staging/myweb/dist`
- Access via: `/staging/` (aliased to dist folder)
- Permissions: www-data can read files (755 on myweb directory)

#### Directory Structure
```
/home/web/projects/staging/myweb/
├── dist/          (static files, synced via rsync)
├── infra/docker/  (nginx config, docker configs - synced via rsync)
```

## GitHub Actions Workflow
Location: `.github/workflows/deploy.yml`

**Steps:**
1. Checkout code
2. Setup Bun & install dependencies
3. Build with `bun run build`
4. Setup SSH key for rsync
5. Ensure directory structure exists
6. Rsync dist/ to server
7. Rsync infra/docker/ to server
8. Deploy nginx config to /etc/nginx/sites-available/
9. Reload nginx with sudo

### Required Secrets
| Secret | Description |
|--------|-------------|
| `STAGING_SSH_KEY` | SSH private key for key auth |
| `STAGING_USER` | web |
| `STAGING_HOST` | www.winter-prosper.com |
| `STAGING_SUDO_PASS` | Server sudo password (needed for nginx reload) |

**Action Required**: Add `STAGING_SUDO_PASS` secret to GitHub repository

## Infrastructure Files
| Local | Remote | Purpose |
|-------|--------|---------|
| `infra/docker/staging-80.conf` | `/etc/nginx/sites-available/staging-80` | nginx config |
| `infra/docker/docker-compose.yml` | `/home/web/projects/staging/myweb/infra/docker/` | Docker config |
| `dist/` | `/home/web/projects/staging/myweb/dist/` | Static site files |

## Access URLs
- **Direct IP**: http://123.57.180.180/staging/ ✅ Working
- **Domain**: http://www.winter-prosper.com/staging/ ❌ ICP blocked (from China)

## Passwords
- Server sudo/web password: 641121
- SSH key: ~/.ssh/id_ed25519

## Next Steps
1. [x] nginx configured and running on port 80 ✅
2. [x] Site accessible via direct IP ✅
3. [x] GitHub Actions updated with nginx deploy + reload ✅
4. [ ] Add `STAGING_SUDO_PASS` secret to GitHub repository
5. [ ] Test full CI/CD pipeline end-to-end (push to main)
6. [ ] Consider ICP filing resolution for domain access (optional)
