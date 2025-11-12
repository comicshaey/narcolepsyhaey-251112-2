// 셀렉터/포맷
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
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const isSameOrBefore = (a, b) => a.getTime() <= b.getTime();
const isSameOrAfter = (a, b) => a.getTime() >= b.getTime();
const floor10 = (n) => Math.floor(n / 10) * 10; // 십원 단위 절삭
const dayToKoreaNum = (d) => { const w = d.getDay(); return w === 0 ? 7 : w; }; // 일요일=7

// 주(월~일) 키
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
  for (const it of arr) { const k = keyFn(it); (m[k] ||= []).push(it); }
  return m;
};
const hasAnyPlannedWork = (weekArr) => weekArr.some((it) => it.paidHours > 0);

// 요일 ID들
const DAY_IDS = ["mon","tue","wed","thu","fri","sat","sun"];
const DAY_HOUR_IDS = { mon:"#monHours", tue:"#tueHours", wed:"#wedHours", thu:"#thuHours", fri:"#friHours", sat:"#satHours", sun:"#sunHours" };

// 계산
const calc = () => {
  const start = parseDate($("#startDate")?.value);
  const end = parseDate($("#endDate")?.value);
  const hourly = Number($("#hourlyWage")?.value) || 0;

  // 휴게
  const breakEnabled = $("#breakEnabled")?.checked || false;
  const breakMinutes = Number($("#breakMinutes")?.value) || 0;
  const breakHours = breakEnabled ? Math.max(0, breakMinutes / 60) : 0;

  // 요일별 계획 읽기
  const workPlan = {};
  for (const id of DAY_IDS) {
    const checked = $(`#${id}`)?.checked || false;
    const rawHrs = Number($(DAY_HOUR_IDS[id])?.value) || 0;
    const paidHrs = checked ? Math.max(0, rawHrs - breakHours) : 0; // 휴게 반영 후
    workPlan[id] = { checked, rawHrs, paidHrs };
  }

  // 기본 검증
  if (!(start && end && isSameOrBefore(start, end)))
    return showResult({ msg:"기간을 확인해줘" });
  if (hourly <= 0)
    return showResult({ msg:"시급을 확인해줘" });
  const anyChecked = DAY_IDS.some((id) => workPlan[id].checked && workPlan[id].rawHrs > 0);
  if (!anyChecked)
    return showResult({ msg:"근무 요일과 시간을 입력해줘" });

  // 주 소정 근무시간
  const weeklyRaw = DAY_IDS.reduce((s,id)=> s + (workPlan[id].checked ? workPlan[id].rawHrs : 0), 0);
  const weeklyPaid = DAY_IDS.reduce((s,id)=> s + (workPlan[id].checked ? workPlan[id].paidHrs : 0), 0);

  // 기간 내 날짜별 레코드
  const mapIdxToKey = ["","mon","tue","wed","thu","fri","sat","sun"];
  const daysArr = [];
  for (let d = new Date(start); isSameOrBefore(d, end); d = addDays(d, 1)) {
    const kn = dayToKoreaNum(d);
    const key = mapIdxToKey[kn];
    const plan = workPlan[key];
    const planned = !!(plan.checked && plan.rawHrs > 0);
    const paid = planned ? plan.paidHrs : 0;

    daysArr.push({
      date: new Date(d),
      ymd: ymd(d),
      weekNoKey: weekKeyMonToSun(d),
      isSunday: kn === 7,
      planned,
      paidHours: paid,
    });
  }

  // 실근로일 수
  const workDayCount = daysArr.filter((it) => it.paidHours > 0).length;

  // 기본급
  const baseHours = daysArr.reduce((s, it) => s + it.paidHours, 0);
  const basePay = floor10(baseHours * hourly);

  // 주휴수당
  const weeks = groupBy(daysArr, (it) => it.weekNoKey);
  let jhuRawSum = 0;
  let jhuDaysCount = 0;

  for (const wkKey of Object.keys(weeks)) {
    const wk = weeks[wkKey];
    const weeklyHours = wk.reduce((s, it) => s + it.paidHours, 0);
    const weeklyWorkDays = wk.filter((it) => it.paidHours > 0).length;

    const nextKey = nextWeekKeyOf(wkKey);
    const hasNext = Object.prototype.hasOwnProperty.call(weeks, nextKey)
      ? hasAnyPlannedWork(weeks[nextKey])
      : false;

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

  // 총액/잔액
  const total = basePay + jhuPay;
  const budget = Number($("#budget")?.value) || 0;
  const remain = budget - total;

  // 표시
  showResult({
    basePay, jhuPay, total, remain,
    workDays: workDayCount, jhuDays: jhuDaysCount,
    weeklyRaw, weeklyPaid,
    msg: ""
  });
};

// 결과 표시
const showResult = (o) => {
  const {
    basePay=0, jhuPay=0, total=0, remain=0,
    workDays=0, jhuDays=0, weeklyRaw=0, weeklyPaid=0, msg=""
  } = o || {};

  const paidDays = workDays + jhuDays;
  const lineEl = $("#outDaysLine");
  if (lineEl) lineEl.textContent = `실근로일 ${workDays}일 + 유급주휴일 ${jhuDays}일 = 총 ${paidDays}일`;

  const set = (sel, val) => { const el = $(sel); if (el) el.textContent = fmt(val); };
  set("#outWeeklyRaw", weeklyRaw);          // 시간 단위 그대로 표시
  set("#outWeeklyPaid", weeklyPaid);        // 휴게 반영된 유급 기준
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

// 바인딩
document.addEventListener("DOMContentLoaded", () => {
  const btn = $("#btnCalc");
  if (btn) btn.addEventListener("click", (e) => { e.preventDefault(); calc(); });

  // 체크 해제 시 시간 0으로
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