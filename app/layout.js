// app/layout.js
import Script from 'next/script';

export const metadata = {
  title: 'Word Mapper · 儿童版',
};

export default function RootLayout({ children }) {
  // 注意：不使用 <head>，避免 App Router 的头部管理冲突
  // 样式以 <link> 形式放在 body 尾部也能生效；JS 用 next/script 注入
  return (
    <html lang="zh-CN">
      <body>
        {children}
        {/* 样式（保留原路径）： */}
        <link rel="stylesheet" href="/css/style.css" />
        {/* 业务脚本： */}
        <Script src="/js/app.js" strategy="afterInteractive" />
        {/* 可选：自动把公开 token 注入到 window，便于演示（生产建议改为 httpOnly Cookie 会话） */}
        <Script id="inject-token" strategy="afterInteractive">
          {`window.AUTH_TOKEN = ${JSON.stringify(process.env.NEXT_PUBLIC_AUTH_TOKEN || '')};`}
        </Script>
      </body>
    </html>
  );
}
