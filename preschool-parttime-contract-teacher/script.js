
// --------- 공통 유틸 ---------
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
  // 아무것도 안 찍으면 월~금
  if (result.length === 0) return [1, 2, 3, 4, 5];
  return result;
}

function fmtDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtMonthKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return d;
}

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

// 에러 표시 간단 헬퍼
function setError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg || "";
  el.style.color = msg ? "#c0392b" : ""; // 빨간색
  el.style.fontWeight = msg ? "600" : "";
  el.style.marginTop = msg ? "6px" : "";
}

// --------- 봉급표 (호봉 → 8시간 기준 월 기본급) ---------
// 네가 준 값 그대로 사용 (8시간 기준 월액)
const payTable = {
  1: 1915100,
  2: 1973100,
  3: 2031900,
  4: 2090500,
  5: 2149600,
  6: 2208600,
  7: 2267000,
  8: 2325100,
  9: 2365500,
  10: 2387800,
  11: 2408300,
  12: 2455700,
  13: 2567600,
  14: 2679900,
  15: 2792000,
  16: 2904500,
  17: 3015500,
  18: 3131900,
  19: 3247500,
  20: 3363300,
  21: 3478900,
  22: 3607300,
  23: 3734600,
  24: 3862300,
  25: 3989800,
  26: 4117800,
  27: 4251300,
  28: 4384500,
  29: 4523800,
  30: 4663600,
  31: 4803000,
  32: 4942200,
  33: 5083700,
  34: 5224600,
  35: 5365800,
  36: 5506400,
  37: 5628700,
  38: 5751200,
  39: 5873900,
  40: 5995800
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

  const base4 = base * 0.5; // 4시간 기준 기본급
  sem4Input.value = base4 ? Math.round(base4) : "";
  vac8Input.value = base ? Math.round(base) : "";
}

// 사용자가 8시간 기본급을 직접 손댔을 때 4시간/방학 기본급도 같이 맞춰주기
function syncBasePayDerived() {
  const base8Input = document.getElementById("basePay8");
  const sem4Input = document.getElementById("basePay4Sem");
  const vac8Input = document.getElementById("basePay8Vac");

  const base = toNumber(base8Input.value);
  const base4 = base * 0.5;
  sem4Input.value = base4 ? Math.round(base4) : "";
  vac8Input.value = base ? Math.round(base) : "";
}

// --------- 동적 행 추가 (수당/연단위/방학/미운영) ---------
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
  setError("monthError", "");

  const startStr = document.getElementById("contractStart").value;
  const endStr = document.getElementById("contractEnd").value;
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  if (!start || !end || end < start) {
    setError("monthError", "계약 시작일/종료일을 올바르게 입력해주세요.");
    return;
  }

  const weekdays = getCheckedWeekdays();

  const dayType = {}; // dateKey -> 'sem' | 'vac' | 'noaf'
  eachDate(startStr, endStr, d => {
    dayType[fmtDateKey(d)] = "sem";
  });

  // 방학: vac
  document.querySelectorAll(".vac-row").forEach(row => {
    const s = row.querySelector(".vac-start").value;
    const e = row.querySelector(".vac-end").value;
    eachDate(s, e, d => {
      const key = fmtDateKey(d);
      if (key in dayType) dayType[key] = "vac";
    });
  });

  // 미운영: noaf (우선순위 더 높게)
  document.querySelectorAll(".noaf-row").forEach(row => {
    const s = row.querySelector(".noaf-start").value;
    const e = row.querySelector(".noaf-end").value;
    eachDate(s, e, d => {
      const key = fmtDateKey(d);
      if (key in dayType) dayType[key] = "noaf";
    });
  });

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
  if (!monthKeys.length) {
    setError("monthError", "선택된 근무 요일 기준으로 근무일이 한 건도 없습니다.");
    return;
  }

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

