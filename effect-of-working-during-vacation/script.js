// 방학중 비상시근로자 방학근무 영향 계산기
// 그냥 숫자 넣고 "계산하기" 누르면 되는 간이 시뮬레이터 느낌으로 작성

// 숫자 입력값 가져올 때 공통으로 쓸 함수
function numValue(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const v = parseFloat(el.value.replace(/,/g, ''));
  return isNaN(v) ? 0 : v;
}

// 결과를 깔끔하게 포맷하는 함수(원 단위 표시)
function formatMoney(v) {
  if (!isFinite(v)) return '-';
  return v.toLocaleString('ko-KR', { maximumFractionDigits: 0 }) + '원';
}

// 퍼센트 포맷
function formatPercent(v) {
  if (!isFinite(v)) return '-';
  return v.toFixed(2) + '%';
}

function calculateAll() {
  // 1. 기본 값들
  const year = numValue('year');
  const totalDaysNoSat = numValue('totalDaysNoSat'); // 분모에서 토요일 제외 총 일수
  const excludeDays = numValue('excludeDays');       // 무급 제외기간
  const semesterWorkDays = numValue('semesterWorkDays'); // 학기 중 유급처리 근로일수

  // 2. 방학 근무 관련 값
  const vacationWorkDays = numValue('vacationWorkDays');         // 방학 중 실제 출근일
  const vacationPaidHolidays = numValue('vacationPaidHolidays'); // 방학 중 유급 주휴일
  const vacationWageTaxable = numValue('vacationWageTaxable');   // 방학근무 과세 대상 보수 합계
  const vacationWageNonTax = numValue('vacationWageNonTax');     // 방학근무 비과세 금액

  const totalVacationPaidDays = vacationWorkDays + vacationPaidHolidays; // 방학의 유급 처리일

  // 3. 연차휴가 관련 값
  const baseAnnualLeave = numValue('baseAnnualLeave');                 // 기본 연차일수
  const extraLeaveFromVacation = numValue('extraLeaveFromVacation');   // 방학근무로 증가한 연차일수(최대 3일 등)
  const usedLeaveThisYear = numValue('usedLeaveThisYear');             // 당해 연도 사용 연차
  const ordinaryDailyWage = numValue('ordinaryDailyWage');             // 통상임금 1일분

  // 4. 4대보험·세금 관련 값
  const fourInsTotalRate = numValue('fourInsTotalRate') / 100;   // 총 요율(소수로 변환)
  const fourInsPersonalRate = numValue('fourInsPersonalRate') / 100; // 개인부담률
  const taxRate = numValue('taxRate') / 100;                     // 세율(소수)

  // ===== ① 출근율 및 연차일수 계산 =====
  // 출근율 산정식(업무편람 기준 요약):
  // 출근율(%) = { 학기 근무일(토 제외) + 방학의 유급 처리일(토 제외) } × 100
  //             ÷ { 달력상 총 일수(토요일 제외) - 제외기간 }
  // 실제로는 학기/방학을 월별로 쪼개서 보지만, 여기서는 연도 단위 간이 계산으로 처리
  let attendanceRate = null;
  const denom = totalDaysNoSat - excludeDays;

  if (denom > 0) {
    attendanceRate = ((semesterWorkDays + totalVacationPaidDays) / denom) * 100;
  }

  const totalAnnualLeave = baseAnnualLeave + extraLeaveFromVacation; // 방학근무 반영 후 총 연차일수
  const unusedLeave = Math.max(totalAnnualLeave - usedLeaveThisYear, 0); // 미사용 연차일수(0 미만 방지)
  const unusedLeavePay = unusedLeave * ordinaryDailyWage; // 미사용수당(추가 연차 포함 전체)

  // ===== ③ 4대보험료 증가분(추정) =====
  // 정석은 보수월액·기준소득월액 반영해서 각 보험별로 나눠야 하지만
  // 여기서는 방학근무 보수에 총 요율을 곱해서 "대략 이만큼 늘어난다" 수준만 본다.
  const fourInsBase = vacationWageTaxable; // 과세 대상 보수만 기준으로 본다고 가정
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
  // 방학근무 보수 중 과세 대상 금액 - 비과세 금액 = 추가 과세소득으로 보고,
  // 여기에 평균세율을 곱해 대략적인 추가 세액을 본다.
  const extraTaxableIncome = Math.max(vacationWageTaxable - vacationWageNonTax, 0);
  let extraTax = null;
  if (taxRate > 0) {
    extraTax = extraTaxableIncome * taxRate;
  }

  // ===== 화면에 뿌리기 =====
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
    attendanceHtml += `<p class="muted">※ 실제 출근율 판단은 월·학기 단위로 나눠서 업무편람의 ‘방학중 비상시근로자 ①→②→③→④’ 기준을 다시 봐야 함.</p>`;
  } else {
    attendanceHtml += `<p>· 출근율: 분모(달력상 총 일수 - 제외기간)가 0 이하라 계산 불가</p>`;
  }

  attendanceHtml += `<p>· 기본 연차일수(방학근무 반영 전): <strong>${baseAnnualLeave || 0}일</strong></p>`;
  attendanceHtml += `<p>· 방학근무로 증가한 연차일수(직접 입력): <strong>${extraLeaveFromVacation || 0}일</strong></p>`;
  attendanceHtml += `<p>→ 방학근무 반영 후 총 연차일수(간이): <strong>${totalAnnualLeave || 0}일</strong></p>`;
  attendanceHtml += `<p>· 당해연도 사용 연차일수: <strong>${usedLeaveThisYear || 0}일</strong></p>`;
  attendanceHtml += `<p>→ 남은(미사용) 연차일수(추가 연차 포함): <strong>${unusedLeave}일</strong></p>`;

  resultAttendance.innerHTML = attendanceHtml;

  // ② 연차미사용수당
  let annualHtml = '';
  annualHtml += `<p>· 통상임금 1일분: <strong>${formatMoney(ordinaryDailyWage)}</strong></p>`;
  annualHtml += `<p>· 미사용 연차일수(추가 연차 포함): <strong>${unusedLeave}일</strong></p>`;
  annualHtml += `<p>→ 연차미사용수당(추정): <strong>${formatMoney(unusedLeavePay)}</strong></p>`;
  annualHtml += `<p class="muted">※ 업무편람상 방학근무로 증가한 연차(예: 3일)는 다음 회계연도 3월 임금 지급일에 수당으로 정산하거나, 선지급 동의서를 받은 경우 연차 대신 수당 지급도 가능.</p>`;

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

  fourHtml += `<p class="muted">※ 실제로는 다음 연도에 ‘시간외·방학근무수당 정산내역’을 제출하고, 교육지원청에서 4대보험 정산분을 계산 후 학교 부담분을 받는 구조.</p>`;

  resultFourins.innerHTML = fourHtml;

  // ④ 연말정산 세금 추정
  let taxHtml = '';
  taxHtml += `<p>· 방학근무 과세 대상 금액: <strong>${formatMoney(vacationWageTaxable)}</strong></p>`;
  taxHtml += `<p>· 그 중 비과세 금액: <strong>${formatMoney(vacationWageNonTax)}</strong></p>`;
  taxHtml += `<p>→ 추가 과세소득(간이): <strong>${formatMoney(extraTaxableIncome)}</strong></p>`;
  taxHtml += `<p>· 입력한 평균세율: <strong>${(taxRate * 100).toFixed(2)}%</strong></p>`;

  if (extraTax !== null) {
    taxHtml += `<p>→ 방학근무 보수로 인한 연말정산 추가 세금 추정: <strong>${formatMoney(extraTax)}</strong></p>`;
    taxHtml += `<p class="muted">※ 실제 연말정산은 누진세율·각종 공제·보험료 공제까지 모두 반영되므로, 여기 값은 “대략 이 정도 세금이 더 물릴 수 있겠다” 수준의 참고용.</p>`;
  } else {
    taxHtml += `<p>→ 평균세율을 입력하면 추가 세금을 대략 계산할 수 있음.</p>`;
  }

  resultTax.innerHTML = taxHtml;
}
