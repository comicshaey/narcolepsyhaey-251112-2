
// ===== DOM 요소 모음 =====

// 기본 입력
const jobTypeEl = document.getElementById('jobType');
const startDateEl = document.getElementById('startDate');
const endDateEl = document.getElementById('endDate');

const monthlyPayEl = document.getElementById('monthlyPay');
const monthDaysEl = document.getElementById('monthDays');
const holidayDaysPerWeekEl = document.getElementById('holidayDaysPerWeek');

const wageBaseEl = document.getElementById('wageBase');
const wageMealEl = document.getElementById('wageMeal');
const wageExtraEl = document.getElementById('wageExtra');

const daysContainer = document.getElementById('daysContainer');

// 결과 출력
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

// 숫자를 "12,345원" 식으로 포맷
function formatKRW(value) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return value.toLocaleString('ko-KR') + '원';
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

// 하루 더하기
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// 주(월~일) 키 : "YYYY-WMMDD" (월요일 날짜 기반)
function weekKeyMonToSun(d) {
  const x = new Date(d);
  const dow = x.getDay(); // 0=일,1=월...
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const monday = addDays(x, diffToMon);
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${monday.getFullYear()}-W${mm}${dd}`;
}

// 다음 주 키
function nextWeekKeyOf(weekKey) {
  const m = weekKey.match(/(\d{4})-W(\d{2})(\d{2})/);
  if (!m) return '';
  const y = +m[1], mm = +m[2], dd = +m[3];
  const mon = new Date(y, mm - 1, dd);
  const nextMon = addDays(mon, 7);
  const nmm = String(nextMon.getMonth() + 1).padStart(2, '0');
  const ndd = String(nextMon.getDate()).padStart(2, '0');
  return `${nextMon.getFullYear()}-W${nmm}${ndd}`;
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

function hasAnyPaidWork(weekArr) {
  return weekArr.some((it) => it.paidHours > 0);
}

// 통상임금 세부항목 → 월 통상임금 칸 자동 합산
function recalcMonthlyFromItems() {
  const base = parseFloat(wageBaseEl.value) || 0;
  const meal = parseFloat(wageMealEl.value) || 0;
  const extra = parseFloat(wageExtraEl.value) || 0;
  const sum = base + meal + extra;
  if (sum > 0) {
    monthlyPayEl.value = String(Math.round(sum));
  }
}

// ===== 날짜 표 생성 =====

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

  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    const tr = document.createElement('tr');
    tr.className = 'day-row';

    const dateStr = ymd(d);
    const weekdayNames = ['일', '월', '화', '수', '목', '금', '토'];

    tr.dataset.date = dateStr;
    tr.dataset.weekKey = weekKeyMonToSun(d);
    tr.dataset.isSunday = d.getDay() === 0 ? '1' : '0';

    // 날짜
    const tdDate = document.createElement('td');
    tdDate.textContent = dateStr;
    tr.appendChild(tdDate);

    // 요일
    const tdWeekday = document.createElement('td');
    tdWeekday.textContent = weekdayNames[d.getDay()] + '요일';
    tr.appendChild(tdWeekday);

    // 체크박스
    const tdCheck = document.createElement('td');
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.className = 'day-check';
    tdCheck.appendChild(chk);
    tr.appendChild(tdCheck);

    // 시간 입력
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

    // 이벤트: 체크되면 시간 입력 활성화
    chk.addEventListener('change', () => {
      hours.disabled = !chk.checked;
      if (!chk.checked) {
        hours.value = '0';
      }
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

// ===== 메인 계산 =====

function recalc() {
  const jobType = jobTypeEl.value;

  // 통상임금 세부항목 합산
  recalcMonthlyFromItems();
  const monthlyPay = parseFloat(monthlyPayEl.value) || 0;
  const monthDays = parseFloat(monthDaysEl.value) || 0;
  const holidayDaysPerWeek = parseInt(holidayDaysPerWeekEl.value, 10) || 1;

  // 날짜별 근무정보 모으기
  const dayRows = daysContainer.querySelectorAll('.day-row');
  const daysArr = [];

  dayRows.forEach((row) => {
    const date = parseDate(row.dataset.date);
    const weekNoKey = row.dataset.weekKey;
    const isSunday = row.dataset.isSunday === '1';
    const chk = row.querySelector('.day-check');
    const hoursInput = row.querySelector('.day-hours');

    const paidHours =
      chk && chk.checked ? Math.max(0, parseFloat(hoursInput.value) || 0) : 0;

    daysArr.push({
      date,
      weekNoKey,
      isSunday,
      paidHours,
    });
  });

  // 근무일이 없으면 전부 초기화하고 종료
  const anyPaid = daysArr.some((d) => d.paidHours > 0);
  if (!anyPaid) {
    workingDaysText.textContent = '-';
    weeklyHoursText.textContent = '-';
    weeklyHoursHintText.textContent =
      '근무일과 근로시간을 입력하면 1주 15시간 요건 여부를 안내합니다.';

    restPerDayText.textContent = '-';
    restTotalText.textContent = '-';
    restRuleText.textContent =
      '방학중근무수당 규칙: 4시간 이하 1만원, 4시간 초과 2만원 (근무일과 시간을 먼저 입력하세요)';

    holidayDaysText.textContent = '-';
    holidayCondText.textContent =
      '근무기록이 없어서 주휴수당 요건을 판단할 수 없습니다.';
    holidayPerDayText.textContent = '-';
    holidayTotalText.textContent = '-';
    holidayHintText.textContent =
      '월 통상임금과 기준 일수, 근무기록을 입력하면 주휴수당을 계산해줍니다.';

    prorataText.textContent = '-';
    prorataHintText.textContent =
      '청소원 선택 시, 근무일과 통상임금을 입력하면 일할계산 인건비를 보여줍니다.';

    grandTotalText.textContent = '-';
    return;
  }

  // ----- 1) 기본 통계 -----

  const workingDays = daysArr.filter((d) => d.paidHours > 0).length;
  workingDaysText.textContent = `${workingDays}일`;

  const weeksMap = groupBy(daysArr, (d) => d.weekNoKey);

  // 가장 많이 일한 주의 시간
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

  // 이후 금액 계산에 쓸 변수들
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
      '특수운영직군 청소원은 방학중근무수당 규정 대신, 월급 일할계산으로 인건비를 산정하는 것으로 가정했습니다.';
  }

  // ----- 3) 주휴수당 vs 일할계산 -----

  if (jobType === 'cleaner') {
    // 청소원: 주휴수당 별도 X, 일할계산만
    holidayDaysText.textContent = '해당 없음';
    holidayCondText.textContent =
      '특수운영직군 청소원은 방학중비상시 직종 주휴 규정 대신, 월급 일할계산으로 방학 근무분 인건비를 산정하는 것으로 가정합니다.';
    holidayPerDayText.textContent = '-';
    holidayTotalText.textContent = '-';
    holidayHintText.textContent =
      '청소원은 이 칸에서 주휴수당을 별도로 산정하지 않습니다.';

    if (monthlyPay > 0 && monthDays > 0 && workingDays > 0) {
      const perDay = Math.round(monthlyPay / monthDays);
      prorataTotal = Math.round(perDay * workingDays);
      prorataText.textContent = formatKRW(prorataTotal);
      prorataHintText.textContent =
        '월 통상임금 × (근로일수 ÷ 기준 일수)로 간단히 일할계산했습니다. 실제 업무편람·내부결재 기준에 맞게 분모·분자를 조정해 사용하세요.';
    } else {
      prorataText.textContent = '-';
      if (monthlyPay > 0 && monthDays > 0) {
        prorataHintText.textContent =
          '근무일을 체크하면 청소원 인건비 일할계산을 해줍니다.';
      } else {
        prorataHintText.textContent =
          '월 통상임금과 기준 일수를 먼저 입력하면, 청소원 인건비 일할계산을 해줍니다.';
      }
    }
  } else {
    // 조리직: 주휴수당 계산
    let eligibleWeeks = 0;

    Object.keys(weeksMap).forEach((key) => {
      const wk = weeksMap[key];
      const weeklyHours = wk.reduce((s, d) => s + d.paidHours, 0);
      const weeklyWorkDays = wk.filter((d) => d.paidHours > 0).length;

      // 다음 주에 근무가 있는지
      const nextKey = nextWeekKeyOf(key);
      const hasNext = Object.prototype.hasOwnProperty.call(weeksMap, nextKey)
        ? hasAnyPaidWork(weeksMap[nextKey])
        : false;

      const sundayInside = wk.some((d) => d.isSunday);

      if (weeklyHours >= 15 && weeklyWorkDays > 0 && hasNext && sundayInside) {
        eligibleWeeks += 1;
      }
    });

    let holidayDays = 0;
    if (eligibleWeeks > 0 && holidayDaysPerWeek > 0) {
      holidayDays = eligibleWeeks * holidayDaysPerWeek;
      holidayDaysText.textContent = `${holidayDays}일`;
      holidayCondText.textContent =
        `근무기록 기준으로 1주 15시간 이상 + 다음 주 근무 예정 요건을 충족한 주가 ${eligibleWeeks}주 있다고 보고, ` +
        `선택한 주휴일 수(${holidayDaysPerWeek}일)를 곱해 주휴일수를 계산했습니다.`;
    } else {
      holidayDaysText.textContent = '-';
      holidayCondText.textContent =
        '입력된 근무기록 상 1주 15시간 이상 근무 + 다음 주 근무 예정 요건을 충족한 주가 없다고 보았습니다.';
    }

    if (monthlyPay > 0 && monthDays > 0 && holidayDays > 0) {
      const perDay = Math.round(monthlyPay / monthDays);
      holidayTotal = Math.round(perDay * holidayDays);
      holidayPerDayText.textContent = formatKRW(perDay);
      holidayTotalText.textContent = formatKRW(holidayTotal);
      holidayHintText.textContent =
        '월 통상임금 ÷ 기준 일수 × 주휴일수 방식으로 산정했습니다.';
    } else {
      holidayPerDayText.textContent = '-';
      holidayTotalText.textContent = '-';
      if (holidayDays > 0) {
        holidayHintText.textContent =
          '월 통상임금과 기준 일수를 입력하면 주휴수당을 계산해줍니다.';
      } else {
        holidayHintText.textContent =
          '주휴 요건을 충족한 주가 없거나, 통상임금/기준 일수가 입력되지 않았습니다.';
      }
    }

    // 조리직일 때는 청소원 일할계산 칸 비활성 느낌으로
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

  grandTotalText.textContent = grandTotal > 0 ? formatKRW(grandTotal) : '-';
}

// ===== 이벤트 바인딩 =====

// 날짜 바뀌면 표 다시 만들고 계산
[startDateEl, endDateEl].forEach((el) => {
  el.addEventListener('change', () => {
    buildDaysTable();
    recalc();
  });
});

// 기타 입력들은 값 바뀌면 바로 재계산
[
  jobTypeEl,
  monthlyPayEl,
  monthDaysEl,
  holidayDaysPerWeekEl,
  wageBaseEl,
  wageMealEl,
  wageExtraEl,
].forEach((el) => {
  el.addEventListener('input', recalc);
});

jobTypeEl.addEventListener('change', recalc);

// 초기 한 번 호출
buildDaysTable();
recalc();