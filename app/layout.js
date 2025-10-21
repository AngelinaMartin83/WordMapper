// app/layout.js
export const metadata = {
  title: 'Word Mapper · 儿童版',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/css/style.css" />
      </head>
      <body>
        {children}
        <script src="/js/app.js"></script>
      </body>
    </html>
  );
}
