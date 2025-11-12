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
const floor10 = (n) => Math.floor(n / 10) * 10;
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
  const y = +m[1],
    mm = +m[2],
    dd = +m[3];
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

// 계산 본체 (버튼 클릭 때만 호출)
const calc = () => {
  const start = parseDate($("#startDate") && $("#startDate").value);
  const end = parseDate($("#endDate") && $("#endDate").value);
  const hourly = Number($("#hourlyWage") && $("#hourlyWage").value) || 0;
  const hoursPerDay = Number($("#hoursPerDay") && $("#hoursPerDay").value) || 0;
  const breakEnabled = ($("#breakEnabled") && $("#breakEnabled").checked) || false;
  const breakMinutes = Number($("#breakMinutes") && $("#breakMinutes").value) || 0;

  const ids = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const workDays = new Set(ids.filter((id) => { const el = $("#"+id); return el && el.checked; }));

  if (!(start && end && isSameOrBefore(start, end)))
    return showResult(0, 0, 0, 0, 0, 0, "기간을 확인해줘");
  if (hourly <= 0 || hoursPerDay <= 0)
    return showResult(0, 0, 0, 0, 0, 0, "시급/근로시간을 확인해줘");
  if (workDays.size === 0)
    return showResult(0, 0, 0, 0, 0, 0, "근무 요일을 하나 이상 선택해줘");

  // 휴게시간 반영
  const breakHours = breakEnabled ? Math.max(0, breakMinutes / 60) : 0;
  const paidHoursPerDay = Math.max(0, hoursPerDay - breakHours);

  // 기간 내 날짜 배열
  const daysArr = [];
  for (let d = new Date(start); isSameOrBefore(d, end); d = addDays(d, 1)) {
    const wn = dayToKoreaNum(d);
    const key = ["", "mon", "tue", "wed", "thu", "fri", "sat", "sun"][wn];
    const planned = workDays.has(key);
    daysArr.push({
      date: new Date(d),
      ymd: ymd(d),
      weekNoKey: weekKeyMonToSun(d),
      isSunday: wn === 7,
      planned,
      paidHours: planned ? paidHoursPerDay : 0,
    });
  }

  // 실근로일
  const workDayCount = daysArr.filter((it) => it.planned).length;

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
    const nextKey = nextWeekKeyOf(wkKey);
    const hasNext = Object.prototype.hasOwnProperty.call(weeks, nextKey)
      ? hasAnyPlannedWork(weeks[nextKey])
      : false;
    const sundayInside = wk.some(
      (it) => it.isSunday && isSameOrAfter(it.date, start) && isSameOrBefore(it.date, end)
    );
    if (weeklyHours >= 15 && hasNext && sundayInside) {
      jhuRawSum += paidHoursPerDay * hourly;
      jhuDaysCount += 1;
    }
  }
  const jhuPay = floor10(jhuRawSum);

  // 총액 / 잔액
  const total = basePay + jhuPay;
  const budget = Number($("#budget") && $("#budget").value) || 0;
  const remain = budget - total;

  showResult(basePay, jhuPay, total, remain, workDayCount, jhuDaysCount, "");
};

// 결과 표시
const showResult = (basePay, jhuPay, total, remain, workDays, jhuDays, msg) => {
  const paidDays = workDays + jhuDays;
  const lineEl = $("#outDaysLine");
  if (lineEl) lineEl.textContent = `실근로일 ${workDays}일 + 유급주휴일 ${jhuDays}일 = 총 ${paidDays}일`;

  const set = (id, val) => { const el = $(id); if (el) el.textContent = fmt(val); };
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
});