// --------- 월별 인건비 + 정근수당 로직 포함 계산 ---------
function calcMonthly() {
  setError("calcError", "");
  const resultWrap = document.getElementById("resultWrap");
  resultWrap.innerHTML = "";

  const semBaseDays = toNumber(
    document.getElementById("semesterBaseDays").value
  );
  const vacBaseDays = toNumber(
    document.getElementById("vacationBaseDays").value
  );

  if (semBaseDays <= 0 || vacBaseDays <= 0) {
    setError(
      "calcError",
      "학기 중/방학 중 월 기준 근무일수를 1 이상으로 입력해주세요."
    );
    return;
  }

  // 기본급
  const base8 = toNumber(document.getElementById("basePay8").value);
  const base4Sem = toNumber(document.getElementById("basePay4Sem").value);
  const base8Vac = toNumber(document.getElementById("basePay8Vac").value);

  if (!base8 || !base4Sem || !base8Vac) {
    setError(
      "calcError",
      "기본급(8시간 기준) 및 4시간/방학 기본급이 비어 있습니다. 호봉 선택 또는 직접 입력 후 다시 시도해주세요."
    );
    return;
  }

  // 월 단위 수당
  let allowSemSum = 0;
  let allowVacSum = 0;
  document.querySelectorAll(".allowance-row").forEach(row => {
    const s = row.querySelector(".allow-semester");
    const v = row.querySelector(".allow-vacation");
    allowSemSum += toNumber(s && s.value);
    allowVacSum += toNumber(v && v.value);
  });

  // 기본급만 따로, 기본급+수당 합쳐서도 따로 본다.
  const baseSemMonth = base4Sem;
  const baseVacMonth = base8Vac;
  const semMonthTotal = base4Sem + allowSemSum;
  const vacMonthTotal = base8Vac + allowVacSum;

  // 1일 단가 (기본급만 / 전체)
  const semDailyBase = baseSemMonth / semBaseDays;
  const vacDailyBase = baseVacMonth / vacBaseDays;

  const semDailyAll = semMonthTotal / semBaseDays;
  const vacDailyAll = vacMonthTotal / vacBaseDays;

  // 월별 근무일수 가져오기
  const monthRows = document.querySelectorAll(".month-row");
  if (!monthRows.length) {
    setError(
      "calcError",
      "먼저 '월별 근무일수 계산하기'를 눌러 월별 표를 만든 뒤 다시 시도하세요."
    );
    return;
  }

  const months = [];
  let totalWorkDays = 0;
  let totalBaseSubAllMonths = 0;

  monthRows.forEach(row => {
    const monthKey = row.getAttribute("data-month");
    const sem = toNumber(row.querySelector(".m-sem").value);
    const vac = toNumber(row.querySelector(".m-vac").value);
    const noaf = toNumber(row.querySelector(".m-noaf").value);

    const workDays = sem + vac + noaf;

    const baseSubTotal =
      semDailyBase * sem + vacDailyBase * vac + semDailyBase * noaf; // 기본급 부분만
    const wageSubTotalAll =
      semDailyAll * sem + vacDailyAll * vac + semDailyAll * noaf; // 기본급+수당

    totalWorkDays += workDays;
    totalBaseSubAllMonths += baseSubTotal;

    months.push({
      monthKey,
      sem,
      vac,
      noaf,
      workDays,
      baseSubTotal,
      wageSubTotalAll
    });
  });

  if (totalWorkDays <= 0) {
    setError("calcError", "월별 총 근무일수가 0입니다. 근무일수를 다시 확인해주세요.");
    return;
  }

  // 연 단위 수당 분리: 정근수당 vs 기타
  let annualTotalJeonggeun = 0;
  let annualTotalOthers = 0;
  document.querySelectorAll(".annual-row").forEach(row => {
    const name = (row.querySelector(".annual-name").value || "").trim();
    const amt = toNumber(row.querySelector(".annual-amount").value);
    if (!amt) return;
    if (name.includes("정근수당")) {
      annualTotalJeonggeun += amt;
    } else {
      annualTotalOthers += amt;
    }
  });

  // 보험료 비율 (건강+연금+고용+산재+장기요양)
  const health = 0.03545;
  const pension = 0.045;
  const employment = 0.0175;
  const accident = 0.00966;
  const ltc = health * 0.1295; // 장기요양: 건강보험료의 12.95%
  const employerRate = health + pension + employment + accident + ltc;

  // 월별 계산
  let totalWageAll = 0;
  let totalAnnualJG = 0;
  let totalAnnualOthers = 0;
  let totalEmployerAll = 0;
  let totalFinalAll = 0;

  const table = document.createElement("table");
  let tbodyHtml = "";

  months.forEach(m => {
    // 기본급+수당 시간제 인건비 소계
    const wageSubTotal = m.wageSubTotalAll;

    // 정근수당: "기본급 부분 합계" 기준 비율
    let jgForMonth = 0;
    if (annualTotalJeonggeun > 0 && totalBaseSubAllMonths > 0) {
      jgForMonth =
        (annualTotalJeonggeun * m.baseSubTotal) / totalBaseSubAllMonths;
    }

    // 그 외 연단위 수당: 근무일수 비례
    let otherAnnualForMonth = 0;
    if (annualTotalOthers > 0) {
      otherAnnualForMonth =
        (annualTotalOthers * m.workDays) / totalWorkDays;
    }

    const annualForMonth = jgForMonth + otherAnnualForMonth;
    const wageTotal = wageSubTotal + annualForMonth;
    const employer = wageTotal * employerRate;
    const grand = wageTotal + employer;
    const grandFinal = floorTo10(grand);

    totalWageAll += wageSubTotal;
    totalAnnualJG += jgForMonth;
    totalAnnualOthers += otherAnnualForMonth;
    totalEmployerAll += employer;
    totalFinalAll += grandFinal;

    tbodyHtml += `
      <tr>
        <td>${m.monthKey}</td>
        <td class="numeric">${m.sem}</td>
        <td class="numeric">${m.vac}</td>
        <td class="numeric">${m.noaf}</td>
        <td class="numeric">${formatWon(Math.round(wageSubTotal))}</td>
        <td class="numeric">${formatWon(Math.round(jgForMonth))}</td>
        <td class="numeric">${formatWon(Math.round(otherAnnualForMonth))}</td>
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
        <th>시간제 인건비 소계<br/>(기본급+월수당)</th>
        <th>정근수당 배분액</th>
        <th>그 외 연단위 수당 배분액</th>
        <th>기관부담금 합계</th>
        <th>월 최종 합계<br/>(10원 단위 버림)</th>
      </tr>
    </thead>
    <tbody>
      ${tbodyHtml}
    </tbody>
    <tfoot>
      <tr>
        <td>합계</td>
        <td></td><td></td><td></td>
        <td class="numeric">${formatWon(Math.round(totalWageAll))}</td>
        <td class="numeric">${formatWon(Math.round(totalAnnualJG))}</td>
        <td class="numeric">${formatWon(Math.round(totalAnnualOthers))}</td>
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
    "※ 정근수당은 '기본급 부분'이 많이 나오는 달(방학이 많이 낀 달 포함)에 더 많이 배분되도록 계산했습니다. 그 외 연단위 수당은 근무일수 비율로 배분됩니다.";

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
