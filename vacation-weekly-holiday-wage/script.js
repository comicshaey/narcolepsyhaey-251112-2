
// 입력 요소
const jobTypeEl = document.getElementById('jobType');
const weeksEl = document.getElementById('weeks');
const daysPerWeekEl = document.getElementById('daysPerWeek');
const hoursPerDayEl = document.getElementById('hoursPerDay');
const monthlyPayEl = document.getElementById('monthlyPay');
const monthDaysEl = document.getElementById('monthDays');

// 결과 표시 요소
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

// 숫자를 "12,345원" 이런 식으로 보여주는 함수
function formatKRW(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  return value.toLocaleString('ko-KR') + '원';
}

// 메인 계산 함수
function recalc() {
  const jobType = jobTypeEl.value;

  const weeks = parseFloat(weeksEl.value) || 0;
  const daysPerWeek = parseFloat(daysPerWeekEl.value) || 0;
  const hoursPerDay = parseFloat(hoursPerDayEl.value) || 0;
  const monthlyPay = parseFloat(monthlyPayEl.value) || 0;
  const monthDays = parseFloat(monthDaysEl.value) || 0;

  // 총 실근무일수
  const workingDays = weeks * daysPerWeek;
  workingDaysText.textContent = workingDays > 0 ? `${workingDays}일` : '-';

  // 1주 방학 중 실근로시간(참고용)
  const weeklyHours = daysPerWeek * hoursPerDay;
  if (weeklyHours > 0) {
    weeklyHoursText.textContent = `${weeklyHours}시간`;
    if (weeklyHours >= 15) {
      weeklyHoursHintText.textContent =
        '입력 기준으로는 1주 15시간 이상이라 방학 중 유급 주휴 요건(원칙)은 충족합니다. (다음 주 근무 예정 여부는 별도 확인 필요)';
    } else {
      weeklyHoursHintText.textContent =
        '입력 기준으로는 1주 15시간 미만이라 원칙적으로 방학 중 유급 주휴 요건에 미달합니다. 전일제 예외 등은 업무편람 사례를 별도로 확인하세요.';
    }
  } else {
    weeklyHoursText.textContent = '-';
    weeklyHoursHintText.textContent =
      '1주 근무일수와 1일 근무시간을 입력하면 1주 실근로시간 기준을 보여줍니다.';
  }

  // 공통: 방학중근무수당, 주휴수당, 일할계산 값 초기화
  let restPerDay = 0;
  let restTotal = 0;
  let holidayDays = 0;
  let holidayPerDay = 0;
  let holidayTotal = 0;
  let prorataTotal = 0;

  // --- 1) 방학중근무수당 (교육공무직 조리직만) ---

  if (jobType === 'cook' || jobType === 'cook-helper') {
    if (hoursPerDay > 0) {
      if (hoursPerDay <= 4) {
        restPerDay = 10000;
        restRuleText.textContent =
          '1일 근무시간이 4시간 이하라서 방학중근무수당을 1일 10,000원으로 계산합니다. (조리직 기준)';
      } else {
        restPerDay = 20000;
        restRuleText.textContent =
          '1일 근무시간이 4시간 초과라서 방학중근무수당을 1일 20,000원으로 계산합니다. (조리직 기준)';
      }
    } else {
      restRuleText.textContent =
        '방학중근무수당 규칙: 4시간 이하 1만원, 4시간 초과 2만원 (먼저 1일 근무시간을 입력하세요)';
    }
  } else {
    // 청소원은 방학중근무수당 규정 미적용, 일할계산만 사용
    restRuleText.textContent =
      '특수운영직군 청소원은 방학중근무수당 규정 대신, 월급 일할계산으로 인건비를 산정하는 것으로 가정합니다.';
  }

  restTotal = restPerDay * workingDays;

  restPerDayText.textContent =
    restPerDay > 0 ? formatKRW(restPerDay) : '-';
  restTotalText.textContent =
    restTotal > 0 ? formatKRW(restTotal) : '-';

  // --- 2) 주휴수당 (교육공무직 조리직) vs 특수운영직군 청소원 ---

  if (jobType === 'cleaner') {
    // 청소원: 방학중비상시 주휴 규정 적용 X, 대신 일할계산
    holidayDaysText.textContent = '해당 없음';
    holidayCondText.textContent =
      '특수운영직군 청소원은 방학중비상시 직종 주휴 규정 대신, 월급 일할계산으로 방학 근무분 인건비를 산정하는 것으로 가정합니다.';
    holidayPerDayText.textContent = '-';
    holidayTotalText.textContent = '-';
    holidayHintText.textContent =
      '청소원은 이 칸에서 주휴수당을 별도로 산정하지 않습니다.';

    // 일할계산 인건비: 월 통상임금 × (근로일수 ÷ 기준 일수)
    if (monthlyPay > 0 && monthDays > 0 && workingDays > 0) {
      const dailyPayRaw = monthlyPay / monthDays;
      const dailyPay = Math.round(dailyPayRaw);
      prorataTotal = Math.round(dailyPay * workingDays);

      prorataText.textContent = formatKRW(prorataTotal);
      prorataHintText.textContent =
        '월 통상임금 × (근로일수 ÷ 기준 일수)로 간단히 일할계산했습니다. 실제 업무편람·내부결재 기준에 맞게 분모·분자를 조정해 사용하세요.';
    } else {
      prorataText.textContent = '-';
      if (monthlyPay > 0 && monthDays > 0) {
        prorataHintText.textContent =
          '근로 주 수·1주 근무일수를 입력하면 일할계산 인건비를 보여줍니다.';
      } else {
        prorataHintText.textContent =
          '월 통상임금과 기준 일수를 먼저 입력하면, 청소원 인건비 일할계산을 해줍니다.';
      }
    }
  } else {
    // 조리사 / 조리실무사: 방학중비상시 주휴 규정 적용
    // 방학 중 유급 주휴를 인정할 주 수 × 토일 2일
    holidayDays = weeks * 2;

    if (holidayDays > 0) {
      holidayDaysText.textContent = `${holidayDays}일`;
      holidayCondText.textContent =
        '입력한 주 수를 방학 중 유급 주휴 요건(1주 15시간 이상 + 다음 주 근무 예정 등)을 충족한 주로 보고 토·일 2일씩 계산했습니다.';
    } else {
      holidayDaysText.textContent = '-';
      holidayCondText.textContent =
        '방학 중 유급 주휴를 인정할 주가 없다면 0주로 두세요.';
    }

    if (monthlyPay > 0 && monthDays > 0 && holidayDays > 0) {
      const perDayRaw = monthlyPay / monthDays;
      holidayPerDay = Math.round(perDayRaw);
      holidayTotal = Math.round(holidayPerDay * holidayDays);

      holidayPerDayText.textContent = formatKRW(holidayPerDay);
      holidayTotalText.textContent = formatKRW(holidayTotal);
      holidayHintText.textContent =
        '월 통상임금 ÷ 기준 일수 × 주휴일수 방식으로 산정했습니다.';
    } else {
      holidayPerDayText.textContent = '-';
      holidayTotalText.textContent = '-';
      if (holidayDays > 0) {
        holidayHintText.textContent =
          '월 통상임금과 기준 일수를 입력하면 업무편람 방식으로 주휴수당을 계산해줍니다.';
      } else {
        holidayHintText.textContent =
          '먼저 주휴를 인정할 주 수(주 수 × 토·일 2일)를 입력하세요.';
      }
    }

    // 조리직일 때는 청소원용 일할계산 칸 비활성 느낌으로
    prorataText.textContent = '-';
    prorataHintText.textContent =
      '조리사·조리실무사는 방학중근무수당 + 주휴수당을 기준으로 인건비를 산정하는 것으로 가정합니다.';
  }

  // --- 3) 총 인건비 합산 ---

  let grandTotal = 0;

  if (jobType === 'cleaner') {
    // 청소원은 일할계산 인건비만 사용
    grandTotal = prorataTotal;
  } else {
    // 조리직은 방학중근무수당 + 주휴수당 합산
    grandTotal = restTotal + holidayTotal;
  }

  grandTotalText.textContent =
    grandTotal > 0 ? formatKRW(grandTotal) : '-';
}

// 입력값이 바뀔 때마다 자동 계산
[
  jobTypeEl,
  weeksEl,
  daysPerWeekEl,
  hoursPerDayEl,
  monthlyPayEl,
  monthDaysEl,
].forEach((el) => {
  el.addEventListener('input', recalc);
});

// 직종 바뀔 때도 바로 반영
jobTypeEl.addEventListener('change', recalc);

// 페이지 로드 시 한 번 계산
recalc();