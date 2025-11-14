
// 숫자 입력이 비어있을 때 0으로 처리하는 도우미
function toNumber(v) {
  if (v === null || v === undefined || v === "") return 0;
  var n = Number(v);
  return isNaN(n) ? 0 : n;
}

// 원화 포맷(3자리 콤마 + '원')
function formatWon(n) {
  return n.toLocaleString("ko-KR") + "원";
}

// 10원 단위 버림 (일의 자리 0 만들기)
function floorTo10(n) {
  return Math.floor(n / 10) * 10;
}

// 체크박스에서 근무요일 배열 가져오기 (0=일 ~ 6=토)
function getWorkingWeekdays() {
  var cbList = document.querySelectorAll(".weekday");
  var days = [];
  cbList.forEach(function (cb) {
    if (cb.checked) {
      days.push(Number(cb.value));
    }
  });

  // 아무것도 선택 안 했으면 월~금 기본셋
  if (days.length === 0) {
    return [1, 2, 3, 4, 5];
  }
  return days;
}

// 시작일~종료일 사이의 근무일수 세기 (양끝 포함)
function countWorkingDays(startStr, endStr, weekdaysArr) {
  if (!startStr || !endStr) return 0;

  var start = new Date(startStr);
  var end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  if (end < start) return 0;

  var count = 0;
  var cur = new Date(start.getTime());

  while (cur <= end) {
    var day = cur.getDay(); // 0=일 ~ 6=토
    if (weekdaysArr.indexOf(day) !== -1) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// 항목별 월액 합산 (학기중 / 방학중)
function getMonthlyTotals() {
  var rows = document.querySelectorAll(".allowance-row");
  var semSum = 0;
  var vacSum = 0;

  rows.forEach(function (row) {
    var s = row.querySelector(".allow-semester");
    var v = row.querySelector(".allow-vacation");
    semSum += toNumber(s && s.value);
    vacSum += toNumber(v && v.value);
  });

  return {
    semester: semSum,
    vacation: vacSum
  };
}

// ----------------------
// 4. 기본 계산 (연간/기간용)
// ----------------------
function calculate() {
  var errorBox = document.getElementById("errorBox");
  errorBox.textContent = "";

  var weekdays = getWorkingWeekdays();

  // 기간 관련 입력
  var semStart = document.getElementById("semesterStart").value;
  var semEnd = document.getElementById("semesterEnd").value;

  var vac1Start = document.getElementById("vacation1Start").value;
  var vac1End = document.getElementById("vacation1End").value;
  var vac2Start = document.getElementById("vacation2Start").value;
  var vac2End = document.getElementById("vacation2End").value;

  // 월 기준 근무일수
  var semBaseDaysVal = toNumber(
    document.getElementById("semesterBaseDays").value
  );
  var vacBaseDaysVal = toNumber(
    document.getElementById("vacationBaseDays").value
  );

  if (semBaseDaysVal <= 0 || vacBaseDaysVal <= 0) {
    errorBox.textContent =
      "학기 중 / 방학 중의 '월 기준 근무일수'를 1 이상으로 입력해주세요.";
    return;
  }

  // 월 인건비 합계
  var monthly = getMonthlyTotals();
  var semMonthTotal = monthly.semester;
  var vacMonthTotal = monthly.vacation;

  // 1일 단가 계산
  var semDaily = semMonthTotal / semBaseDaysVal;
  var vacDaily = vacMonthTotal / vacBaseDaysVal;

  // 실제 근무일수 계산
  var semRealDays = countWorkingDays(semStart, semEnd, weekdays);
  var vac1RealDays = countWorkingDays(vac1Start, vac1End, weekdays);
  var vac2RealDays = countWorkingDays(vac2Start, vac2End, weekdays);
  var vacRealDays = vac1RealDays + vac2RealDays;

  // 기간별 인건비 (아직 10원 버림 전)
  var semTotalRaw = semDaily * semRealDays;
  var vacTotalRaw = vacDaily * vacRealDays;

  // 최종 합계 10원 단위 버림
  var grandRaw = semTotalRaw + vacTotalRaw;
  var grandRounded = floorTo10(grandRaw);

  // 화면 뿌려주기
  document.getElementById("semMonthTotal").textContent =
    formatWon(Math.round(semMonthTotal));
  document.getElementById("vacMonthTotal").textContent =
    formatWon(Math.round(vacMonthTotal));

  document.getElementById("semBaseDays").textContent =
    semBaseDaysVal.toLocaleString("ko-KR") + "일";
  document.getElementById("vacBaseDays").textContent =
    vacBaseDaysVal.toLocaleString("ko-KR") + "일";

  document.getElementById("semDailyRate").textContent =
    formatWon(Math.round(semDaily));
  document.getElementById("vacDailyRate").textContent =
    formatWon(Math.round(vacDaily));

  document.getElementById("semRealDays").textContent =
    semRealDays.toLocaleString("ko-KR") + "일";
  document.getElementById("vac1RealDays").textContent =
    vac1RealDays.toLocaleString("ko-KR") + "일";
  document.getElementById("vac2RealDays").textContent =
    vac2RealDays.toLocaleString("ko-KR") + "일";
  document.getElementById("vacRealDays").textContent =
    vacRealDays.toLocaleString("ko-KR") + "일";

  document.getElementById("semTotal").textContent =
    formatWon(Math.round(semTotalRaw));
  document.getElementById("vacTotal").textContent =
    formatWon(Math.round(vacTotalRaw));

  document.getElementById("grandTotal").textContent =
    formatWon(grandRounded);
}

// ----------------------
// 5. 분기/기간 행 추가
// ----------------------
function addAllowanceRow() {
  var container = document.getElementById("allowance-rows");
  var div = document.createElement("div");
  div.className = "allowance-row";
  div.innerHTML =
    '<input type="text" class="allow-name" placeholder="기타 수당">' +
    '<input type="number" class="allow-semester" min="0" step="1" placeholder="0">' +
    '<input type="number" class="allow-vacation" min="0" step="1" placeholder="0">';
  container.appendChild(div);
}

function addSegmentRow() {
  var container = document.getElementById("segment-rows");
  var div = document.createElement("div");
  div.className = "segment-row";
  div.innerHTML =
    '<input type="text" class="seg-name" placeholder="예: 7월 (방학중)" />' +
    '<select class="seg-type">' +
    '<option value="sem">학기 중 (4시간)</option>' +
    '<option value="vac">방학 중 (8시간)</option>' +
    "</select>" +
    '<input type="number" class="seg-days" min="0" step="1" placeholder="예: 10" />' +
    '<input type="text" class="seg-note" placeholder="예: 7.21.~8.17. 방학중" />';
  container.appendChild(div);
}

// ----------------------
// 6. 분기 정당신청액 계산
// ----------------------
function calculateQuarter() {
  var qErrorBox = document.getElementById("qErrorBox");
  qErrorBox.textContent = "";

  var quarterNameInput = document.getElementById("quarterName");
  var qName = quarterNameInput.value.trim() || "분기 미지정";

  // 월 기준 근무일수
  var semBaseDaysVal = toNumber(
    document.getElementById("semesterBaseDays").value
  );
  var vacBaseDaysVal = toNumber(
    document.getElementById("vacationBaseDays").value
  );

  if (semBaseDaysVal <= 0 || vacBaseDaysVal <= 0) {
    qErrorBox.textContent =
      "먼저 3번에서 학기 중 / 방학 중 '월 기준 근무일수'를 1 이상으로 입력해주세요.";
    return;
  }

  // 월 인건비 합계
  var monthly = getMonthlyTotals();
  var semMonthTotal = monthly.semester;
  var vacMonthTotal = monthly.vacation;

  if (semMonthTotal <= 0 && vacMonthTotal <= 0) {
    qErrorBox.textContent =
      "2번에서 학기 중 / 방학 중 월 인건비(기본급 및 각종 수당)를 먼저 입력해주세요.";
    return;
  }

  var semDaily = semMonthTotal / semBaseDaysVal;
  var vacDaily = vacMonthTotal / vacBaseDaysVal;

  var segRows = document.querySelectorAll(".segment-row");
  if (!segRows.length) {
    qErrorBox.textContent = "기간 행이 없습니다. 최소 1개 이상 입력해주세요.";
    return;
  }

  var semWageSum = 0; // 학기중 급여
  var vacWageSum = 0; // 방학중 급여

  segRows.forEach(function (row) {
    var typeSel = row.querySelector(".seg-type");
    var daysInput = row.querySelector(".seg-days");
    var type = typeSel ? typeSel.value : "sem";
    var days = toNumber(daysInput && daysInput.value);

    if (days <= 0) {
      // 근무일수 0이거나 빈 행은 계산에서 제외
      return;
    }

    if (type === "sem") {
      semWageSum += semDaily * days;
    } else {
      vacWageSum += vacDaily * days;
    }
  });

  var wageTotal = semWageSum + vacWageSum;

  if (wageTotal <= 0) {
    qErrorBox.textContent =
      "입력된 근무일수 기준 급여 합계가 0원입니다. 기간/근무일수를 다시 확인해주세요.";
    return;
  }

  // 사회보험 기관부담금 비율 (1분기 산출기초 엑셀 참고)
  var health = 0.03545;
  var pension = 0.045;
  var employment = 0.0175;
  var accident = 0.00966;
  var ltc = health * 0.1295; // 노인장기요양보험: 건강보험료의 12.95%

  var employerRate =
    health + pension + employment + accident + ltc; // ≒ 0.1122 (11.22%)

  var employerTotal = wageTotal * employerRate;
  var grandRaw = wageTotal + employerTotal;
  var grandFinal = floorTo10(grandRaw);

  // 화면 반영
  document.getElementById("qNameDisplay").textContent = qName;

  document.getElementById("qSemWage").textContent =
    formatWon(Math.round(semWageSum));
  document.getElementById("qVacWage").textContent =
    formatWon(Math.round(vacWageSum));
  document.getElementById("qWageTotal").textContent =
    formatWon(Math.round(wageTotal));

  document.getElementById("qEmployerTotal").textContent =
    formatWon(Math.round(employerTotal));

  document.getElementById("qGrandRaw").textContent =
    formatWon(Math.round(grandRaw));
  document.getElementById("qGrandFinal").textContent =
    formatWon(grandFinal);
}

// ----------------------
// 초기 이벤트 연결
// ----------------------
document.addEventListener("DOMContentLoaded", function () {
  var calcBtn = document.getElementById("calcBtn");
  if (calcBtn) {
    calcBtn.addEventListener("click", calculate);
  }

  var addRowBtn = document.getElementById("addRowBtn");
  if (addRowBtn) {
    addRowBtn.addEventListener("click", addAllowanceRow);
  }

  var addSegmentBtn = document.getElementById("addSegmentBtn");
  if (addSegmentBtn) {
    addSegmentBtn.addEventListener("click", addSegmentRow);
  }

  var calcQuarterBtn = document.getElementById("calcQuarterBtn");
  if (calcQuarterBtn) {
    calcQuarterBtn.addEventListener("click", calculateQuarter);
  }
});