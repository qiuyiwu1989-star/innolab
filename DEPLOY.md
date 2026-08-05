# Deploy

> ⚠️ **本文档停留在 2026 年 5–6 月，多处已过时**（当时 74 方法 / 10 案例 / 旧域名，现为 86 方法 / 76 案例 / innolab.cc）。
> **最新状态以 `CLAUDE.md` 和 `谱/进度.md` 为准。**

> 当前**已经上线**在 <https://innolab.qiuyiwu.com>（自建 VPS）。  
> 这份文档说明：① 增量更新 ② 服务器从零开始重装 ③ 备选 Vercel 路径

## ① 增量更新（最常用）

push 完代码后：

```bash
ssh ubuntu@<服务器 IP，见密码管理器> 'bash ~/innolab/scripts/deploy-update.sh'
```

脚本会：
- `git fetch` + `pull --rebase`（如果远端没新提交直接退出）
- `npm ci`（按 lock 文件装依赖）
- `npm run build`
- `pm2 reload innolab`（零 downtime）
- smoke test（`/` + `/api/health`）

整套约 60-90 秒。

## ② 从零重装（迁移服务器 / 灾备）

假设新服务器是 Ubuntu 22+ 并已开通 22/80/443 端口，用户 `ubuntu`：

### 第 1 步：装基础工具链

```bash
ssh ubuntu@<NEW_IP>

# Node 22 via nvm
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm install 22 --lts && nvm alias default 22

# pm2 全局
npm install -g pm2

# nginx + certbot
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx git
```

### 第 2 步：拉代码 + 装依赖 + build

```bash
cd ~
git clone https://github.com/qiuyiwu1989-star/innolab.git
cd innolab
npm ci
```

### 第 3 步：写 .env.local

```bash
cat > ~/innolab/.env.local <<'ENV'
NEXT_PUBLIC_SITE_URL=https://innolab.qiuyiwu.com
MIMO_BASE_URL=https://token-plan-cn.xiaomimimo.com/v1
MIMO_API_KEY=<rotate-后填新值>
MIMO_MODEL=mimo-v2.5-pro
PORT=3010
INNOLAB_DAILY_QUOTA_GLOBAL=50
INNOLAB_DAILY_QUOTA_PER_IP=5
INNOLAB_ADMIN_TOKEN=<随机字符串>
IP_SALT=<随机字符串>
ENV
chmod 600 ~/innolab/.env.local
```

### 第 4 步：build + pm2 起进程

```bash
cd ~/innolab
npm run build
PORT=3010 pm2 start npm --name innolab -- start
pm2 save                    # 持久化
pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1 | bash   # 开机自启
```

### 第 5 步：nginx 反代

```bash
sudo tee /etc/nginx/sites-available/innolab > /dev/null <<'NGINX'
server {
    listen 80;
    server_name innolab.qiuyiwu.com;

    location /.well-known/acme-challenge/ { root /var/www/html; }

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/innolab /etc/nginx/sites-enabled/innolab
sudo nginx -t && sudo nginx -s reload
```

### 第 6 步：DNS

到 qiuyiwu.com 的 DNS 控制台加：

| Type | Name | Value |
|---|---|---|
| A | `innolab` | `<NEW_IP>` |

或者用泛解析 `*.qiuyiwu.com → <NEW_IP>` 就自动覆盖。

### 第 7 步：SSL

DNS 生效后：

```bash
sudo certbot --nginx -d innolab.qiuyiwu.com \
  --non-interactive --agree-tos \
  --register-unsafely-without-email --redirect
```

证书 90 天有效，certbot 自动续期。

### 第 8 步：验证

```bash
curl -sI https://innolab.qiuyiwu.com/ | head -3
curl -s https://innolab.qiuyiwu.com/api/health | jq
```

## ③ 备选：Vercel 路径

如果将来 VPS 跑不动了 / 或者想转 serverless：

```bash
npm install -g vercel
vercel              # 第一次 link 项目
vercel --prod       # 生产部署
```

在 Vercel Dashboard → Settings → Environment Variables 加：

```
MIMO_API_KEY
MIMO_BASE_URL
MIMO_MODEL
NEXT_PUBLIC_SITE_URL
INNOLAB_ADMIN_TOKEN
```

注意：Vercel Hobby plan 上 streaming 25s 超时；MiMo 长推演可能超时。要么用 Pro plan，要么继续 VPS。

## 故障排查

### 用户报 502

```bash
ssh ubuntu@<服务器 IP，见密码管理器>
pm2 status innolab          # 看进程是不是挂了
pm2 logs innolab --lines 50 # 看具体错误
pm2 restart innolab         # 重启
```

### /demo 返回"未配置 MIMO_API_KEY"

```bash
ssh ubuntu@<服务器 IP，见密码管理器>
cat ~/innolab/.env.local | grep MIMO_API_KEY
# 没有就加，然后 pm2 reload innolab
```

### SSL 证书要过期了

```bash
sudo certbot renew --dry-run   # 测试续期
# 实际续期由 systemd timer 自动跑，每天检查
sudo systemctl status certbot.timer
```

### 配额满了 / 用户报 "今日全站配额已用完"

```bash
# 临时把全站配额加大
ssh ubuntu@<服务器 IP，见密码管理器>
sed -i 's/INNOLAB_DAILY_QUOTA_GLOBAL=50/INNOLAB_DAILY_QUOTA_GLOBAL=200/' ~/innolab/.env.local
pm2 reload innolab
```

注意每次分析约 $0.05-0.15，调高配额前先估算成本。

## 监控

### 看实时流量

```bash
ssh ubuntu@<服务器 IP，见密码管理器> 'pm2 logs innolab | grep analyze.request'
```

### 网页看汇总

```
https://innolab.qiuyiwu.com/admin/stats?token=<INNOLAB_ADMIN_TOKEN>
```

### 健康检查（外部监控接这个 URL）

```
GET https://innolab.qiuyiwu.com/api/health
→ 200 status=ok / degraded / down
```
