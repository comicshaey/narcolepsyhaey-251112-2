# 귀여운 고주무관의 업무 효율화 웹사이트

`edusprouthaey.co.kr` 도메인으로 배포하는 **정적 GitHub Pages** 사이트입니다.  
홈에서 3개 카테고리로 이동할 수 있습니다.

## 카테고리
1. **운동부지도자 초과근무수당 계산기** — 법내/법외·휴일·야간 가중치 설정, 합계 및 엑셀 내보내기
2. **공무직 연차유급휴가 및 연차수당 계산기** — 기본 산정 + 기관별 보정, 연차수당 계산 및 엑셀 내보내기
3. **학교장 임용권자 2025학년도 임금대장** — 지급/공제/차인지급액 자동 집계 및 엑셀 내보내기

## 디렉터리 구조
```
/
├─ index.html
├─ 404.html
├─ CNAME                    # edusprouthaey.co.kr
├─ static/
│  ├─ styles.css
│  └─ favicon.png
├─ coach-ot/
│  ├─ index.html
│  └─ script.js
├─ annual-leave/
│  ├─ index.html
│  └─ script.js
└─ wage-ledger-2025/
   ├─ index.html
   └─ script.js
```

## 배포 설정 (GitHub Pages)
1. 레포 **Settings → Pages**
2. **Build and deployment:** *Deploy from a branch*
3. **Branch:** `main` / **Folder:** `/ (root)`
4. **Custom domain:** `edusprouthaey.co.kr` → **Enforce HTTPS** 체크

> `/docs` 폴더 배포를 쓰는 경우에는, 위 전체 파일을 `docs/` 폴더로 이동한 뒤 Pages에서 Folder를 `/docs`로 지정하세요.

## DNS (가비아 등)
- A 레코드 4개 (apex 도메인):
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`
- AAAA 레코드 4개(선택):
  - `2606:50c0:8000::153`
  - `2606:50c0:8001::153`
  - `2606:50c0:8002::153`
  - `2606:50c0:8003::153`

## 제작자/연락처
- **제작자:** 귀여운 고주무관
- **Contact:** edusproutcomics@naver.com

> 업무 효율화를 위해 작업 중인 개인적인 토이 프로젝트이며, 도교육청 및 교육지원청 공식 배포 사이트가 아니니 참고하여주시기 바랍니다.