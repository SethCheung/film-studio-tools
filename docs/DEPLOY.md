# 部署文档

## 本地运行（M3 Ultra Mac）

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务

```bash
npm start
# 或开发模式（文件变更自动重启）
npm run dev
```

服务运行在 http://localhost:3000

---

## 远程访问配置

### Cloudflare Tunnel（推荐）

1. 安装 cloudflared：
   ```bash
   brew install cloudflare/cloudflare/cloudflared
   ```

2. 创建隧道：
   ```bash
   cloudflared tunnel create film-studio
   ```

3. 配置域名（可选，映射到你的域名）

4. 运行隧道：
   ```bash
   cloudflared tunnel run film-studio
   ```

### 或者使用 ngrok

```bash
ngrok http 3000
```

---

## 移动端配置

### PWA 安装

1. 用手机访问 http://你的服务器地址
2. iOS：点击分享按钮 → 添加到主屏幕
3. Android：会自动提示安装，或点击浏览器菜单 → 安装应用

### 无公网IP方案

使用 Cloudflare Tunnel，生成的 URL 可直接在任何设备访问，无需配置路由器。

---

## 数据库

数据存储在 `backend/data/film-studio.db`（SQLite 文件）。

备份：复制该文件即可。
