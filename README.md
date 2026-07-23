# WordMapper (Next.js + Vercel 安全版)

一个基于 **Next.js 14 App Router** 架构的在线单词音标对齐工具。  
前端界面完全静态、快速加载；  
字典和对齐逻辑全部在 **服务端执行**，保证数据安全，用户无法看到 JSON 文件内容。

---

## 🚀 功能特性

- ✅ **前端纯静态**（HTML + JS + CSS）  
- 🔒 **字典仅存放在服务器，不暴露前端**  
- 🍪 **自动生成安全 httpOnly 会话 Cookie**（无需用户登录或 Token）  
- ⚡ **Edge Middleware 自动下发 Cookie**  
- 🧠 **服务端动态加载字典 & 强制对齐计算**  
- 🧩 **纯 JS 前端交互，与原页面外观一致**  
- 🌐 **可一键部署到 Vercel 免费方案**

---

## 📁 项目结构

```
├── app/
│   ├── layout.js              # 全局布局（引入 CSS 与 JS）
│   ├── page.js                # 页面主结构（HTML 内容）
│   └── api/
│       └── align/route.js     # 后端接口：对齐逻辑 + 鉴权
│
├── lib/
│   ├── auth.js                # Node.js 会话验证（HMAC 签名）
│   ├── edgeAuth.js            # Edge 环境签名（middleware 用）
│   └── aligner.js             # 强制对齐算法（DP 动态规划实现）
│
├── middleware.js              # Edge Middleware：自动设置 Cookie
│
├── public/
│   ├── css/style.css          # 页面样式
│   ├── js/app.js              # 前端逻辑（fetch API/渲染）
│   └── favicon.ico            # 图标
│
├── server-data/
│   └── beep_uk_ipa.json       # 🔒 custom learner UK IPA（服务端专用）
│
├── package.json               # 项目依赖与脚本
├── next.config.js             # Next.js 配置
├── .env.example               # 环境变量示例（需复制为 .env.local）
└── README.md
```

---

## ⚙️ 环境变量设置

1️⃣ 本地开发：
```bash
cp .env.example .env.local
```
编辑 `.env.local`：
```bash
AUTH_TOKEN=随意强随机字符串
```

2️⃣ 部署到 Vercel：
在项目的  
**Settings → Environment Variables** 中添加同名变量：
```
AUTH_TOKEN=（同样的强随机字符串）
```

---

## 🧩 工作流程

1. 用户访问首页 → `middleware.js` 自动生成安全 Cookie (`sid`)  
2. 前端输入单词 → `public/js/app.js` 调用 `/api/align`  
3. 接口验证 Cookie → 从 `server-data/beep_uk_ipa.json` 读取 custom learner 的 UK IPA
4. 使用 `lib/aligner.js` 执行对齐算法  
5. 返回结果给前端渲染，无任何字典数据暴露

---

## 🧪 本地运行

```bash
npm install
npm run dev
```

打开浏览器访问：  
👉 http://localhost:3000

---

## 🚀 部署到 Vercel

1. 将项目上传到 GitHub  
2. 登录 [Vercel](https://vercel.com)  
3. **Import Project → 选择 GitHub 仓库 → 部署**  
4. 在 Vercel 项目 **Settings → Environment Variables** 中添加：
   ```
   AUTH_TOKEN=你的随机字符串
   ```
5. 部署完成后，直接访问即可使用，无需登录。

---

## 🔐 安全设计说明

| 安全点 | 说明 |
|--------|------|
| 字典保护 | `beep_uk_ipa.json` 存于 `server-data/`，不会被打包到前端 |
| Cookie 鉴权 | 由 Edge Middleware 自动生成、HttpOnly、7天有效 |
| API 限制 | `/api/align` 必须带有效 Cookie（或 Bearer Token 才放行） |
| 无暴露 Token | 前端无任何敏感信息或环境变量 |
| CDN 缓存安全 | Middleware 默认禁用页面缓存，确保 Cookie 下发可靠 |

---

## 🧹 维护建议

- **不再使用 `index.html`**（该文件已弃用，Next.js 用 `app/page.js` 渲染）
- 当前 `beep_uk_ipa.json` 来自 custom learner 字典，并且只包含 UK IPA；
  更新时应继续保持现有的 `word → [UK IPA]` 数据格式
- 若出现 401，可检查：
  - Cookie 是否被禁用；
  - Vercel `AUTH_TOKEN` 是否与 `.env.local` 一致。

---

## 📄 许可证

MIT License  
© 2025 WordMapper Project
