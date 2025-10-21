# Word Mapper 后端化 (Vercel + GitHub, 方案A/纯JS)

> 前端界面保持与你上传的 `YangyiKai_V1.html` 一致（结构/ID不改），样式仍引用 `css/style.css`（你自行提供）。
> 后端通过 Next.js API 读取服务器端私有字典 `server-data/beep_uk_ipa.json`，客户端只拿到对齐结果，不暴露字典。

## 目录
```
app/
  api/
    align/
      route.js        # 受保护的 API
lib/
  aligner.js          # 对齐逻辑（Node 端）
public/
  js/
    app.js            # 前端交互逻辑（调用 /api/align）
server-data/
  beep_uk_ipa.json    # 你自行放入（不提交到公开仓库）
index.html            # 界面与结构照搬你提供的 HTML
next.config.js
package.json
.env.example
```

## 使用
1. 把你的 `css/style.css` 放到 `public/css/style.css`（自行创建 `public/css/` 目录）。
2. 把你的字典文件命名为 **`beep_uk_ipa.json`**，放到 `server-data/` 目录。结构示例：
   ```json
   {
     "father": ["fɑːðə"],
     "cat": ["kæt"]
   }
   ```
3. 复制 `.env.example` 为 `.env.local`，设置 `AUTH_TOKEN` 为强随机字符串。
4. 本地运行：
   ```bash
   npm i
   npm run dev
   ```
   打开 http://localhost:3000
5. 部署到 Vercel：
   - GitHub 仓库 **建议设为私有**（因为字典在仓库里）。
   - Vercel 项目中新增环境变量 `AUTH_TOKEN`，与本地一致。
   - 推送后自动部署。

## 前端说明
- 页面文件为项目根目录的 `index.html`（保持你原来的结构/ID/文案）。
- 脚本逻辑在 `public/js/app.js`：
  - 默认通过 `/api/align` 调后端，返回 `pairs`、`cost`、`ipa`（拆分后的音位）。
  - **界面完全不变**，CSS 路径仍是 `<link rel="stylesheet" href="css/style.css">`。

## 安全要点
- 字典仅在服务器端读取，不下发到浏览器。
- API 需要 `Authorization: Bearer <AUTH_TOKEN>` 才能访问（示例用法，可改成登录Session）。

