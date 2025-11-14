//251114금 


function toNumber(v) {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function formatWon(n) {
  return n.toLocaleString("ko-KR") + "원";
}

function floorTo10(n) {
  return Math.floor(n / 10) * 10;
}

function getCheckedWeekdays() {
  const cbs = document.querySelectorAll(".weekday");
  const result = [];
  cbs.forEach(cb => {
    if (cb.checked) result.push(Number(cb.value));
  });
  // 아무것도 없으면 월~금
  if (result.length === 0) return [1, 2, 3, 4, 5];
  return result;
}

// 날짜 문자열 YYYY-MM-DD로 포맷
function fmtDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 월 키 YYYY-MM
function fmtMonthKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// 날짜 문자열 → Date
function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return d;
}

// 두 날짜 범위를 돌면서 콜백
function eachDate(startStr, endStr, cb) {
  const s = parseDate(startStr);
  const e = parseDate(endStr);
  if (!s || !e || e < s) return;
  const cur = new Date(s.getTime());
  while (cur <= e) {
    cb(new Date(cur.getTime()));
    cur.setDate(cur.getDate() + 1);
  }
}

// --------- 봉급표 (호봉 → 8시간 기준 월 기본급) ---------
const payTable = {
  1: 1,915,100,
  2: 1,973,100,
  3: 2,031,900,
  4: 2,090,500,
  5: 2,149,600,
  6: 2,208,600,
  7: 2,267,000,
  8: 2,325,100,
  9: 2,365,500,
  10: 2,387,800,
  11: 2,408,300,
  12: 2,455,700,
  13: 2,567,600,
  14: 2,679,900,
  15: 2,792,000,
  16: 2,904,500,
  17: 3,015,500,
  18: 3,131,900,
  19: 3,247,500,
  20: 3,363,300,
  21: 3,478,900,
  22: 3,607,300,
  23: 3,734,600,
  24: 3,862,300,
  25: 3,989,800,
  26: 4,117,800,
  27: 4,251,300,
  28: 4,384,500,
  29: 4,523,800,
  30: 4,663,600,
  31: 4,803,000,
  32: 4,942,200,
  33: 5,083,700,
  34: 5,224,600,
  35: 5,365,800,
  36: 5,506,400,
  37: 5,628,700,
  38: 5,751,200,
  39: 5,873,900,
  40: 5,995,800,
};

// --------- 호봉 선택 시 기본급 세팅 ---------
function updateBasePayFromStep() {
  const stepSelect = document.getElementById("stepSelect");
  const base8Input = document.getElementById("basePay8");
  const sem4Input = document.getElementById("basePay4Sem");
  const vac8Input = document.getElementById("basePay8Vac");

  const stepVal = stepSelect.value;
  if (!stepVal) return;

  const base = payTable[stepVal] || 0;
  base8Input.value = base || "";

  // 4시간은 단순히 1/2로 처리 (시간제 4h 기준)
  const base4 = base * 0.5;
  sem4Input.value = base4 ? Math.round(base4) : "";
  vac8Input.value = base ? Math.round(base) : "";
}

// 봉급 수동 입력시 4시간 기본급 다시 계산
function syncBasePayDerived() {
  const base8Input = document.getElementById("basePay8");
  const sem4Input = document.getElementById("basePay4Sem");
  const vac8Input = document.getElementById("basePay8Vac");

  const base = toNumber(base8Input.value);
  const base4 = base * 0.5;
  sem4Input.value = base4 ? Math.round(base4) : "";
  vac8Input.value = base ? Math.round(base) : "";
}

// 수당, 연단위 지급 수당 ,방학, 방과후 미운영 기간
function addAllowanceRow() {
  const tbody = document.getElementById("allowanceBody");
  const tr = document.createElement("tr");
  tr.className = "allowance-row";
  tr.innerHTML = `
    <td><input type="text" class="allow-name" placeholder="기타 수당" /></td>
    <td><input type="number" class="allow-semester" placeholder="0" /></td>
    <td><input type="number" class="allow-vacation" placeholder="0" /></td>
  `;
  tbody.appendChild(tr);
}

