
// ===== DOM 요소 =====
const jobTypeEl = document.getElementById('jobType');
const startDateEl = document.getElementById('startDate');
const endDateEl = document.getElementById('endDate');

const holidayDaysPerWeekEl = document.getElementById('holidayDaysPerWeek');

const daysContainer = document.getElementById('daysContainer');
const monthConfigContainer = document.getElementById('monthConfigContainer');

// 결과 출력 요소
const workingDaysText = document.getElementById('workingDaysText');
const weeklyHoursText = document.getElementById('weeklyHoursText');
const weeklyHoursHintText = document.getElementById('weeklyHoursHintText');

const restPerDayText = document.getElementById('restPerDayText');
const restTotalText = document.getElementById('restTotalText');
const restRuleText = document.getElementById('restRuleText');

const holidayDaysText = document.getElementById('holidayDaysText');
const holidayCondText = document.getElementById('holidayCondText');
const holidayPerDayText = document.getElementById('holidayPerDayText');
const holidayTotalText = document.getElementById('holidayTotalText');
const holidayHintText = document.getElementById('holidayHintText');

const prorataText = document.getElementById('prorataText');
const prorataHintText = document.getElementById('prorataHintText');

const grandTotalText = document.getElementById('grandTotalText');

// ===== 유틸 함수 =====

// 숫자 → "12,345원"
function formatKRW(v) {
  if (v === null || v === undefined || isNaN(v)) return '-';
  return v.toLocaleString('ko-KR') + '원';
}

