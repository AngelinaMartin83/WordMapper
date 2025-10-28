// app/page.js
export default function Page() {
  return (
    <div className="wrap">
      {/* 页眉 */}
      <header>
        <div className="logo">Aa</div>
        <div>
          <h1>SoundWhy.com · 英语自然拼读与音标映射工具</h1>
        </div>
      </header>

      {/* 查词输入区 */}
      <div className="grid">
        <section className="pane">
          <h2 style={{ marginTop: 0, marginBottom: 20 }}>🔍 查找单词</h2>
          <input id="words" type="text" placeholder="例如：cat" />
          <div className="row" style={{ marginTop: '12px' }}>
            <button className="btn" id="runBtn">提交 ✅</button>
            <button className="btn ghost" id="clearBtn">清空结果</button>
          </div>
        </section>
      </div>

      {/* 结果显示区 */}
      <div className="card">
        <section className="pane">
          <h2 style={{ margin: 0 }}>🎯 结果</h2>
          <div id="out" className="results"></div>
        </section>
      </div>

      {/* ✅ 使用说明区（放在功能区下方） */}
      <div
        className="usage"
        style={{
          marginTop: '60px',
          background: '#f9fafb',
          borderRadius: '12px',
          padding: '24px',
          lineHeight: '1.8',
          color: '#333',
        }}
      >
        <h2 style={{ marginTop: 0 }}>📘 使用说明</h2>

        <p>
          <strong>SoundWhy</strong> 是一个免费的英语
         自然拼读（Phonics）与音标可视化发音工具。你只需输入英文单词，系统会获取对应的 IPA 音标，并展示字母与音标之间的对应关系。
        </p>

        <p>
          本工具基于英语自然拼读原理，帮助学习者理解字母组合的发音规律，
          提升英语拼读、拼写与口语能力。非常适合英语学习者、
          教师及家长用于教学或自学。
        </p>

        <p>
          如果输入的单词未被词典收录，系统会提示：
          <strong>“未在词典中找到单词”</strong>，
          可尝试输入其他单词，或等待词库更新。
        </p>

        <p>
          本网站仅用于教育与学习目的，不会收集或存储任何用户输入数据。
        </p>

        <p style={{ fontSize: '0.9em', color: '#666', marginTop: '16px' }}>
          © {new Date().getFullYear()} SoundWhy.com · 英语自然拼读与音标学习网站
        </p>
      </div>
    </div>
  );
}
