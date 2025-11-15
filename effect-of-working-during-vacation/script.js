// 방학중 비상시근로자 방학근무 영향 계산기
// 통상임금: 명절휴가비 포함 + 시간당 통상임금 → 1일 통상임금까지 자동 계산

// 숫자 입력값 공통 처리
function numValue(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const raw = (el.value || '').toString().replace(/,/g, '');
  const v = parseFloat(raw);
  return isNaN(v) ? 0 : v;
}

// 돈 포맷
function formatMoney(v) {
  if (!isFinite(v)) return '-';
  return v.toLocaleString('ko-KR', { maximumFractionDigits: 0 }) + '원';
}

// 퍼센트 포맷
function formatPercent(v) {
  if (!isFinite(v)) return '-';
  return v.toFixed(2) + '%';
}

// 통상임금 계산 (시간당, 1일분 둘 다 리턴)
function calcOrdinaryWage() {
  const jobType = document.getElementById('jobType').value;

  // 월 임금항목들
  const baseMonthlyPay = numValue('baseMonthlyPay');      // 기본급(월)
  const seniorityAllowance = numValue('seniorityAllowance'); // 근속수당/직급보조비(월)
  const mealAllowance = numValue('mealAllowance');        // 정액급식비(월)
  const jobRelatedAllowance = numValue('jobRelatedAllowance'); // 직무관련·특수업무수당 등(월)

  // 연 단위 항목들
  const annualRegularBonus = numValue('annualRegularBonus');   // 정기상여금(연)
  const annualHolidayBonus = numValue('annualHolidayBonus');   // 명절휴가비(연)
  const annualJeonggeun = numValue('annualJeonggeun');         // 정근수당 총액(연, 구육성회)
  const jeonggeunExtra = numValue('jeonggeunExtra');           // 정근수당 가산금(월, 구육성회)

  // 공통: 연 단위는 12로 나눠서 월 환산
  const monthlyRegularBonus = annualRegularBonus / 12;
  const monthlyHolidayBonus = annualHolidayBonus / 12;
  const monthlyJeonggeun = annualJeonggeun / 12;

  let monthlyTotal = 0;
  let baseHours = 209;  // 시간당 통상임금 나눌 기준시간
  let dailyHours = 8;   // 1일 유급처리시간

  // 직종별 공식 반영
  if (jobType === 'edu_full') {
    // 교육공무직(월급제, 전일제) :contentReference[oaicite:4]{index=4}
    // 월임금(기본급+근속수당+정액급식비+직무관련수당+(정기상여/12)+(명절휴가비/12)) ÷ 209
    monthlyTotal =
      baseMonthlyPay +
      seniorityAllowance +
      mealAllowance +
      jobRelatedAllowance +
      monthlyRegularBonus +
      monthlyHolidayBonus;
    baseHours = 209;
    dailyHours = 8;
  } else if (jobType === 'edu_5') {
    // 교육공무직 단시간 5시간 :contentReference[oaicite:5]{index=5}
    // 월임금(기본급+근속수당+정액급식비+(정기상여/12)+(명절휴가비/12)) ÷ 130
    monthlyTotal =
      baseMonthlyPay +
      seniorityAllowance +
      mealAllowance +
      monthlyRegularBonus +
      monthlyHolidayBonus;
    baseHours = 130;
    dailyHours = 5;
  } else if (jobType === 'edu_6') {
    // 교육공무직 단시간 6시간 :contentReference[oaicite:6]{index=6}
    // 월임금(기본급+근속수당+정액급식비+(정기상여/12)+(명절휴가비/12)) ÷ 156
    monthlyTotal =
      baseMonthlyPay +
      seniorityAllowance +
      mealAllowance +
      monthlyRegularBonus +
      monthlyHolidayBonus;
    baseHours = 156;
    dailyHours = 6;
  } else if (jobType === 'gugyu') {
    // 구육성회직원 :contentReference[oaicite:7]{index=7}
    // 월임금(봉급+직급보조비+정액급식비+특수업무수당(학교)+(정근수당총액/12)+정근수당가산금
    //        +(정기상여금/12)+(명절휴가비/12)) ÷ 209
    monthlyTotal =
      baseMonthlyPay +            // 봉급
      seniorityAllowance +        // 직급보조비
      mealAllowance +             // 정액급식비
      jobRelatedAllowance +       // 특수업무수당(학교)
      monthlyJeonggeun +          // 정근수당 총액/12
      jeonggeunExtra +            // 정근수당 가산금(월)
      monthlyRegularBonus +
      monthlyHolidayBonus;
    baseHours = 209;
    dailyHours = 8;
  } else if (jobType === 'special') {
    // 특수운영직군 종사자(월급제) :contentReference[oaicite:8]{index=8}
    // 월임금(기본급+근속수당(2유형)+정액급식비+(정기상여금/12)+(명절휴가비/12)) ÷ 209
    monthlyTotal =
      baseMonthlyPay +
      seniorityAllowance +
      mealAllowance +
      monthlyRegularBonus +
      monthlyHolidayBonus;
    baseHours = 209;
    dailyHours = 8;
  }

  if (baseHours <= 0) return { hourly: 0, daily: 0 };

  const hourly = monthlyTotal / baseHours;
  const daily = hourly * dailyHours; // 연차수당 등에서 쓰는 1일 통상임금
  return { hourly, daily };
}

