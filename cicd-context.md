# CI/CD Context - Denny Personal Site Deployment

## Project Overview
- **Project**: Denny personal website (Astro + TypeScript + MDX + Tailwind CSS)
- **Domain**: www.winter-prosper.com
- **Server**: Alibaba Cloud ECS (Ubuntu 24.04), user: web
- **SSH**: web@123.57.180.180, key: ~/.ssh/id_ed25519

## Current Status

### ✅ Deployment Pipeline - FULLY OPERATIONAL
1. GitHub Actions builds with bun ✅
2. Files rsync'd to `/home/web/projects/staging/myweb/dist/` ✅
3. nginx configured and running on port 80 ✅
4. Site accessible at `http://123.57.180.180/staging/` (HTTP 200) ✅
5. nginx config deployed via CI/CD ✅
6. Auto-reload nginx after deploy ✅
7. **GitHub Actions secrets scoped to `staging` environment** ✅

### ⚠️ Known Limitations

#### ICP Filing Block
- www.winter-prosper.com:80 returns ISP-level ICP filing block from China
- Direct IP access works: `http://123.57.180.180/staging/`
- This is a Chinese regulatory issue, not a server configuration issue

## Server Configuration

### nginx Config
- Source: `infra/docker/staging-80.conf`
- Deployed to: `/etc/nginx/sites-available/staging-80`
- Enabled in: `/etc/nginx/sites-enabled/staging-80`
- Site root: `/home/web/projects/staging/myweb/dist`
- Access via: `/staging/`

### Permissions
- `/home/web/projects/staging/myweb/` set to 755
- www-data can read files (added to web group)

## GitHub Actions Workflow

**File:** `.github/workflows/deploy.yml`

**Steps:**
1. Checkout → Bun setup → Install → Build
2. SSH key config → Dir structure
3. Rsync dist/ → Rsync infra/docker/
4. Deploy nginx config → Reload nginx

**Important:** Secrets must be scoped to the `staging` environment, not just repository level.

## GitHub Secrets

**All secrets configured for `staging` environment:**
| Secret | Value |
|--------|-------|
| `STAGING_SSH_KEY` | `~/.ssh/id_ed25519` (private key) |
| `STAGING_USER` | `web` |
| `STAGING_HOST` | `123.57.180.180` |
| `STAGING_SUDO_PASS` | `641121` |

## Infrastructure Files
| Local | Remote |
|-------|--------|
| `infra/docker/staging-80.conf` | `/etc/nginx/sites-available/staging-80` |
| `dist/` | `/home/web/projects/staging/myweb/dist/` |

## Access
- **Direct IP**: http://123.57.180.180/staging/ ✅ Working
- **Domain**: http://www.winter-prosper.com/staging/ ❌ ICP blocked

## Commit History
- `2c12b72` - docs: sync commit history
- `99a8a4d` - docs: update commit history with nginx fixes
- `8650667` - fix: nginx rewrite to strip /staging prefix
- `59a00fe` - fix: nginx alias with try_files =404
- `d451381` - fix: simplify nginx config for proper static file serving
- `12e77b9` - docs: update commit history with latest commit
- `9d4ec80` - docs: mark CI/CD as fully operational
- `41d1028` - ci: use environment-scoped secrets
- `dbca242` - refactor: cleanup dead code and improve design aesthetics
- `92f369f` - feat: complete CI/CD pipeline with nginx auto-deploy

---

**Status: ALL SYSTEMS GO - CI/CD pipeline fully operational.**

**Last verified:** 2026-03-20 00:50 UTC - Deployment successful, site accessible at http://123.57.180.180/staging/
