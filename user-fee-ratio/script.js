

// ----- 비율 설정 -----

// 국민연금 (전체 9% → 근로자 4.5, 기관 4.5)
const R_PENSION_EMP = 0.045;
const R_PENSION_ORG = 0.045;

// 건강보험 (전체 7.09% → 근로자 3.545, 기관 3.545)
const R_HEALTH_EMP = 0.03545;
const R_HEALTH_ORG = 0.03545;

// 장기요양보험 (건강보험료의 12.95% 근사)
// 개인/기관 둘 다 있음
const R_LONGTERM_EMP = 0.1295;
const R_LONGTERM_ORG = 0.1295;

// 고용보험 (개인/기관 둘 다 있는 버전으로 파라미터 분리)
// 실제 비율은 직종/연도별로 다르니까 나중에 엑셀 기준으로 맞추면 됨.
const R_EMPLOY_EMP = 0.009;   // 근로자
const R_EMPLOY_ORG = 0.009;   // 기관부담

// 산재보험 (기관부담만, 현실 제도상 개인부담 없음)
const R_ACCIDENT_ORG = 0.00966;

// 퇴직적립금 (보수월액 1/12 정도로 가정)
const R_RETIRE = 1 / 12;

// 연차수당 증가분 비율 (통상임금 변동분에 대한 대략값)
const R_ANNUAL_LEAVE = 0.12;

// ----- 유틸 -----

function $(id) {
  return document.getElementById(id);
}

function formatWon(v) {
  if (isNaN(v)) return "0원";
  return v.toLocaleString("ko-KR") + "원";
}

// ----- 핵심 계산 로직 -----

function calcCoachDistribution(studentCount, unitFee) {
  const totalCollected = studentCount * unitFee;

  if (studentCount <= 0 || unitFee <= 0) {
    return {
      totalCollected: 0,
      netPay: 0,
      pensionEmp: 0,
      pensionOrg: 0,
      healthEmp: 0,
      healthOrg: 0,
      longtermEmp: 0,
      longtermOrg: 0,
      employEmp: 0,
      employOrg: 0,
      accidentOrg: 0,
      retirement: 0,
      annualLeave: 0,
      totalDeductions: 0,
      iterations: 0
    };
  }

  // 초기값: 징수금의 60%를 실수령으로 가정
  let netPay = totalCollected * 0.6;
  let lastNetPay = 0;

  const maxIter = 80;
  const tolerance = 1; // 1원 이하면 수렴으로 봄

  let pensionEmp, pensionOrg;
  let healthEmp, healthOrg;
  let longtermEmp, longtermOrg;
  let employEmp, employOrg;
  let accidentOrg, retirement, annualLeave;
  let totalDeductions;
  let iterations = 0;

  for (let i = 0; i < maxIter; i++) {
    iterations = i + 1;

    // 기준 보수월액: 일단 netPay 기준으로 단순화
    // 실제 산식과 다르면 이 부분만 손보면 된다.
    const base = netPay;

    // 국민연금
    pensionEmp = Math.floor(base * R_PENSION_EMP);
    pensionOrg = Math.floor(base * R_PENSION_ORG);

    // 건강보험
    healthEmp = Math.floor(base * R_HEALTH_EMP);
    healthOrg = Math.floor(base * R_HEALTH_ORG);

    // 장기요양보험 (개인/기관 각각)
    longtermEmp = Math.floor(healthEmp * R_LONGTERM_EMP);
    longtermOrg = Math.floor(healthOrg * R_LONGTERM_ORG);

    // 고용보험 (개인/기관)
    employEmp = Math.floor(base * R_EMPLOY_EMP);
    employOrg = Math.floor(base * R_EMPLOY_ORG);

    // 산재보험 (기관부담만)
    accidentOrg = Math.floor(base * R_ACCIDENT_ORG);

    // 퇴직적립금
    retirement = Math.floor(base * R_RETIRE);

    // 연차수당 증가분
    annualLeave = Math.floor(base * R_ANNUAL_LEAVE);

    // 총 공제액 = 개인부담 + 기관부담 + 퇴직 + 연차
    totalDeductions =
      pensionEmp +
      pensionOrg +
      healthEmp +
      healthOrg +
      longtermEmp +
      longtermOrg +
      employEmp +
      employOrg +
      accidentOrg +
      retirement +
      annualLeave;

    // 새 실수령액 = 징수금 - 공제합계
    lastNetPay = netPay;
    netPay = totalCollected - totalDeductions;

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
    longtermEmp,
    longtermOrg,
    employEmp,
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

  $("longtermEmp").textContent = formatWon(result.longtermEmp);
  $("longtermOrg").textContent = formatWon(result.longtermOrg);

  $("employEmp").textContent = formatWon(result.employEmp);
  $("employOrg").textContent = formatWon(result.employOrg);

  $("accidentOrg").textContent = formatWon(result.accidentOrg);

  $("retirement").textContent = formatWon(result.retirement);
  $("annualLeave").textContent = formatWon(result.annualLeave);

  $("totalDeductions").textContent = formatWon(result.totalDeductions);
  $("netPay").textContent = formatWon(result.netPay);

  if (result.iterations > 0) {
    $("iterInfo").textContent =
      "반복 계산 " + result.iterations + "회 수행 (순환식을 근사해서 수렴한 값입니다).";
  } else {
    $("iterInfo").textContent = "아직 계산 전입니다.";
  }
}

// ----- HTML에서 직접 부를 함수 -----

function handleCalculate() {
  const students = parseInt($("students").value || "0", 10);
  const unitFee = parseInt($("unitFee").value || "0", 10);

  const result = calcCoachDistribution(students, unitFee);
  updateView(result);
}

// 페이지 처음 열릴 때 기본값으로 한 번 계산
handleCalculate();