function calculateAll() {
  // 1. 기본 값들
  const year = numValue('year');
  const totalDaysNoSat = numValue('totalDaysNoSat');
  const excludeDays = numValue('excludeDays');
  const semesterWorkDays = numValue('semesterWorkDays');

  // 2. 방학 근무 관련 값
  const vacationWorkDays = numValue('vacationWorkDays');
  const vacationPaidHolidays = numValue('vacationPaidHolidays');
  const vacationWageTaxable = numValue('vacationWageTaxable');
  const vacationWageNonTax = numValue('vacationWageNonTax');

  const totalVacationPaidDays = vacationWorkDays + vacationPaidHolidays;

  // 3. 연차·통상임금 관련 값
  const baseAnnualLeave = numValue('baseAnnualLeave');
  const extraLeaveFromVacation = numValue('extraLeaveFromVacation');
  const usedLeaveThisYear = numValue('usedLeaveThisYear');

  // 통상임금(시간당, 1일분) 계산
  const ordinary = calcOrdinaryWage();
  const hourlyOrdinary = ordinary.hourly;
  const ordinaryDailyWage = ordinary.daily;

  // 4. 4대보험·세금 관련 값
  const fourInsTotalRate = numValue('fourInsTotalRate') / 100;
  const fourInsPersonalRate = numValue('fourInsPersonalRate') / 100;
  const taxRate = numValue('taxRate') / 100;

  // ===== ① 출근율 및 연차일수 =====
  let attendanceRate = null;
  const denom = totalDaysNoSat - excludeDays;

  if (denom > 0) {
    attendanceRate =
      ((semesterWorkDays + totalVacationPaidDays) / denom) * 100;
  }

  const totalAnnualLeave = baseAnnualLeave + extraLeaveFromVacation;
  const unusedLeave = Math.max(totalAnnualLeave - usedLeaveThisYear, 0);
  const unusedLeavePay = unusedLeave * ordinaryDailyWage;

  // ===== ③ 4대보험 증가분(추정) =====
  const fourInsBase = vacationWageTaxable;
  let fourInsTotal = null;
  let fourInsPersonal = null;
  let fourInsEmployer = null;

  if (fourInsTotalRate > 0) {
    fourInsTotal = fourInsBase * fourInsTotalRate;
    if (fourInsPersonalRate > 0) {
      fourInsPersonal = fourInsBase * fourInsPersonalRate;
      fourInsEmployer = fourInsTotal - fourInsPersonal;
    }
  }

  // ===== ④ 연말정산 세금 증가분(추정) =====
  const extraTaxableIncome = Math.max(
    vacationWageTaxable - vacationWageNonTax,
    0
  );
  let extraTax = null;
  if (taxRate > 0) {
    extraTax = extraTaxableIncome * taxRate;
  }

  // ===== 결과 출력 =====
  const resultAttendance = document.getElementById('result-attendance');
  const resultAnnualpay = document.getElementById('result-annualpay');
  const resultFourins = document.getElementById('result-fourins');
  const resultTax = document.getElementById('result-tax');

  // ① 출근율 및 연차일수
  let attendanceHtml = '';
  attendanceHtml += `<p>· 기준 연도: <strong>${year || '-'}</strong></p>`;
  attendanceHtml += `<p>· 학기 중 유급 근로일수: <strong>${semesterWorkDays || 0}일</strong></p>`;
  attendanceHtml += `<p>· 방학 중 유급 처리일수(근무일 + 유급 주휴일): <strong>${totalVacationPaidDays || 0}일</strong></p>`;

  if (attendanceRate !== null) {
    attendanceHtml += `<p>· 출근율(간이 계산): <strong>${formatPercent(attendanceRate)}</strong></p>`;
    attendanceHtml += `<p class="muted">※ 실제 출근율 판단은 월·학기 단위로 나눠서, 방학중 비상시근로자 출근율·연차 기준을 다시 확인해야 함.</p>`;
  } else {
    attendanceHtml += `<p>· 출근율: 분모(달력상 총 일수 - 제외기간)가 0 이하라 계산 불가</p>`;
  }

  attendanceHtml += `<p>· 기본 연차일수(방학근무 반영 전): <strong>${baseAnnualLeave || 0}일</strong></p>`;
  attendanceHtml += `<p>· 방학근무로 증가한 연차일수(직접 입력): <strong>${extraLeaveFromVacation || 0}일</strong></p>`;
  attendanceHtml += `<p>→ 방학근무 반영 후 총 연차일수(간이): <strong>${totalAnnualLeave || 0}일</strong></p>`;
  attendanceHtml += `<p>· 당해연도 사용 연차일수: <strong>${usedLeaveThisYear || 0}일</strong></p>`;
  attendanceHtml += `<p>→ 남은(미사용) 연차일수(추가 연차 포함): <strong>${unusedLeave}일</strong></p>`;

  resultAttendance.innerHTML = attendanceHtml;

  // ② 통상임금 · 연차미사용수당
  let annualHtml = '';
  annualHtml += `<p>· 시간당 통상임금(명절휴가비 포함): <strong>${formatMoney(hourlyOrdinary)}</strong></p>`;
  annualHtml += `<p>· 1일 통상임금(시간당 통상임금 × 1일 유급처리시간): <strong>${formatMoney(ordinaryDailyWage)}</strong></p>`;
  annualHtml += `<p>· 미사용 연차일수(추가 연차 포함): <strong>${unusedLeave}일</strong></p>`;
  annualHtml += `<p>→ 연차휴가미사용수당(추정): <strong>${formatMoney(unusedLeavePay)}</strong></p>`;
  annualHtml += `<p class="muted">※ 2024.12.19. 이후 발생하는 연차휴가미사용수당은 명절휴가비가 포함된 변경된 통상임금으로 계산해야 함.</p>`;

  resultAnnualpay.innerHTML = annualHtml;

  // ③ 4대보험 추정
  let fourHtml = '';
  fourHtml += `<p>· 방학근무 과세 대상 보수 합계: <strong>${formatMoney(fourInsBase)}</strong></p>`;
  fourHtml += `<p>· 4대보험 총 요율(입력 기준): <strong>${(fourInsTotalRate * 100).toFixed(2)}%</strong></p>`;

  if (fourInsTotal !== null) {
    fourHtml += `<p>→ 방학근무 보수로 인한 4대보험료 총 증가 추정: <strong>${formatMoney(fourInsTotal)}</strong></p>`;
    if (fourInsPersonal !== null) {
      fourHtml += `<p>· 이 중 근로자 개인 부담 추정: <strong>${formatMoney(fourInsPersonal)}</strong></p>`;
      fourHtml += `<p>· 기관(학교) 부담 추정: <strong>${formatMoney(fourInsEmployer)}</strong></p>`;
    } else {
      fourHtml += `<p class="muted">※ 개인부담률을 입력하면 근로자·기관 부담을 나눠서 볼 수 있음.</p>`;
    }
  } else {
    fourHtml += `<p>→ 4대보험 총 요율을 입력해야 증가액을 계산할 수 있음.</p>`;
  }

  fourHtml += `<p class="muted">※ 실제로는 다음 연도에 ‘시간외·방학근무수당 정산내역’을 제출하고, 교육지원청에서 정산한 금액을 학교 예산에 반영.</p>`;

  resultFourins.innerHTML = fourHtml;

  // ④ 연말정산 세금 추정
  let taxHtml = '';
  taxHtml += `<p>· 방학근무 과세 대상 금액: <strong>${formatMoney(vacationWageTaxable)}</strong></p>`;
  taxHtml += `<p>· 그 중 비과세 금액: <strong>${formatMoney(vacationWageNonTax)}</strong></p>`;
  taxHtml += `<p>→ 추가 과세소득(간이): <strong>${formatMoney(extraTaxableIncome)}</strong></p>`;
  taxHtml += `<p>· 입력한 평균세율: <strong>${(taxRate * 100).toFixed(2)}%</strong></p>`;

  if (extraTax !== null) {
    taxHtml += `<p>→ 방학근무 보수로 인한 연말정산 추가 세금 추정: <strong>${formatMoney(extraTax)}</strong></p>`;
    taxHtml += `<p class="muted">※ 실제 연말정산은 누진세율·각종 공제·4대보험 공제까지 반영되므로, 여기 값은 “대략 이 정도 세금이 더 나올 수 있겠구나” 정도의 참고용.</p>`;
  } else {
    taxHtml += `<p>→ 평균세율을 입력하면 추가 세금을 대략 계산할 수 있음.</p>`;
  }

  resultTax.innerHTML = taxHtml;
}