// yyyy-mm-dd → Date
function parseDate(v) {
  if (!v) return null;
  const [y, m, d] = v.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

// Date → yyyy-mm-dd
function ymd(d) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

// Date → "YYYY-MM"
function ymKey(d) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}`;
}

// 날짜 더하기
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// 월요일 기준 주 키
function weekKeyMonToSun(d) {
  const x = new Date(d);
  const dow = x.getDay(); // 0=일,1=월...
  const diffToMon = (dow === 0) ? -6 : (1 - dow);
  const mon = addDays(x, diffToMon);
  const z = (n) => String(n).padStart(2, '0');
  return `${mon.getFullYear()}-W${z(mon.getMonth() + 1)}${z(mon.getDate())}`;
}

// 주 키 → 다음주 키
function nextWeekKeyOf(weekKey) {
  const m = weekKey.match(/(\d{4})-W(\d{2})(\d{2})/);
  if (!m) return '';
  const y = +m[1];
  const mm = +m[2];
  const dd = +m[3];
  const mon = new Date(y, mm - 1, dd);
  const nextMon = addDays(mon, 7);
  const z = (n) => String(n).padStart(2, '0');
  return `${nextMon.getFullYear()}-W${z(nextMon.getMonth() + 1)}${z(nextMon.getDate())}`;
}

// 배열 그룹핑
function groupBy(arr, keyFn) {
  const m = {};
  for (const it of arr) {
    const k = keyFn(it);
    (m[k] ||= []).push(it);
  }
  return m;
}

function hasAnyPaidWork(arr) {
  return arr.some((it) => it.paidHours > 0);
}

// ===== 날짜별 근무 테이블 생성 =====

// 근무일 표 생성
function buildDaysTable() {
  daysContainer.innerHTML = '';

  const start = parseDate(startDateEl.value);
  const end = parseDate(endDateEl.value);

  if (!(start && end && end >= start)) {
    const p = document.createElement('p');
    p.className = 'hint';
    p.style.padding = '10px 12px';
    p.textContent = '근무 시작일자와 종료일자를 올바르게 입력하면 날짜 목록이 생성됩니다.';
    daysContainer.appendChild(p);
    return;
  }

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  ['날짜', '요일', '근무 여부', '유급 근로시간(시간)'].forEach((txt) => {
    const th = document.createElement('th');
    th.textContent = txt;
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  const weekdayNames = ['일', '월', '화', '수', '목', '금', '토'];

  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    const tr = document.createElement('tr');
    tr.className = 'day-row';

    const dateStr = ymd(d);
    tr.dataset.date = dateStr;
    tr.dataset.weekKey = weekKeyMonToSun(d);
    tr.dataset.isSunday = d.getDay() === 0 ? '1' : '0';
    tr.dataset.ymKey = ymKey(d);

    const tdDate = document.createElement('td');
    tdDate.textContent = dateStr;
    tr.appendChild(tdDate);

    const tdWeekday = document.createElement('td');
    tdWeekday.textContent = weekdayNames[d.getDay()] + '요일';
    tr.appendChild(tdWeekday);

    const tdCheck = document.createElement('td');
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.className = 'day-check';
    tdCheck.appendChild(chk);
    tr.appendChild(tdCheck);

    const tdHours = document.createElement('td');
    const hours = document.createElement('input');
    hours.type = 'number';
    hours.className = 'day-hours';
    hours.step = '0.5';
    hours.min = '0';
    hours.value = '0';
    hours.disabled = true;
    tdHours.appendChild(hours);
    tr.appendChild(tdHours);

    // 체크 여부에 따라 시간 입력 활성화
    chk.addEventListener('change', () => {
      hours.disabled = !chk.checked;
      if (!chk.checked) hours.value = '0';
      recalc();
    });

    hours.addEventListener('input', () => {
      recalc();
    });

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  daysContainer.appendChild(table);
}

// ===== 달별 인건비 설정 테이블 생성 =====

// 기간에 걸친 "YYYY-MM" 목록 만들기
function monthKeysBetween(start, end) {
  const keys = [];
  if (!(start && end && end >= start)) return keys;

  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cur <= lastMonth) {
    keys.push(ymKey(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return keys;
}

// 달별 설정 표 만들기
function buildMonthConfigTable() {
  monthConfigContainer.innerHTML = '';

  const start = parseDate(startDateEl.value);
  const end = parseDate(endDateEl.value);

  const keys = monthKeysBetween(start, end);
  if (keys.length === 0) {
    const p = document.createElement('p');
    p.className = 'hint';
    p.style.padding = '10px 12px';
    p.textContent = '근무 시작일자와 종료일자를 입력하면, 여기에 달별 설정 행이 나타납니다.';
    monthConfigContainer.appendChild(p);
    return;
  }

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  ['달(YYYY-MM)', '월 인건비 (청소원 일할계산용)', '기준 일수', '주휴수당 산정 기준 월 금액'].forEach((txt) => {
    const th = document.createElement('th');
    th.textContent = txt;
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  keys.forEach((k) => {
    const tr = document.createElement('tr');
    tr.className = 'month-row';
    tr.dataset.monthKey = k;

    const tdYm = document.createElement('td');
    tdYm.textContent = k;
    tbody.appendChild(tr);
    tr.appendChild(tdYm);

    const tdMonthlyPay = document.createElement('td');
    const inpMonthlyPay = document.createElement('input');
    inpMonthlyPay.type = 'number';
    inpMonthlyPay.min = '0';
    inpMonthlyPay.step = '10';
    inpMonthlyPay.className = 'month-monthlyPay';
    tdMonthlyPay.appendChild(inpMonthlyPay);
    tr.appendChild(tdMonthlyPay);

    const tdDays = document.createElement('td');
    const inpDays = document.createElement('input');
    inpDays.type = 'number';
    inpDays.min = '1';
    inpDays.max = '31';
    inpDays.step = '1';
    inpDays.className = 'month-monthDays';
    tdDays.appendChild(inpDays);
    tr.appendChild(tdDays);

    const tdHolidayMonthly = document.createElement('td');
    const inpHolidayMonthly = document.createElement('input');
    inpHolidayMonthly.type = 'number';
    inpHolidayMonthly.min = '0';
    inpHolidayMonthly.step = '10';
    inpHolidayMonthly.className = 'month-holidayMonthlyPay';
    tdHolidayMonthly.appendChild(inpHolidayMonthly);
    tr.appendChild(tdHolidayMonthly);

    // 입력 바뀔 때마다 재계산
    [inpMonthlyPay, inpDays, inpHolidayMonthly].forEach((el) => {
      el.addEventListener('input', () => recalc());
    });
  });

  table.appendChild(tbody);
  monthConfigContainer.appendChild(table);
}

// 달별 설정 값 읽어오기
function getMonthConfigMap() {
  const map = {};
  const rows = monthConfigContainer.querySelectorAll('.month-row');
  rows.forEach((row) => {
    const key = row.dataset.monthKey;
    const monthlyPayEl = row.querySelector('.month-monthlyPay');
    const monthDaysEl = row.querySelector('.month-monthDays');
    const holidayMonthlyPayEl = row.querySelector('.month-holidayMonthlyPay');

    const monthlyPay = parseFloat(monthlyPayEl.value) || 0;
    const monthDays = parseFloat(monthDaysEl.value) || 0;
    const holidayMonthlyPay = parseFloat(holidayMonthlyPayEl.value) || 0;

    map[key] = { monthlyPay, monthDays, holidayMonthlyPay };
  });
  return map;
}

// ===== 메인 계산 =====

function recalc() {
  const jobType = jobTypeEl.value;
  const holidayDaysPerWeek = parseInt(holidayDaysPerWeekEl.value, 10) || 1;

  // 날짜별 근무기록 수집
  const dayRows = daysContainer.querySelectorAll('.day-row');
  const daysArr = [];
  dayRows.forEach((row) => {
    const date = parseDate(row.dataset.date);
    const weekNoKey = row.dataset.weekKey;
    const isSunday = row.dataset.isSunday === '1';
    const ym = row.dataset.ymKey;
    const chk = row.querySelector('.day-check');
    const hoursInput = row.querySelector('.day-hours');

    const paidHours =
      chk && chk.checked ? Math.max(0, parseFloat(hoursInput.value) || 0) : 0;

    daysArr.push({
      date,
      weekNoKey,
      isSunday,
      ymKey: ym,
      paidHours,
    });
  });

  const anyPaid = daysArr.some((d) => d.paidHours > 0);
  const monthsConfig = getMonthConfigMap();

  // 아무 근무도 없으면 싹 리셋
  if (!anyPaid) {
    workingDaysText.textContent = '-';
    weeklyHoursText.textContent = '-';
    weeklyHoursHintText.textContent =
      '근무일과 근로시간을 입력하면 1주 15시간 요건 여부를 안내합니다.';

    restPerDayText.textContent = '-';
    restTotalText.textContent = '-';
    restRuleText.textContent =
      '방학중근무수당 규칙: 4시간 이하 1만원, 4시간 초과 2만원 (근무일과 시간을 먼저 입력하세요).';

    holidayDaysText.textContent = '-';
    holidayCondText.textContent =
      '근무기록이 없어서 주휴수당 요건을 판단할 수 없습니다.';
    holidayPerDayText.textContent = '-';
    holidayTotalText.textContent = '-';
    holidayHintText.textContent =
      '달별 주휴 기준 금액·기준일수·근무기록을 입력하면 주휴수당을 계산해줍니다.';

    prorataText.textContent = '-';
    prorataHintText.textContent =
      '청소원 선택 시, 근무일과 달별 인건비를 입력하면 일할계산 인건비를 보여줍니다.';

    grandTotalText.textContent = '-';
    return;
  }

  // ----- 1) 기본 통계 -----
  const workingDays = daysArr.filter((d) => d.paidHours > 0).length;
  workingDaysText.textContent = `${workingDays}일`;

  const weeksMap = groupBy(daysArr, (d) => d.weekNoKey);

  let maxWeeklyHours = 0;
  Object.keys(weeksMap).forEach((key) => {
    const wk = weeksMap[key];
    const sumH = wk.reduce((s, d) => s + d.paidHours, 0);
    if (sumH > maxWeeklyHours) maxWeeklyHours = sumH;
  });

  if (maxWeeklyHours > 0) {
    weeklyHoursText.textContent = `${maxWeeklyHours}시간`;
    if (maxWeeklyHours >= 15) {
      weeklyHoursHintText.textContent =
        '어느 한 주 이상에서 1주 15시간 이상 근무한 것으로 보입니다. 실제 주휴 요건 충족 여부는 다음 주 근무 예정·업무편람 사례를 함께 확인하세요.';
    } else {
      weeklyHoursHintText.textContent =
        '모든 주의 실근로시간이 15시간 미만으로, 원칙적으로 방학 중 유급 주휴 요건에 미달합니다.';
    }
  } else {
    weeklyHoursText.textContent = '-';
    weeklyHoursHintText.textContent =
      '근무일과 근로시간을 입력하면 1주 실근로시간 기준을 보여줍니다.';
  }

  let restTotal = 0;
  let holidayTotal = 0;
  let prorataTotal = 0;

  // ----- 2) 방학중근무수당 (조리직) -----
  if (jobType === 'cook' || jobType === 'cook-helper') {
    let firstRate = null;
    let sameRate = true;

    daysArr.forEach((d) => {
      if (d.paidHours > 0) {
        const rate = d.paidHours <= 4 ? 10000 : 20000;
        restTotal += rate;

        if (firstRate === null) firstRate = rate;
        else if (firstRate !== rate) sameRate = false;
      }
    });

    if (workingDays === 0) {
      restPerDayText.textContent = '-';
      restTotalText.textContent = '-';
      restRuleText.textContent =
        '방학중근무수당 규칙: 4시간 이하 1만원, 4시간 초과 2만원 (근무일과 시간을 먼저 입력하세요).';
    } else {
      if (sameRate && firstRate !== null) {
        restPerDayText.textContent = formatKRW(firstRate);
      } else {
        restPerDayText.textContent = '근무일마다 상이 (합계 기준)';
      }
      restTotalText.textContent = formatKRW(restTotal);
      restRuleText.textContent =
        '각 근무일의 유급 근로시간이 4시간 이하이면 10,000원, 4시간 초과이면 20,000원으로 일자별 합산했습니다. (조리직 기준)';
    }
  } else {
    restPerDayText.textContent = '-';
    restTotalText.textContent = '-';
    restRuleText.textContent =
      '특수운영직군 청소원은 방학중근무수당 규정보다는, 월급 일할계산으로 인건비를 산정하는 것으로 가정했습니다.';
  }

  // ----- 3) 주휴수당 / 청소원 일할계산 -----

  if (jobType === 'cleaner') {
    // 청소원: 주휴 X, 달별 일할계산
    holidayDaysText.textContent = '해당 없음';
    holidayCondText.textContent =
      '특수운영직군 청소원은 방학중비상시 직종 주휴 규정보다, 월급 일할계산으로 방학 근무분 인건비를 산정하는 것으로 가정했습니다.';
    holidayPerDayText.textContent = '-';
    holidayTotalText.textContent = '-';
    holidayHintText.textContent =
      '청소원은 이 칸에서 주휴수당을 별도로 산정하지 않습니다.';

    // 달별 근로일 수 집계
    const workDaysByMonth = {};
    daysArr.forEach((d) => {
      if (d.paidHours > 0) {
        workDaysByMonth[d.ymKey] = (workDaysByMonth[d.ymKey] || 0) + 1;
      }
    });

    let total = 0;
    Object.keys(workDaysByMonth).forEach((ym) => {
      const cfg = monthsConfig[ym];
      if (!cfg) return;
      const { monthlyPay, monthDays } = cfg;
      const cnt = workDaysByMonth[ym];

      if (monthlyPay > 0 && monthDays > 0 && cnt > 0) {
        const perDay = monthlyPay / monthDays;
        const subTotal = Math.round(perDay * cnt);
        total += subTotal;
      }
    });

    if (total > 0) {
      prorataTotal = total;
      prorataText.textContent = formatKRW(prorataTotal);
      prorataHintText.textContent =
        '각 달별로 [월 인건비 ÷ 기준 일수 × 그 달 근로일수]를 계산해 합산했습니다.';
    } else {
      prorataText.textContent = '-';
      prorataHintText.textContent =
        '각 달의 월 인건비와 기준 일수, 그리고 근로일수를 입력하면 청소원 인건비 일할계산을 해줍니다.';
    }
  } else {
    // 조리직: 주휴수당 계산
    const holidayDates = []; // 실제 주휴일(토/일) 날짜 목록

    Object.keys(weeksMap).forEach((key) => {
      const wk = weeksMap[key];
      const weeklyHours = wk.reduce((s, d) => s + d.paidHours, 0);
      const weeklyWorkDays = wk.filter((d) => d.paidHours > 0).length;

      const nextKey = nextWeekKeyOf(key);
      const hasNext = Object.prototype.hasOwnProperty.call(weeksMap, nextKey)
        ? hasAnyPaidWork(weeksMap[nextKey])
        : false;

      const sunday = wk.find((d) => d.date.getDay() === 0);
      const saturday = wk.find((d) => d.date.getDay() === 6);

      const sundayInside = !!sunday;

      // 주휴 요건: 1주 15시간 이상 + 다음 주 근무 예정 + 해당 주에 주휴일이 실제로 존재
      if (weeklyHours >= 15 && weeklyWorkDays > 0 && hasNext && sundayInside) {
        if (holidayDaysPerWeek === 1) {
          if (sunday) holidayDates.push(sunday.date);
        } else {
          if (saturday) holidayDates.push(saturday.date);
          if (sunday) holidayDates.push(sunday.date);
        }
      }
    });

    // 달별 주휴일 수 집계
    const holidayDaysByMonth = {};
    holidayDates.forEach((d) => {
      const key = ymKey(d);
      holidayDaysByMonth[key] = (holidayDaysByMonth[key] || 0) + 1;
    });

    const totalHolidayDays = Object.values(holidayDaysByMonth).reduce(
      (s, n) => s + n,
      0
    );

    if (totalHolidayDays > 0) {
      holidayDaysText.textContent = `${totalHolidayDays}일`;
      holidayCondText.textContent =
        '근무기록 기준으로 1주 15시간 이상 + 다음 주 근무 예정 요건을 충족하는 주의 주휴일을, 실제 해당 달별로 분배하여 합산했습니다.';
    } else {
      holidayDaysText.textContent = '-';
      holidayCondText.textContent =
        '입력된 근무기록 상 1주 15시간 이상 근무 + 다음 주 근무 예정 요건을 충족한 주가 없거나, 주휴일이 포함되지 않은 것으로 보입니다.';
    }

    // 달별 주휴수당 계산
    let totalJhu = 0;
    let singlePerDay = null;
    const monthKeys = Object.keys(holidayDaysByMonth);

    monthKeys.forEach((ym) => {
      const cfg = monthsConfig[ym];
      if (!cfg) return;
      const { monthlyPay, monthDays, holidayMonthlyPay } = cfg;
      const baseForHoliday =
        holidayMonthlyPay > 0 ? holidayMonthlyPay : monthlyPay;
      const cnt = holidayDaysByMonth[ym];

      if (baseForHoliday > 0 && monthDays > 0 && cnt > 0) {
        const perDay = baseForHoliday / monthDays;
        const subTotal = Math.round(perDay * cnt);
        totalJhu += subTotal;

        // 한 달만 포함된 경우에만 1일 금액 표시용
        if (monthKeys.length === 1) {
          singlePerDay = perDay;
        }
      }
    });

    if (totalJhu > 0) {
      holidayTotal = totalJhu;
      holidayTotalText.textContent = formatKRW(holidayTotal);

      if (monthKeys.length === 1 && singlePerDay !== null) {
        holidayPerDayText.textContent = formatKRW(Math.round(singlePerDay));
        holidayHintText.textContent =
          '해당 달의 “주휴수당 산정 기준 월 금액”을 기준으로, 기준 일수로 나눠 1일 주휴수당을 계산했습니다.';
      } else {
        holidayPerDayText.textContent = '월별 상이 (합계 기준)';
        holidayHintText.textContent =
          '두 달 이상에 걸쳐 있어, 달별 주휴 기준 금액/기준일수가 달라 1일 금액은 월별로 상이합니다.';
      }
    } else {
      holidayTotalText.textContent = '-';
      holidayPerDayText.textContent = '-';
      holidayHintText.textContent =
        '각 달의 주휴 기준 금액·기준 일수·주휴일 수가 모두 충족되면 주휴수당을 계산해줍니다.';
    }

    // 조리직일 때는 청소원 칸 비활성 느낌
    prorataText.textContent = '-';
    prorataHintText.textContent =
      '조리사·조리실무사는 방학중근무수당 + 주휴수당을 기준으로 인건비를 산정하는 것으로 가정했습니다.';
  }

  // ----- 4) 총 인건비 합산 -----
  let grandTotal = 0;
  if (jobType === 'cleaner') {
    grandTotal = prorataTotal;
  } else {
    grandTotal = restTotal + holidayTotal;
  }

  grandTotalText.textContent =
    grandTotal > 0 ? formatKRW(grandTotal) : '-';
}

// ===== 이벤트 바인딩 =====

// 날짜 변경 → 근무표 + 달별 설정표 재생성 후 재계산
[startDateEl, endDateEl].forEach((el) => {
  el.addEventListener('change', () => {
    buildDaysTable();
    buildMonthConfigTable();
    recalc();
  });
});

// 직종, 주휴일 수 변경 → 재계산
[jobTypeEl, holidayDaysPerWeekEl].forEach((el) => {
  el.addEventListener('change', () => recalc());
});

// 초기 호출
buildDaysTable();
buildMonthConfigTable();
recalc();