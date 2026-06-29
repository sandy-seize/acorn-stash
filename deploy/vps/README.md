# 토스 시세 갱신 — 한국 VPS 상시 러너

맥이 꺼져 있어도 종목 모니터가 자동 갱신되도록, **고정 IP를 가진 한국 VPS**가
토스 Open API를 직접 호출해 Neon DB에 적재한다. Vercel 앱은 그 DB를 읽기만 한다.

> **왜 VPS인가?** 토스 Open API 키는 **IP 화이트리스트**라 Vercel·GitHub 같은
> 데이터센터 IP는 `403 IP address not allowed`. 등록한 고정 IP에서만 호출이 된다.
> 프록시를 따로 두느니, 그 고정 IP 서버가 직접 갱신까지 하는 게 가장 단순하다.

## 1. VPS 만들기 (택1, 고정 IP 포함)

| 제공업체 | 사양/요금(대략) | 비고 |
|---|---|---|
| **Vultr — Seoul** | $5~6/mo, 1vCPU/1GB | 가입 즉시 고정 IPv4. 추천 |
| **AWS Lightsail — Seoul** | $5/mo, 1GB | 고정 IP 무료 연결 |
| **Cafe24 / Gabia / iwinv** | 월 5천~1만원대 | 국내 결제·한국 IP 확실 |

- OS: **Ubuntu 22.04/24.04 LTS**
- 인스턴스 생성 후 **공인 고정 IP**를 메모해 둔다.

## 2. 그 IP를 토스 콘솔 allowlist에 등록

[developers.tossinvest.com](https://developers.tossinvest.com) → 내 앱 → API 키 설정
→ **허용 IP**에 VPS 공인 IP 추가. (이게 빠지면 토큰 발급이 403)

## 3. 셋업 (VPS에 SSH 접속 후)

```bash
sudo apt-get update && sudo apt-get install -y git
git clone https://github.com/sandy-seize/acorn-stash.git ~/acorn-stash
cd ~/acorn-stash

# 환경변수 채우기 (DATABASE_URL = Vercel 과 동일, 토스 키 = 로테이션된 새 키 권장)
cp deploy/vps/refresh.env.example .env.local
nano .env.local

# Node 설치 + 의존성 + 1회 테스트 + crontab 자동 등록
bash deploy/vps/setup.sh
```

성공하면 crontab에 두 줄이 등록된다:
- **시세** 30분마다 (`refresh:toss --no-fund`)
- **52주 고저** 매일 06:15 UTC = KST 15:15 (`refresh:toss`)

## 4. 동작 확인

```bash
tail -f ~/refresh-toss.log        # 갱신 로그
crontab -l                        # 등록 확인
npm run refresh:toss              # 수동 1회 (시세+52주)
```

라이브 반영: https://acorn-stash.vercel.app/stocks (업데이트 시각이 갱신됨)

## 참고

- 프록시 불필요: VPS 자체 IP가 allowlist라 `TOSS_HTTPS_PROXY`는 비워둔다.
- 키 로테이션 시: `.env.local`의 `TOSS_*`만 교체 (allowlist는 IP라 그대로 유효).
- VPS IP가 바뀌면(재생성 등) 2번 allowlist를 다시 등록.
