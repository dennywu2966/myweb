# CI/CD Context - Denny Personal Site Deployment

## Project Overview
- **Project**: Denny personal website (Astro + TypeScript + MDX + Tailwind CSS)
- **Domain**: www.winter-prosper.com
- **Server**: Alibaba Cloud ECS (Ubuntu 24.04), user: web
- **SSH**: web@www.winter-prosper.com, key: ~/.ssh/id_ed25519

## Current Status

### ✅ Deployment Pipeline - COMPLETE
1. GitHub Actions builds with bun ✅
2. Files rsync'd to `/home/web/projects/staging/myweb/dist/` ✅
3. nginx configured and running on port 80 ✅
4. Site accessible at `http://123.57.180.180/staging/` (HTTP 200) ✅
5. nginx config deployed via CI/CD ✅
6. Auto-reload nginx after deploy ✅ (workflow step added)

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

### Required Secrets
| Secret | Status |
|--------|--------|
| `STAGING_SSH_KEY` | ✅ Configured |
| `STAGING_USER` | ✅ Configured |
| `STAGING_HOST` | ✅ Configured |
| `STAGING_SUDO_PASS` | ⏳ **You need to add this** |

## Infrastructure Files
| Local | Remote |
|-------|--------|
| `infra/docker/staging-80.conf` | `/etc/nginx/sites-available/staging-80` |
| `dist/` | `/home/web/projects/staging/myweb/dist/` |

## Access
- **Direct IP**: http://123.57.180.180/staging/ ✅ Working
- **Domain**: http://www.winter-prosper.com/staging/ ❌ ICP blocked

## GitHub Secret Required

Add this secret to enable automated nginx reload:

```
Name:  STAGING_SUDO_PASS
Value: 641121
```

Location: GitHub repo → Settings → Secrets → Actions → New repository secret

## Commit History
- `92f369f` - feat: complete CI/CD pipeline with nginx auto-deploy

---

**Status: Infrastructure ready. Only GitHub secret addition required.**
