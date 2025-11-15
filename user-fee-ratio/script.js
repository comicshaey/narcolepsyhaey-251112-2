// ----- 설정값(비율) -----

// 국민연금 (전체 9% → 근로자 4.5, 기관 4.5)
const R_PENSION_EMP = 0.045;
const R_PENSION_ORG = 0.045;

// 건강보험 (전체 7.09% → 근로자 3.545, 기관 3.545)
const R_HEALTH_EMP = 0.03545;
const R_HEALTH_ORG = 0.03545;

// 장기요양보험 (건강보험료의 12.95%)
const R_LONGTERM = 0.1295;

// 고용보험 (기관부담 0.9%)
const R_EMPLOY_ORG = 0.009;

// 산재보험 (기관부담 0.966% 근사)
const R_ACCIDENT_ORG = 0.00966;

// 퇴직적립금 (보수월액의 1/12라고 보고 8.33% 정도로 잡음)
const R_RETIRE = 1 / 12;

// 연차수당 증가분 비율
// 통상임금이 이만큼 늘어났을 때, 연차 20일 기준으로 대충 이 정도 비율이 더 들어간다고 보는 값.
// 실제 학교 산식과 안 맞으면 그냥 여기만 엑셀 기준으로 고치면 된다.
const R_ANNUAL_LEAVE = 0.12; // 대략 12% 근사치

// ----- 유틸 함수 -----

// 숫자를 원화 문자열로 포맷
function formatWon(value) {
  if (isNaN(value)) return "0원";
  return value.toLocaleString("ko-KR") + "원";
}

// DOM에서 요소 가져오기 편하게
function $(id) {
  return document.getElementById(id);
}

// ----- 핵심 계산 로직 -----
// 순환식을 반복계산으로 근사값을 구하는 부분

function calcCoachDistribution(studentCount, unitFee) {
  // 총 징수금: 학생수 × 1인당 징수금
  const totalCollected = studentCount * unitFee;

  // 학생이 0명이면 바로 0 리턴
  if (studentCount <= 0 || unitFee <= 0) {
    return {
      totalCollected: 0,
      netPay: 0,
      pensionEmp: 0,
      pensionOrg: 0,
      healthEmp: 0,
      healthOrg: 0,
      longterm: 0,
      employOrg: 0,
      accidentOrg: 0,
      retirement: 0,
      annualLeave: 0,
      totalDeductions: 0,
      iterations: 0
    };
  }

  // 초기 추정 실수령액: 징수금의 60% 정도로 대충 시작
  let netPay = totalCollected * 0.6;
  let lastNetPay = 0;

  const maxIter = 80; // 최대 80번까지만 반복
  const tolerance = 1; // 1원 이하로 차이가 줄어들면 수렴했다고 봄

  // 반복하면서 순환을 깨는 구간
  let pensionEmp, pensionOrg, healthEmp, healthOrg, longterm;
  let employOrg, accidentOrg, retirement, annualLeave, totalDeductions;
  let iterations = 0;

  for (let i = 0; i < maxIter; i++) {
    iterations = i + 1;

    // 기준 보수월액을 어떻게 잡을지 애매한데,
    // 여기서는 "지도자에게 지급되는 금액(실수령+근로자부담분)을 대략 netPay 기준"으로 보고 단순화했다.
    // 실제 산식과 다르면 이 부분만 손봐도 된다.
    const base = netPay;

    // 국민연금
    pensionEmp = Math.floor(base * R_PENSION_EMP);
    pensionOrg = Math.floor(base * R_PENSION_ORG);

    // 건강보험
    healthEmp = Math.floor(base * R_HEALTH_EMP);
    healthOrg = Math.floor(base * R_HEALTH_ORG);

    // 장기요양보험 (건강보험 전체 기준)
    const healthTotal = healthEmp + healthOrg;
    longterm = Math.floor(healthTotal * R_LONGTERM);

    // 고용보험, 산재보험 (기관부담)
    employOrg = Math.floor(base * R_EMPLOY_ORG);
    accidentOrg = Math.floor(base * R_ACCIDENT_ORG);

    // 퇴직적립금
    retirement = Math.floor(base * R_RETIRE);

    // 연차수당 증가분
    annualLeave = Math.floor(base * R_ANNUAL_LEAVE);

    // 총 공제액 = 사회보험(개인+기관) + 장기요양 + 퇴직적립금 + 연차수당 증가분
    totalDeductions =
      pensionEmp +
      pensionOrg +
      healthEmp +
      healthOrg +
      longterm +
      employOrg +
      accidentOrg +
      retirement +
      annualLeave;

    // 새로 계산된 실수령액 = 총 징수금 - 공제합계
    lastNetPay = netPay;
    netPay = totalCollected - totalDeductions;

    // 변화량이 아주 작아졌으면 수렴했다고 보고 종료
    if (Math.abs(netPay - lastNetPay) < tolerance) {
      break;
    }
  }

  return {
    totalCollected,
    netPay: Math.floor(netPay),
    pensionEmp,
    pensionOrg,
    healthEmp,
    healthOrg,
    longterm,
    employOrg,
    accidentOrg,
    retirement,
    annualLeave,
    totalDeductions,
    iterations
  };
}

// ----- 화면 갱신 -----

function updateView(result) {
  $("totalCollected").textContent = formatWon(result.totalCollected);
  $("pensionEmp").textContent = formatWon(result.pensionEmp);
  $("pensionOrg").textContent = formatWon(result.pensionOrg);
  $("healthEmp").textContent = formatWon(result.healthEmp);
  $("healthOrg").textContent = formatWon(result.healthOrg);
  $("longterm").textContent = formatWon(result.longterm);
  $("employOrg").textContent = formatWon(result.employOrg);
  $("accidentOrg").textContent = formatWon(result.accidentOrg);
  $("retirement").textContent = formatWon(result.retirement);
  $("annualLeave").textContent = formatWon(result.annualLeave);
  $("totalDeductions").textContent = formatWon(result.totalDeductions);
  $("netPay").textContent = formatWon(result.netPay);

  if (result.iterations > 0) {
    $("iterInfo").textContent =
      "반복 계산 " +
      result.iterations +
      "회 수행 (이론상 순환식을 근사해서 수렴한 값입니다).";
  } else {
    $("iterInfo").textContent = "아직 계산 전입니다.";
  }
}

// ----- 이벤트 연결 -----

function handleCalculate() {
  const students = parseInt($("students").value || "0", 10);
  const unitFee = parseInt($("unitFee").value || "0", 10);

  const result = calcCoachDistribution(students, unitFee);
  updateView(result);
}

// 페이지 로드 시 기본값으로 한 번 계산
window.addEventListener("DOMContentLoaded", () => {
  $("calcBtn").addEventListener("click", handleCalculate);

  // 입력값 바뀔 때마다 자동으로 다시 계산하고 싶으면 이 부분 활성화
  $("students").addEventListener("input", handleCalculate);
  $("unitFee").addEventListener("input", handleCalculate);

  handleCalculate();
});
