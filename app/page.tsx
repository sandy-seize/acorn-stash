import Link from "next/link";

const css = `
.stage{min-height:90vh;display:flex;align-items:center;justify-content:center;padding:32px 18px;
  --pink-900:#9D174D;--pink-700:#BE185D;--pink-600:#EC4899;--pink-500:#F472B6;--pink-400:#F9A8D4;
  --pink-300:#FBCFE8;--pink-200:#FCE7F3;--pink-100:#FDF2F8;--pink-50:#FFF5F8;
  --paper:#FFFDFB;--text-2:#4A4A55;--text-3:#8A8A95;--line:#F2D9E5;--margin-line:#F472B6;
  --hole:#F7EEE8;--hole-shadow:rgba(0,0,0,.18);}
.notebook{position:relative;width:100%;max-width:440px;background:var(--paper);border-radius:6px 18px 18px 6px;
  padding:38px 30px 36px 64px;
  box-shadow:0 1px 2px rgba(0,0,0,.04),0 14px 44px rgba(190,24,93,.12),inset 1px 0 0 rgba(244,114,182,.15);
  background-image:linear-gradient(to right,transparent 50px,var(--margin-line) 50px,var(--margin-line) 51px,transparent 51px),
    repeating-linear-gradient(transparent 0 32px,var(--line) 32px 33px);
  background-position:0 0,0 64px;background-repeat:no-repeat,repeat-y;}
.notebook::before{content:'';position:absolute;left:0;top:0;bottom:0;width:14px;
  background:linear-gradient(to right,rgba(0,0,0,.05),transparent);border-radius:6px 0 0 6px;}
.rings{position:absolute;left:18px;top:30px;bottom:30px;width:14px;display:flex;flex-direction:column;
  justify-content:space-between;pointer-events:none;}
.rings span{width:14px;height:14px;border-radius:50%;background:var(--hole);
  box-shadow:inset 0 1px 2px var(--hole-shadow),inset 0 -1px 1px rgba(255,255,255,.6);border:1px solid rgba(190,24,93,.12);}
.stamp{display:inline-block;background:var(--pink-600);color:#fff;padding:5px 14px;border-radius:99px;
  font-size:11px;font-weight:800;letter-spacing:2.5px;margin-bottom:18px;transform:rotate(-3deg);
  box-shadow:0 2px 8px rgba(236,72,153,.3);}
.notebook h1{font-size:24px;font-weight:800;letter-spacing:-.5px;color:var(--pink-900);line-height:1.3;}
.notebook .lead{margin-top:14px;font-size:13.5px;color:var(--text-2);line-height:1.7;}
.notebook .lead b{color:var(--pink-700);font-weight:700;}
.reports-mini{margin-top:24px;display:flex;flex-direction:column;gap:10px;}
.report-link{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;
  background:linear-gradient(135deg,var(--pink-50) 0%,var(--pink-100) 100%);border:1px solid var(--pink-200);
  border-radius:12px;transition:transform .15s,box-shadow .15s,border-color .15s;}
.report-link:hover{transform:translateY(-1px);border-color:var(--pink-400);box-shadow:0 6px 18px rgba(236,72,153,.15);}
.report-link .l{font-size:13px;font-weight:700;color:var(--pink-900);letter-spacing:-.2px;}
.report-link .l small{display:block;font-size:10.5px;font-weight:500;color:var(--text-3);margin-top:2px;letter-spacing:0;}
.report-link .arrow{font-size:18px;color:var(--pink-600);font-weight:800;flex:none;transition:transform .15s;}
.report-link:hover .arrow{transform:translateX(3px);}
.foot{margin-top:30px;padding-top:18px;border-top:1px dashed var(--pink-200);font-size:11px;color:var(--text-3);
  text-align:right;letter-spacing:.2px;}
`;

export default function HomePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="stage">
        <div className="notebook">
          <div className="rings">
            <span /><span /><span /><span /><span /><span /><span />
          </div>

          <div className="stamp">ACORN</div>

          <h1>세니의 도토리 모으기</h1>
          <p className="lead">
            <b>🌰 종목·원자재 리서치와 투자 도구</b>를 한곳에.<br />
            아래에서 바로 이동해 보세요.
          </p>

          <div className="reports-mini">
            <a className="report-link" href="https://www.tossinvest.com" target="_blank" rel="noopener noreferrer">
              <div className="l">
                📈 종목 모니터
                <small>토스증권 바로가기 · 관심 종목 가격·등락 한눈에</small>
              </div>
              <span className="arrow">→</span>
            </a>
            <a className="report-link" href="/vr">
              <div className="l">
                🧮 VR법 운용 비서
                <small>도구 · 밸류 리밸런싱 일일 매수/매도 지시</small>
              </div>
              <span className="arrow">→</span>
            </a>
            <Link className="report-link" href="/auto">
              <div className="l">
                🤖 자동매매 (dry-run)
                <small>도구 · VR·무한매수·DCA 전략 실행 · Toss 연동 토대</small>
              </div>
              <span className="arrow">→</span>
            </Link>
            <a className="report-link" href="/fcx">
              <div className="l">
                FCX · 구리 산업 동향
                <small>2026-05-02 · 미장 peer 6사 비교</small>
              </div>
              <span className="arrow">→</span>
            </a>
          </div>

          <div className="foot">♡ 도토리 한 알도 신중하게 🌰</div>
        </div>
      </div>
    </>
  );
}
