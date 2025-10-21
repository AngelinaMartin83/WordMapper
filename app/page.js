// app/page.js
export default function Page() {
  return (
    <div className="wrap">
      <header>
        <div className="logo">Aa</div>
        <div>
          <h1>Word Mapper · 杨一恺版本</h1>
        </div>
      </header>

      <div className="card">
        <section className="pane">
          <h2 style={{margin:0}}>🎯 结果</h2>
          <div id="out" className="results"></div>
        </section>

        <div className="grid">
          <section className="pane">
            <h2 style={{margin:0}}>🔍 查找发音</h2>

            <label>单词</label>
            <input id="words" type="text" placeholder="例如：cat 或 information" />
            <div className="row" style={{marginTop:'12px'}}>
              <button className="btn" id="runBtn">开始对齐 ✅</button>
              <button className="btn ghost" id="clearBtn">清空结果</button>
            </div>

            <div style={{marginTop:'14px'}}>
              <h3 style={{margin:0}}>📦 字典</h3>
              <div className="row">
                <input id="dictFile" type="file" accept="application/json" className="btn small ghost"/>
                <button className="btn small ghost" id="sampleBtn">加载示例字典</button>
              </div>
              <div className="how" id="dictInfo" style={{marginTop:'8px'}}></div>
              <div id="dictError" className="muted" style={{marginTop:'6px',color:'#b21'}}></div>
            </div>

            <details style={{marginTop:'10px'}}>
              <summary className="muted"><strong>可选：</strong>为当前行手动输入 IPA（会覆盖字典）</summary>
              <input id="ipaInput" type="text" placeholder="例：ˈbʊk 或 b ʊ k" style={{marginTop:'8px'}}/>
            </details>
          </section>
        </div>
      </div>
    </div>
  );
}
