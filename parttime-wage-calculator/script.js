
// 셀렉터/포맷 헬퍼
const $ = (sel) => document.querySelector(sel);
const fmt = (n) => Number(n || 0).toLocaleString("ko-KR");

// 날짜 유틸
const ymd = (d) => {
  const z = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};
const parseDate = (v) => {
  if (!v) return null;
  const [y, m, d] = v.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const isSameOrBefore = (a, b) => a.getTime() <= b.getTime();
const isSameOrAfter = (a, b) => a.getTime() >= b.getTime();
const floor10 = (n) => Math.floor(n / 10) * 10; // 십원 단위 절삭
const dayToKoreaNum = (d) => {
  const w = d.getDay();
  return w === 0 ? 7 : w; // 일요일=7
};

// 주(월~일) 구분 키
const weekKeyMonToSun = (d) => {
  const x = new Date(d);
  const dow = x.getDay();
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const monday = addDays(x, diffToMon);
  const mm = String(monday.getMonth() + 1).padStart(2, "0");
  const dd = String(monday.getDate()).padStart(2, "0");
  return `${monday.getFullYear()}-W${mm}${dd}`;
};
const nextWeekKeyOf = (weekKey) => {
  const m = weekKey.match(/(\d{4})-W(\d{2})(\d{2})/);
  if (!m) return "";
  const y = +m[1], mm = +m[2], dd = +m[3];
  const mon = new Date(y, mm - 1, dd);
  const nextMon = addDays(mon, 7);
  const nmm = String(nextMon.getMonth() + 1).padStart(2, "0");
  const ndd = String(nextMon.getDate()).padStart(2, "0");
  return `${nextMon.getFullYear()}-W${nmm}${ndd}`;
};
const groupBy = (arr, keyFn) => {
  const m = {};
  for (const it of arr) {
    const k = keyFn(it);
    (m[k] ||= []).push(it);
  }
  return m;
};
const hasAnyPlannedWork = (weekArr) => weekArr.some((it) => it.paidHours > 0);

// 요일 ID와 대응되는 시간 입력 ID
const DAY_IDS = ["mon","tue","wed","thu","fri","sat","sun"];
const DAY_HOUR_IDS = {
  mon: "#monHours",
  tue: "#tueHours",
  wed: "#wedHours",
  thu: "#thuHours",
  fri: "#friHours",
  sat: "#satHours",
  sun: "#sunHours",
};

// 계산 본체 (버튼 클릭 때만 호출)
const calc = () => {
  // 날짜/시급
  const start = parseDate($("#startDate")?.value);
  const end = parseDate($("#endDate")?.value);
  const hourly = Number($("#hourlyWage")?.value) || 0;

  // 휴게시간 설정
  const breakEnabled = $("#breakEnabled")?.checked || false;
  const breakMinutes = Number($("#breakMinutes")?.value) || 0;
  const breakHours = breakEnabled ? Math.max(0, breakMinutes / 60) : 0;

  // 요일별 계획 근로시간 읽기
  const workPlan = {}; // {mon:{checked:boolean, hours:number}, ...}
  for (const id of DAY_IDS) {
    const checked = $(`#${id}`)?.checked || false;
    const rawHrs = Number($(DAY_HOUR_IDS[id])?.value) || 0;
    // 휴게시간 차감 후 유급시간 (음수 방지)
    const paidHrs = checked ? Math.max(0, rawHrs - breakHours) : 0;
    workPlan[id] = { checked, rawHrs, paidHrs };
  }

  // 입력 검증
  if (!(start && end && isSameOrBefore(start, end)))
    return showResult(0, 0, 0, 0, 0, 0, "기간을 확인해줘");
  if (hourly <= 0)
    return showResult(0, 0, 0, 0, 0, 0, "시급을 확인해줘");
  const anyChecked = DAY_IDS.some((id) => workPlan[id].checked && workPlan[id].rawHrs > 0);
  if (!anyChecked)
    return showResult(0, 0, 0, 0, 0, 0, "근무 요일과 시간을 입력해줘");

  // 기간 내 날짜별 레코드 생성
  const mapIdxToKey = ["","mon","tue","wed","thu","fri","sat","sun"]; // 1~7
  const daysArr = [];
  for (let d = new Date(start); isSameOrBefore(d, end); d = addDays(d, 1)) {
    const kn = dayToKoreaNum(d);              // 1=월 ... 7=일
    const key = mapIdxToKey[kn];              // "mon" ..."sun"
    const plan = workPlan[key];
    const planned = !!(plan.checked && plan.rawHrs > 0);
    const paid = planned ? plan.paidHrs : 0;

    daysArr.push({
      date: new Date(d),
      ymd: ymd(d),
      weekNoKey: weekKeyMonToSun(d),
      isSunday: kn === 7,
      planned,
      paidHours: paid, // 휴게 반영 후
    });
  }

  // 실근로일 수
  const workDayCount = daysArr.filter((it) => it.planned && it.paidHours > 0).length;

  // 기본급 (총 유급시간 × 시급, 십원 절삭)
  const baseHours = daysArr.reduce((s, it) => s + it.paidHours, 0);
  const basePay = floor10(baseHours * hourly);

  // 주휴수당 계산
  // 규칙: (1) 해당 주의 유급 근로시간 합 >= 15시간
  //      (2) 다음 주에도 계획 근로가 있어야 함 (계속 근로 요건)
  //      (3) 해당 주에 일요일이 기간 안에 존재해야 함 (주차 닫힘 기준)
  //      지급액 = 그 주의 "평균 일일 유급시간(=유급시간합/실근로일수)" × 시급
  const weeks = groupBy(daysArr, (it) => it.weekNoKey);
  let jhuRawSum = 0;
  let jhuDaysCount = 0;

  for (const wkKey of Object.keys(weeks)) {
    const wk = weeks[wkKey];

    // 주간 유급시간 합계와 실근로일수
    const weeklyHours = wk.reduce((s, it) => s + it.paidHours, 0);
    const weeklyWorkDays = wk.filter((it) => it.paidHours > 0).length;

    // 다음 주 계속근로 여부
    const nextKey = nextWeekKeyOf(wkKey);
    const hasNext = Object.prototype.hasOwnProperty.call(weeks, nextKey)
      ? hasAnyPlannedWork(weeks[nextKey])
      : false;

    // 해당 주의 일요일이 기간 내 존재하는지
    const sundayInside = wk.some(
      (it) => it.isSunday && isSameOrAfter(it.date, start) && isSameOrBefore(it.date, end)
    );

    if (weeklyHours >= 15 && hasNext && sundayInside && weeklyWorkDays > 0) {
      const avgDailyPaidHrs = weeklyHours / weeklyWorkDays;
      jhuRawSum += avgDailyPaidHrs * hourly;
      jhuDaysCount += 1;
    }
  }
  const jhuPay = floor10(jhuRawSum);

  // 총액 / 잔액
  const total = basePay + jhuPay;
  const budget = Number($("#budget")?.value) || 0;
  const remain = budget - total;

  showResult(basePay, jhuPay, total, remain, workDayCount, jhuDaysCount, "");
};

// 결과 표시
const showResult = (basePay, jhuPay, total, remain, workDays, jhuDays, msg) => {
  const paidDays = workDays + jhuDays;
  const lineEl = $("#outDaysLine");
  if (lineEl) lineEl.textContent = `실근로일 ${workDays}일 + 유급주휴일 ${jhuDays}일 = 총 ${paidDays}일`;

  const set = (sel, val) => { const el = $(sel); if (el) el.textContent = fmt(val); };
  set("#outBase", basePay);
  set("#outJhu", jhuPay);
  set("#outTotal", total);

  const r = $("#outRemain");
  if (r) {
    r.textContent = fmt(remain);
    r.style.color = remain < 0 ? "red" : "#111";
    r.style.fontWeight = remain < 0 ? "700" : "500";
  }
  const msgEl = $("#outMsg");
  if (msgEl) msgEl.textContent = msg || "";
};

// 바인딩 (버튼 눌러야만 계산)
document.addEventListener("DOMContentLoaded", () => {
  const btn = $("#btnCalc");
  if (btn) btn.addEventListener("click", (e) => { e.preventDefault(); calc(); });

  // 체크 해제 시 시간 0으로 만드는 소소한 UX (사람손맛)
  const pairs = [
    ["mon","#monHours"],["tue","#tueHours"],["wed","#wedHours"],
    ["thu","#thuHours"],["fri","#friHours"],["sat","#satHours"],["sun","#sunHours"],
  ];
  for (const [id, sel] of pairs) {
    const box = $(`#${id}`);
    const inp = $(sel);
    if (box && inp) {
      box.addEventListener("change", ()=>{
        if (!box.checked) inp.value = 0;
      });
    }
  }
});