function addAnnualRow() {
  const tbody = document.getElementById("annualBody");
  const tr = document.createElement("tr");
  tr.className = "annual-row";
  tr.innerHTML = `
    <td><input type="text" class="annual-name" placeholder="기타 연 단위 수당" /></td>
    <td><input type="number" class="annual-amount" placeholder="0" /></td>
  `;
  tbody.appendChild(tr);
}

function addVacRow() {
  const tbody = document.getElementById("vacationBody");
  const tr = document.createElement("tr");
  tr.className = "vac-row";
  tr.innerHTML = `
    <td><input type="date" class="vac-start" /></td>
    <td><input type="date" class="vac-end" /></td>
    <td><input type="text" class="vac-note" placeholder="예: 여름방학 2차" /></td>
  `;
  tbody.appendChild(tr);
}

function addNoAfRow() {
  const tbody = document.getElementById("noAfBody");
  const tr = document.createElement("tr");
  tr.className = "noaf-row";
  tr.innerHTML = `
    <td><input type="date" class="noaf-start" /></td>
    <td><input type="date" class="noaf-end" /></td>
    <td><input type="text" class="noaf-note" placeholder="예: 방과후 미운영기간 2" /></td>
  `;
  tbody.appendChild(tr);
}

// --------- 월별 근무일수 자동 계산 ---------
function buildMonthTable() {
  const monthError = document.getElementById("monthError");
  monthError.textContent = "";

  const startStr = document.getElementById("contractStart").value;
  const endStr = document.getElementById("contractEnd").value;
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  if (!start || !end || end < start) {
    monthError.textContent = "계약 시작일/종료일 입력하세요";
    return;
  }

  const weekdays = getCheckedWeekdays();

  // 기본적 설정: 학기중
  const dayType = {}; // dateKey -> 'sem' | 'vac' | 'noaf'

  eachDate(startStr, endStr, d => {
    dayType[fmtDateKey(d)] = "sem";
  });

  // 방학 구간: 'vac'
  document.querySelectorAll(".vac-row").forEach(row => {
    const s = row.querySelector(".vac-start").value;
    const e = row.querySelector(".vac-end").value;
    eachDate(s, e, d => {
      const key = fmtDateKey(d);
      if (key in dayType) dayType[key] = "vac";
    });
  });

  // 방학중 방과후 미운영 구간: 'noaf' (방학보다 우선)
  document.querySelectorAll(".noaf-row").forEach(row => {
    const s = row.querySelector(".noaf-start").value;
    const e = row.querySelector(".noaf-end").value;
    eachDate(s, e, d => {
      const key = fmtDateKey(d);
      if (key in dayType) dayType[key] = "noaf";
    });
  });

  // 월별 집계
  const monthMap = {}; // monthKey -> {semDays, vacDays, noafDays}
  let cur = new Date(start.getTime());
  while (cur <= end) {
    const dow = cur.getDay();
    const key = fmtDateKey(cur);
    const monthKey = fmtMonthKey(cur);
    if (!monthMap[monthKey]) {
      monthMap[monthKey] = { semDays: 0, vacDays: 0, noafDays: 0 };
    }

    if (weekdays.indexOf(dow) !== -1 && dayType[key]) {
      const t = dayType[key];
      if (t === "sem") monthMap[monthKey].semDays += 1;
      else if (t === "vac") monthMap[monthKey].vacDays += 1;
      else if (t === "noaf") monthMap[monthKey].noafDays += 1;
    }

    cur.setDate(cur.getDate() + 1);
  }

  const monthKeys = Object.keys(monthMap).sort();
  if (monthKeys.length === 0) {
    monthError.textContent = "선택된 근무 요일 기준으로 근무일이 한 건도 없습니다.";
    return;
  }

  // 입력 표 생성
  const wrap = document.getElementById("monthTableWrap");
  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>연·월</th>
        <th>학기 중 4시간 근무일수</th>
        <th>방학 8시간 근무일수</th>
        <th>미운영 4시간 근무일수</th>
      </tr>
    </thead>
    <tbody>
      ${monthKeys
        .map(mk => {
          const d = monthMap[mk];
          return `
            <tr class="month-row" data-month="${mk}">
              <td>${mk}</td>
              <td><input type="number" class="m-sem" value="${d.semDays}" /></td>
              <td><input type="number" class="m-vac" value="${d.vacDays}" /></td>
              <td><input type="number" class="m-noaf" value="${d.noafDays}" /></td>
            </tr>
          `;
        })
        .join("")}
    </tbody>
  `;
  const div = document.createElement("div");
  div.className = "table-wrap";
  div.appendChild(table);
  wrap.innerHTML = "";
  wrap.appendChild(div);
}

// --------- 월별 인건비 계산 ---------
function calcMonthly() {
  const err = document.getElementById("calcError");
  err.textContent = "";
  const resultWrap = document.getElementById("resultWrap");
  resultWrap.innerHTML = "";

  // 기본 입력들
  const semBaseDays = toNumber(
    document.getElementById("semesterBaseDays").value
  );
  const vacBaseDays = toNumber(
    document.getElementById("vacationBaseDays").value
  );
  if (semBaseDays <= 0 || vacBaseDays <= 0) {
    err.textContent = "학기 중/방학 중 월 기준 근무일수를 1 이상으로 입력해주세요.";
    return;
  }

  // 기본급
  const base8 = toNumber(document.getElementById("basePay8").value);
  const base4Sem = toNumber(document.getElementById("basePay4Sem").value);
  const base8Vac = toNumber(document.getElementById("basePay8Vac").value);

  if (!base8 || !base4Sem || !base8Vac) {
    err.textContent = "호봉 선택하거나 기본급 수동 입력 바람";
    return;
  }

  // 월 단위 기본 수당 합산
  let allowSemSum = 0;
  let allowVacSum = 0;
  document.querySelectorAll(".allowance-row").forEach(row => {
    const s = row.querySelector(".allow-semester");
    const v = row.querySelector(".allow-vacation");
    allowSemSum += toNumber(s && s.value);
    allowVacSum += toNumber(v && v.value);
  });

  // 학기 중 / 방학 월 총액
  const semMonthTotal = base4Sem + allowSemSum;
  const vacMonthTotal = base8Vac + allowVacSum;

  // 1일 단가
  const semDaily = semMonthTotal / semBaseDays;
  const vacDaily = vacMonthTotal / vacBaseDays;

  // 연 단위 수당 총합
  let annualTotal = 0;
  document.querySelectorAll(".annual-row").forEach(row => {
    const a = row.querySelector(".annual-amount");
    annualTotal += toNumber(a && a.value);
  });

  // 월별 근무일수
  const monthRows = document.querySelectorAll(".month-row");
  if (!monthRows.length) {
    err.textContent = "월별 근무일수 계산하기 먼저 누르쇼 ";
    return;
  }

  const months = [];
  let totalWorkDays = 0;
  monthRows.forEach(row => {
    const monthKey = row.getAttribute("data-month");
    const sem = toNumber(row.querySelector(".m-sem").value);
    const vac = toNumber(row.querySelector(".m-vac").value);
    const noaf = toNumber(row.querySelector(".m-noaf").value);
    const workDays = sem + vac + noaf;
    totalWorkDays += workDays;
    months.push({ monthKey, sem, vac, noaf, workDays });
  });

  if (totalWorkDays <= 0) {
    err.textContent = "근무일수 다시 확인 바람";
    return;
  }

  // 보험료 비율 (건강+연금+고용+산재+장기요양)
  const health = 0.03545;
  const pension = 0.045;
  const employment = 0.0175;
  const accident = 0.00966;
  const ltc = health * 0.1295; // 장기요양: 건강보험료의 12.95%
  const employerRate = health + pension + employment + accident + ltc;

  // 월별 계산
  let totalWageAll = 0;
  let totalAnnualAll = 0;
  let totalEmployerAll = 0;
  let totalFinalAll = 0;

  // 표 만들기
  const table = document.createElement("table");
  let tbodyHtml = "";

  months.forEach(m => {
    const semWage = semDaily * m.sem;
    const vacWage = vacDaily * m.vac;
    const noafWage = semDaily * m.noaf; // 미운영도 4시간이라 학기중 단가 사용

    const wageSubTotal = semWage + vacWage + noafWage;

    // 연단위 수당 배분: 근무일수 비례
    const annualForMonth = (annualTotal * m.workDays) / totalWorkDays;

    const wageTotal = wageSubTotal + annualForMonth;
    const employer = wageTotal * employerRate;
    const grand = wageTotal + employer;
    const grandFinal = floorTo10(grand);

    totalWageAll += wageSubTotal;
    totalAnnualAll += annualForMonth;
    totalEmployerAll += employer;
    totalFinalAll += grandFinal;

    tbodyHtml += `
      <tr>
        <td>${m.monthKey}</td>
        <td class="numeric">${m.sem}</td>
        <td class="numeric">${m.vac}</td>
        <td class="numeric">${m.noaf}</td>
        <td class="numeric">${formatWon(Math.round(wageSubTotal))}</td>
        <td class="numeric">${formatWon(Math.round(annualForMonth))}</td>
        <td class="numeric">${formatWon(Math.round(employer))}</td>
        <td class="numeric">${formatWon(grandFinal)}</td>
      </tr>
    `;
  });

  table.innerHTML = `
    <thead>
      <tr>
        <th>연·월</th>
        <th>학기중 4시간 일수</th>
        <th>방학 8시간 일수</th>
        <th>미운영 4시간 일수</th>
        <th>시간제 인건비 소계</th>
        <th>연단위 수당 배분액</th>
        <th>기관부담금 합계</th>
        <th>월 최종 합계 (10원 단위 버림)</th>
      </tr>
    </thead>
    <tbody>
      ${tbodyHtml}
    </tbody>
    <tfoot>
      <tr>
        <td>합계</td>
        <td></td>
        <td></td>
        <td></td>
        <td class="numeric">${formatWon(Math.round(totalWageAll))}</td>
        <td class="numeric">${formatWon(Math.round(totalAnnualAll))}</td>
        <td class="numeric">${formatWon(Math.round(totalEmployerAll))}</td>
        <td class="numeric">${formatWon(floorTo10(totalFinalAll))}</td>
      </tr>
    </tfoot>
  `;

  const wrapDiv = document.createElement("div");
  wrapDiv.className = "table-wrap";
  wrapDiv.appendChild(table);

  const note = document.createElement("p");
  note.className = "note small";
  note.textContent =
    "※ '시간제 인건비 소계'는 학기중/방학/미운영 일할계산 합계입니다. '연단위 수당 배분액'은 계약기간 전체 근무일수 비율로 나눈 금액입니다.";

  resultWrap.innerHTML = "";
  resultWrap.appendChild(wrapDiv);
  resultWrap.appendChild(note);
}

// --------- 이벤트 연결 ---------
document.addEventListener("DOMContentLoaded", () => {
  const stepSelect = document.getElementById("stepSelect");
  if (stepSelect) {
    stepSelect.addEventListener("change", updateBasePayFromStep);
  }

  const basePay8 = document.getElementById("basePay8");
  if (basePay8) {
    basePay8.addEventListener("input", syncBasePayDerived);
  }

  const addAllowBtn = document.getElementById("addAllowBtn");
  if (addAllowBtn) addAllowBtn.addEventListener("click", addAllowanceRow);

  const addAnnualBtn = document.getElementById("addAnnualBtn");
  if (addAnnualBtn) addAnnualBtn.addEventListener("click", addAnnualRow);

  const addVacBtn = document.getElementById("addVacBtn");
  if (addVacBtn) addVacBtn.addEventListener("click", addVacRow);

  const addNoAfBtn = document.getElementById("addNoAfBtn");
  if (addNoAfBtn) addNoAfBtn.addEventListener("click", addNoAfRow);

  const buildMonthBtn = document.getElementById("buildMonthBtn");
  if (buildMonthBtn) buildMonthBtn.addEventListener("click", buildMonthTable);

  const calcBtn = document.getElementById("calcBtn");
  if (calcBtn) calcBtn.addEventListener("click", calcMonthly);
});
