// 숫자 파싱 공통 함수
function num(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

// id로 숫자 읽어오기
function numById(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  return num(el.value);
}

// 날짜 문자열 → Date 객체 (유효성 체크 포함)
function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// 시작~종료 사이에서 토요일만 제외하고 일수 세기(양끝 포함)
function countDaysWithoutSaturday(startValue, endValue) {
  const s = parseDate(startValue);
  const e = parseDate(endValue);
  if (!s || !e || e < s) return 0;

  let cnt = 0;
  const d = new Date(s.getTime());
  while (d <= e) {
    const day = d.getDay(); // 0:일 ~ 6:토
    if (day !== 6) cnt++;
    d.setDate(d.getDate() + 1);
  }
  return cnt;
}

// 특정 연도의 전체 일수 및 토요일 제외 일수 계산
function calcYearDays(year) {
  if (!year) return { total: 0, noSat: 0 };
  const y = parseInt(year, 10);
  if (isNaN(y)) return { total: 0, noSat: 0 };

  const start = new Date(y, 0, 1);
  const end = new Date(y, 11, 31);

  let total = 0;
  let noSat = 0;

  const d = new Date(start.getTime());
  while (d <= end) {
    total++;
    if (d.getDay() !== 6) noSat++;
    d.setDate(d.getDate() + 1);
  }
  return { total, noSat };
}

// 제외기간 행 추가
function addExcludeRow(reason = "", days = "") {
  const tbody = document.getElementById("excludeBody");
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>
      <select class="exclude-reason">
        <option value="">선택(메모용)</option>
        <option value="병가">병가</option>
        <option value="무급휴직">무급휴직</option>
        <option value="육아휴직">육아휴직</option>
        <option value="산재휴직">산재휴직</option>
        <option value="기타">기타</option>
      </select>
    </td>
    <td>
      <input type="number" class="exclude-days" value="${days}" step="0.1" />
    </td>
    <td>
      <button type="button" class="btn-remove-exclude">삭제</button>
    </td>
  `;

  const select = tr.querySelector(".exclude-reason");
  if (select && reason) select.value = reason;

  tbody.appendChild(tr);
}

// 방학근무 보수 행 추가
function addWageRow(name = "", amount = "") {
  const tbody = document.getElementById("wageBody");
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>
      <input type="text" class="wage-name" value="${name}" placeholder="예: 방학근무수당, 주휴수당 등" />
    </td>
    <td>
      <input type="number" class="wage-amount" value="${amount}" step="100" />
    </td>
    <td style="text-align:center;">
      <input type="checkbox" class="wage-nontax" />
    </td>
    <td>
      <button type="button" class="btn-remove-wage">삭제</button>
    </td>
  `;

  tbody.appendChild(tr);
}

// 제외기간 합계 계산
function calcExcludeTotal() {
  const rows = document.querySelectorAll("#excludeBody tr");
  let total = 0;
  rows.forEach((row) => {
    const input = row.querySelector(".exclude-days");
    total += num(input && input.value);
  });
  return total;
}

// 방학근무 보수 합계 계산 (총액 / 과세 / 비과세)
function calcWageTotals() {
  const rows = document.querySelectorAll("#wageBody tr");
  let total = 0;
  let taxable = 0;
  let nontax = 0;

  rows.forEach((row) => {
    const amountInput = row.querySelector(".wage-amount");
    const check = row.querySelector(".wage-nontax");
    const amt = num(amountInput && amountInput.value);
    total += amt;
    if (check && check.checked) {
      nontax += amt;
    } else {
      taxable += amt;
    }
  });

  return { total, taxable, nontax };
}

// 통상임금 계산
function calcOrdinaryWage() {
  const typeEl = document.querySelector('input[name="workType"]:checked');
  const type = typeEl ? typeEl.value : "full";

  const basic = numById("owBasic");
  const seniority = numById("owSeniority");
  const meal = numById("owMeal");
  const job = numById("owJob");
  const bonusYear = numById("owBonusYear");
  const holidayYear = numById("owHolidayYear");

  let monthly = 0;
  let denom = 209; // 기본값: 전일제

  if (type === "full") {
    // 전일제: 기본+근속+급식+직무+(상여/12)+(명절/12)
    monthly =
      basic +
      seniority +
      meal +
      job +
      bonusYear / 12 +
      holidayYear / 12;
    denom = 209;
  } else if (type === "part5") {
    // 단시간 5시간: 직무수당 제외
    monthly =
      basic +
      seniority +
      meal +
      bonusYear / 12 +
      holidayYear / 12;
    denom = 130;
  } else if (type === "part6") {
    // 단시간 6시간: 직무수당 제외
    monthly =
      basic +
      seniority +
      meal +
      bonusYear / 12 +
      holidayYear / 12;
    denom = 156;
  }

  const hourly = denom > 0 ? monthly / denom : 0;

  document.getElementById("owMonthly").textContent = Math.round(monthly).toLocaleString();
  document.getElementById("owHourly").textContent = Math.round(hourly).toLocaleString();

  return { monthly, hourly };
}

// 연차 관련 계산
function calcAnnual(hourlyOrdinary) {
  const paidHoursPerDay = numById("paidHoursPerDay");
  const base = numById("annualBase");
  const extraSeniority = numById("annualExtraSeniority");
  const extraPrevVac = numById("annualExtraFromPrevVac");

  const totalAnnual = base + extraSeniority + extraPrevVac;

  const usedFull = numById("annualUsedFull");
  const usedHalf = numById("annualUsedHalf");
  const usedHours = numById("annualUsedHours");

  let usedDaysConv = usedFull + usedHalf * 0.5;
  if (paidHoursPerDay > 0) {
    usedDaysConv += usedHours / paidHoursPerDay;
  }

  const unused = Math.max(0, totalAnnual - usedDaysConv);
  const unusedPay =
    hourlyOrdinary > 0 && paidHoursPerDay > 0
      ? unused * hourlyOrdinary * paidHoursPerDay
      : 0;

  // 화면 반영
  document.getElementById("annualTotalDays").textContent = totalAnnual.toFixed(2);
  document.getElementById("annualUsedDaysConv").textContent = usedDaysConv.toFixed(2);
  document.getElementById("annualUnusedDays").textContent = unused.toFixed(2);
  document.getElementById("annualUnusedPay").textContent = Math.round(unusedPay).toLocaleString();

  return { totalAnnual, usedDaysConv, unused, unusedPay };
}

// 전년도 출근율 계산(참고용)
function calcPrevAttendance() {
  const termTotal = numById("prevTermTotalDays");
  const termWork = numById("prevTermWorkDays");
  const vacPaid = numById("prevVacPaidDays");

  if (termTotal <= 0) return 0;

  const rate = ((termWork + vacPaid) / termTotal) * 100;
  document.getElementById("prevAttendanceRate").textContent = rate.toFixed(1);
  return rate;
}

// 4대보험 계산
function calcSocialInsurance(baseFor4ins) {
  const npEmp = numById("npRateEmp") / 100;
  const npInd = numById("npRateInd") / 100;
  const hiEmp = numById("hiRateEmp") / 100;
  const hiInd = numById("hiRateInd") / 100;
  const uiEmp = numById("uiRateEmp") / 100;
  const uiInd = numById("uiRateInd") / 100;
  const ciEmp = numById("ciRateEmp") / 100;

  const npEmpAmt = baseFor4ins * npEmp;
  const npIndAmt = baseFor4ins * npInd;
  const hiEmpAmt = baseFor4ins * hiEmp;
  const hiIndAmt = baseFor4ins * hiInd;
  const uiEmpAmt = baseFor4ins * uiEmp;
  const uiIndAmt = baseFor4ins * uiInd;
  const ciEmpAmt = baseFor4ins * ciEmp;

  const empTotal = npEmpAmt + hiEmpAmt + uiEmpAmt + ciEmpAmt;
  const indTotal = npIndAmt + hiIndAmt + uiIndAmt;
  const grandTotal = empTotal + indTotal;

  document.getElementById("siEmpTotal").textContent = Math.round(empTotal).toLocaleString();
  document.getElementById("siIndTotal").textContent = Math.round(indTotal).toLocaleString();
  document.getElementById("siGrandTotal").textContent = Math.round(grandTotal).toLocaleString();

  return { empTotal, indTotal, grandTotal };
}

// 연말정산 세금 계산
function calcTax(baseForTax) {
  const rate = numById("avgTaxRate") / 100;
  const incomeTax = baseForTax * rate;
  const localTax = incomeTax * 0.1;
  const total = incomeTax + localTax;

  document.getElementById("incomeTax").textContent = Math.round(incomeTax).toLocaleString();
  document.getElementById("localTax").textContent = Math.round(localTax).toLocaleString();
  document.getElementById("taxTotal").textContent = Math.round(total).toLocaleString();

  return { incomeTax, localTax, total };
}

// 메인 재계산 함수
function recalcAll() {
  const year = document.getElementById("year").value;

  // 1) 연도별 달력 일수
  const yearInfo = calcYearDays(year);
  document.getElementById("calendarTotalDays").textContent = yearInfo.total;
  document.getElementById("calendarDaysNoSat").textContent = yearInfo.noSat;

  // 2) 제외기간
  const excludeTotal = calcExcludeTotal();
  document.getElementById("excludeTotalDays").textContent = excludeTotal.toFixed(1);

  const workable = Math.max(0, yearInfo.noSat - excludeTotal);
  document.getElementById("workableDays").textContent = workable.toFixed(1);

  // 3) 방학 기간 / 학기중 근무일수
  const vacStart = document.getElementById("vacStart").value;
  const vacEnd = document.getElementById("vacEnd").value;
  const vacDaysNoSat = countDaysWithoutSaturday(vacStart, vacEnd);
  document.getElementById("vacDaysNoSat").textContent = vacDaysNoSat;

  const termDaysNoSat = Math.max(0, yearInfo.noSat - vacDaysNoSat);
  document.getElementById("termDaysNoSat").textContent = termDaysNoSat;

  const termAttendanceRate =
    yearInfo.noSat > 0 ? (termDaysNoSat / yearInfo.noSat) * 100 : 0;
  document.getElementById("termAttendanceRate").textContent = yearInfo.noSat
    ? termAttendanceRate.toFixed(1)
    : "-";

  // 4) 방학근무 보수
  const wageTotals = calcWageTotals();
  document.getElementById("wageTotal").textContent = wageTotals.total.toLocaleString();
  document.getElementById("wageTaxable").textContent = wageTotals.taxable.toLocaleString();
  document.getElementById("wageNonTaxable").textContent = wageTotals.nontax.toLocaleString();

  // 5) 전년도 출근율(참고용)
  calcPrevAttendance();

  // 6) 통상임금
  const ow = calcOrdinaryWage();

  // 7) 연차·연차수당
  const annual = calcAnnual(ow.hourly);

  // 8) 4대보험 기준금액 (방학근무 과세분 + (선택 시) 연차미사용수당)
  const includeUnused = document.getElementById("includeUnusedIn4ins").checked;
  const siBase = wageTotals.taxable + (includeUnused ? annual.unusedPay : 0);
  document.getElementById("siBase").textContent = Math.round(siBase).toLocaleString();

  const si = calcSocialInsurance(siBase);

  // 9) 연말정산 세금 기준금액 (방학근무 과세분 + 연차미사용수당)
  const taxBase = wageTotals.taxable + annual.unusedPay;
  document.getElementById("taxBase").textContent = Math.round(taxBase).toLocaleString();

  const tax = calcTax(taxBase);

  // 10) 종합 요약 섹션 반영
  document.getElementById("sumAnnualTotal").textContent = annual.totalAnnual
    ? annual.totalAnnual.toFixed(2)
    : document.getElementById("annualTotalDays").textContent;
  document.getElementById("sumAnnualUsed").textContent = annual.usedDaysConv.toFixed(2);
  document.getElementById("sumAnnualUnused").textContent = annual.unused.toFixed(2);
  document.getElementById("sumAnnualUnusedPay").textContent =
    Math.round(annual.unusedPay).toLocaleString();

  document.getElementById("sumWageTotal").textContent = wageTotals.total.toLocaleString();
  document.getElementById("sumWageTaxable").textContent = wageTotals.taxable.toLocaleString();
  document.getElementById("sumOwHourly").textContent = Math.round(ow.hourly).toLocaleString();
  document.getElementById("sumPaidHoursPerDay").textContent = numById("paidHoursPerDay").toFixed(1);

  document.getElementById("sumSiEmp").textContent = Math.round(si.empTotal).toLocaleString();
  document.getElementById("sumSiInd").textContent = Math.round(si.indTotal).toLocaleString();
  document.getElementById("sumIncomeTax").textContent = Math.round(tax.incomeTax).toLocaleString();
  document.getElementById("sumLocalTax").textContent = Math.round(tax.localTax).toLocaleString();
}

// 이벤트 세팅
document.addEventListener("DOMContentLoaded", () => {
  // 기본 행 하나씩 만들어두기
  addExcludeRow();
  addWageRow("방학근무수당", "");
  addWageRow("방학 중 주휴수당(과세분)", "");

  // 버튼 이벤트
  document.getElementById("addExcludeBtn").addEventListener("click", () => {
    addExcludeRow();
    recalcAll();
  });

  document.getElementById("addWageBtn").addEventListener("click", () => {
    addWageRow();
    recalcAll();
  });

  // 동적 삭제 버튼들 - 이벤트 위임
  document.getElementById("excludeBody").addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-remove-exclude")) {
      e.target.closest("tr").remove();
      recalcAll();
    }
  });

  document.getElementById("wageBody").addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-remove-wage")) {
      e.target.closest("tr").remove();
      recalcAll();
    }
  });

  // 메인 입력들 변경 시마다 재계산
  document.body.addEventListener("input", (e) => {
    // 대충 전체 input 변경에 반응해도 계산량이 부담될 정도는 아니라 그냥 통으로 처리
    recalcAll();
  });

  document.body.addEventListener("change", (e) => {
    if (e.target.name === "workType") {
      recalcAll();
    }
  });

  // 첫 계산
  recalcAll();
});
