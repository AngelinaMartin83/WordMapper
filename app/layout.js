// app/layout.js
import Script from 'next/script';

export const metadata = {
  title: "SoundWhy - 英语自然拼读与音标可视化发音工具",
  description:
    "SoundWhy 是一个免费的在线英语自然拼读与发音工具，能将英文单词的字母或字母组合与音标对应显示，帮助你直观理解发音规律与拼读规则。",
  keywords: [
    "英语自然拼读",
    "自然拼读工具",
    "英语发音",
    "音标对齐",
    "音标可视化",
    "英语单词发音",
    "IPA 发音",
    "SoundWhy",
    "英语学习工具",
  ],
  openGraph: {
    title: "SoundWhy - 英语自然拼读与音标可视化发音工具",
    description:
      "输入英文单词，SoundWhy 自动展示字母或字母组合与音标对应关系，帮助你掌握英语自然拼读与发音规律。",
    url: "https://soundwhy.com",
    siteName: "SoundWhy",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SoundWhy - 英语自然拼读与音标可视化发音工具",
    description: "通过自然拼读和音标映射，轻松掌握英语单词的发音规律。",
  },
  alternates: {
    canonical: "https://soundwhy.com",
  },
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
