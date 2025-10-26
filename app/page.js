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

        <div className="grid">
          <section className="pane">
            <h2 style={{margin:0}}>🔍 查找发音</h2>

            <label>单词</label>
            <input id="words" type="text" placeholder="例如：cat 或 information" />
            <div className="row" style={{marginTop:'12px'}}>
              <button className="btn" id="runBtn">开始对齐 ✅</button>
              <button className="btn ghost" id="clearBtn">清空结果</button>
            </div>


          </section>
        </div>
      <div className="card">
        <section className="pane">
          <h2 style={{margin:0}}>🎯 结果</h2>
          <div id="out" className="results"></div>
        </section>


      </div>
    </div>
  );
}
