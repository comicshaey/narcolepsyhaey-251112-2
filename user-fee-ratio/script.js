

// --- 10원 단위 절사 ---
function round10(v) {
  const n = Number(v) || 0;
  return Math.floor(n / 10) * 10;
}

function $(id) {
  return document.getElementById(id);
}

function formatWon(v) {
  if (isNaN(v)) return "0원";
  return v.toLocaleString("ko-KR") + "원";
}

// ------------------------
//     비율 설정
// ------------------------

// 국민연금 9% → 근로자 4.5 + 기관 4.5
const R_PENSION_EMP = 0.045;
const R_PENSION_ORG = 0.045;

// 건강보험 7.09% → 근로자 3.545 + 기관 3.545
const R_HEALTH_EMP = 0.03545;
const R_HEALTH_ORG = 0.03545;

// 장기요양보험: 건강보험료의 12.95%
const R_LONGTERM_EMP = 0.1295;
const R_LONGTERM_ORG = 0.1295;

// 고용보험: 개인·기관 모두 존재하는 버전
const R_EMPLOY_EMP = 0.009;
const R_EMPLOY_ORG = 0.009;

// 산재보험: 기관부담만
const R_ACCIDENT_ORG = 0.00966;

// 퇴직적립금: 약 1/12
const R_RETIRE = 1 / 12;

// 연차수당 증가분 비율(대략값)
const R_ANNUAL_LEAVE = 0.12;

// ------------------------
//   순환식 반복 계산
// ------------------------

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

  // 초기 추정치: 징수금의 60%를 실수령 가정
  let netPay = totalCollected * 0.6;
  let lastNetPay = 0;

  const maxIter = 80;
  const tolerance = 10;   // 10원 이하 변화면 수렴

  let iterations = 0;

  let pensionEmp, pensionOrg;
  let healthEmp, healthOrg;
  let longtermEmp, longtermOrg;
  let employEmp, employOrg;
  let accidentOrg, retirement, annualLeave;
  let totalDeductions;

  for (let i = 0; i < maxIter; i++) {
    iterations = i + 1;

    const base = netPay;

    pensionEmp = round10(base * R_PENSION_EMP);
    pensionOrg = round10(base * R_PENSION_ORG);

    healthEmp = round10(base * R_HEALTH_EMP);
    healthOrg = round10(base * R_HEALTH_ORG);

    longtermEmp = round10(healthEmp * R_LONGTERM_EMP);
    longtermOrg = round10(healthOrg * R_LONGTERM_ORG);

    employEmp = round10(base * R_EMPLOY_EMP);
    employOrg = round10(base * R_EMPLOY_ORG);

    accidentOrg = round10(base * R_ACCIDENT_ORG);

    retirement = round10(base * R_RETIRE);
    annualLeave = round10(base * R_ANNUAL_LEAVE);

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

    totalDeductions = round10(totalDeductions);

    lastNetPay = netPay;
    netPay = round10(totalCollected - totalDeductions);

    if (Math.abs(netPay - lastNetPay) < tolerance) break;
  }

  return {
    totalCollected: round10(totalCollected),
    netPay,
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

// ------------------------
//      화면 갱신
// ------------------------

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

  $("iterInfo").textContent =
    result.iterations > 0
      ? `반복 계산 ${result.iterations}회 수행 (10원 단위 수렴)`
      : "아직 계산 전입니다.";
}

// ------------------------
//     버튼 클릭 함수
// ------------------------

function handleCalculate() {
  const students = parseInt($("students").value || "0", 10);
  const unitFee = parseInt($("unitFee").value || "0", 10);

  const result = calcCoachDistribution(students, unitFee);
  updateView(result);
}

// 페이지 열릴 때 기본 계산
handleCalculate();