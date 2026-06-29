/**
 * 토스증권 Open API → vr_* 실시세·펀더멘털 적재 (로컬 수동 실행).
 *
 *   npm run refresh:toss              # 시세 + 52주 고저
 *   npm run refresh:toss -- --no-fund # 시세만
 *
 * 자격증명: TOSS_API_KEY / TOSS_SECRET_KEY (env 또는 ~/.zshrc 폴백).
 * DB: DATABASE_URL (.env.local) — em-research 공유 Neon, vr_* 만 건드림.
 * 공용 로직은 lib/toss/refresh.ts (cron 라우트와 동일).
 */
import { refreshTossPrices } from "../lib/toss/refresh";

async function main() {
  const fundamentals = !process.argv.includes("--no-fund");
  console.log(`토스 시세 갱신 시작 (펀더멘털 ${fundamentals ? "포함" : "제외"})…`);

  const r = await refreshTossPrices({ fundamentals });

  console.log(`적재 종목: ${r.priced}/${r.symbols}`);
  if (r.filled.length) console.log(`  source→toss: ${r.filled.join(", ")}`);
  if (fundamentals) console.log(`  52주 고저: ${r.fundamentals}종목`);
  if (r.skipped.length) console.log(`  스킵(시세 없음): ${r.skipped.join(", ")}`);
  for (const w of r.warnings) console.warn(`  ⚠️ ${w}`);
  console.log("✅ 완료.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
