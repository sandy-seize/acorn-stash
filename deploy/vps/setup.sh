#!/usr/bin/env bash
# acorn-stash 토스 시세 갱신 러너 — 한국 VPS(Ubuntu/Debian) 셋업.
# 이 VPS 의 고정 IP 가 토스 콘솔 allowlist 에 등록돼 있어야 토큰 발급이 됩니다.
#
#   bash deploy/vps/setup.sh
#
# 하는 일: Node 설치 → repo 의존성 → .env.local 확인 → 1회 테스트 → crontab 등록
# (시세 30분마다 / 52주 펀더멘털 매일 06:15 UTC = KST 15:15).
set -euo pipefail

REPO_DIR="${REPO_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$REPO_DIR"
echo "▶ repo: $REPO_DIR"

# 1) Node 18+ 설치
need_node=1
if command -v node >/dev/null 2>&1; then
  major="$(node -v | sed 's/^v//; s/\..*//')"
  [ "$major" -ge 18 ] && need_node=0
fi
if [ "$need_node" -eq 1 ]; then
  echo "▶ Node 20 설치…"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "▶ node $(node -v) / npm $(npm -v)"

# 2) 의존성
echo "▶ npm install…"
npm install --no-audit --no-fund

# 3) .env.local 확인
if [ ! -f .env.local ]; then
  echo "⚠️  .env.local 이 없습니다. 아래로 만들고 값을 채운 뒤 다시 실행하세요:"
  echo "      cp deploy/vps/refresh.env.example .env.local && nano .env.local"
  exit 1
fi
for k in DATABASE_URL TOSS_API_KEY TOSS_SECRET_KEY; do
  grep -q "^$k=" .env.local || { echo "⚠️  .env.local 에 $k 누락"; exit 1; }
done

# 4) 1회 테스트 (시세만 — 빠름)
echo "▶ 테스트 갱신 (시세만)…"
npm run refresh:toss -- --no-fund

# 5) crontab 등록 (cron 의 빈약한 PATH 보강)
NPM_BIN="$(command -v npm)"
NODE_DIR="$(dirname "$(command -v node)")"
LOG="$HOME/refresh-toss.log"
PATH_LINE="PATH=$NODE_DIR:/usr/local/bin:/usr/bin:/bin"
CRON_PRICE="*/30 * * * * cd $REPO_DIR && $NPM_BIN run refresh:toss -- --no-fund >> $LOG 2>&1"
CRON_FUND="15 6 * * * cd $REPO_DIR && $NPM_BIN run refresh:toss >> $LOG 2>&1"

# 기존 acorn-stash 항목 제거 후 재등록(멱등)
{
  crontab -l 2>/dev/null | grep -v 'refresh:toss' | grep -v "^PATH=$NODE_DIR"
  echo "$PATH_LINE"
  echo "$CRON_PRICE"
  echo "$CRON_FUND"
} | crontab -

echo "✅ 완료. crontab:"
crontab -l | grep -E 'refresh:toss|^PATH='
echo "로그: tail -f $LOG"
