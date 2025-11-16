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

// 특정 "학년도"의 전체 일수 및 토요일 제외 일수 계산
// 학년도 year → year.3.1. ~ (year+1).2.말
function calcYearDays(year) {
  if (!year) return { total: 0, noSat: 0 };
  const y = parseInt(year, 10);
  if (isNaN(y)) return { total: 0, noSat: 0 };

  const start = new Date(y, 2, 1);      // year-03-01
  const end = new Date(y + 1, 2, 0);    // 다음해 3월 0일 = 2월 마지막날

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

// 근속연수 계산(해당 학년도 3월 1일 기준, 완료 연수 기준)
function calcServiceYears(startValue, year) {
  const start = parseDate(startValue);
  const y = parseInt(year, 10);
  if (!start || isNaN(y)) return { years: 0 };

  const ref = new Date(y, 2, 1); // year-03-01
  if (start > ref) return { years: 0 };

  let years = ref.getFullYear() - start.getFullYear();
  const mDiff = ref.getMonth() - start.getMonth();

  if (mDiff < 0 || (mDiff === 0 && ref.getDate() < start.getDate())) {
    years--;
  }
  if (years < 0) years = 0;

  return { years };
}

// 근속연수 → 방학중 비상시근로자 기본 연차일수(2023.3.1. 이후 기준, 최대 25일)
function calcBaseAnnualFromService(serviceYears) {
  if (serviceYears <= 0) return 0;
  const days = 12 + Math.floor((serviceYears - 1) / 2);
  return Math.min(25, days);
}

// 근속연수 → 근속수당(학교, 2025.3.1. 이후 기준, 월 단위)
// 1년 이상 40,000원, 2년 이상 80,000원, ... 23년 이상 920,000원(상한)
function calcSeniorityAllowanceFromService(serviceYears) {
  if (serviceYears <= 0) return 0;
  const capped = Math.min(serviceYears, 23);
  return capped * 40000;
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

// 통상임금 계산 (체크박스를 라디오처럼 사용)
function calcOrdinaryWage() {
  const typeEl = document.querySelector('.workType:checked');
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

  document.getElementById("owMonthly").textContent =
    Math.round(monthly).toLocaleString();
  document.getElementById("owHourly").textContent =
    Math.round(hourly).toLocaleString();

  return { monthly, hourly };
}

// 연차 관련 계산 (자동 기본연차 반영)
function calcAnnual(hourlyOrdinary, autoBase) {
  const paidHoursPerDay = numById("paidHoursPerDay");

  // 수동 입력이 0보다 크면 그 값을 우선, 아니면 자동값 사용
  const baseInput = numById("annualBase");
  const base = baseInput > 0 ? baseInput : autoBase;

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
  document.getElementById("annualTotalDays").textContent =
    totalAnnual.toFixed(2);
  document.getElementById("annualUsedDaysConv").textContent =
    usedDaysConv.toFixed(2);
  document.getElementById("annualUnusedDays").textContent =
    unused.toFixed(2);
  document.getElementById("annualUnusedPay").textContent =
    Math.round(unusedPay).toLocaleString();

  return {
    totalAnnual,
    usedDaysConv,
    unused,
    unusedPay,
    baseEffective: base,
  };
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

  document.getElementById("siEmpTotal").textContent =
    Math.round(empTotal).toLocaleString();
  document.getElementById("siIndTotal").textContent =
    Math.round(indTotal).toLocaleString();
  document.getElementById("siGrandTotal").textContent =
    Math.round(grandTotal).toLocaleString();

  return { empTotal, indTotal, grandTotal };
}

// 연말정산 세금 계산
function calcTax(baseForTax) {
  const rate = numById("avgTaxRate") / 100;
  const incomeTax = baseForTax * rate;
  const localTax = incomeTax * 0.1;
  const total = incomeTax + localTax;

  document.getElementById("incomeTax").textContent =
    Math.round(incomeTax).toLocaleString();
  document.getElementById("localTax").textContent =
    Math.round(localTax).toLocaleString();
  document.getElementById("taxTotal").textContent =
    Math.round(total).toLocaleString();

  return { incomeTax, localTax, total };
}

// 날짜 포맷 helper (학년도 설명용)
function formatDate(d) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}.${m}.${day}.`;
}

// 메인 재계산 함수
function recalcAll() {
  const yearVal = document.getElementById("year").value;
  const year = parseInt(yearVal, 10);

  // 학년도 설명 텍스트
  if (!isNaN(year)) {
    const workStart = new Date(year, 2, 1);     // year-03-01
    const workEnd = new Date(year + 1, 2, 0);   // (year+1).2.말
    const useStart = new Date(year + 1, 2, 1);  // (year+1).3.1.
    const useEnd = new Date(year + 2, 2, 0);    // (year+2).2.말

    const explain = `${year}학년도 (${formatDate(
      workStart
    )}~${formatDate(
      workEnd
    )}) 근무 실적 기준으로, ${useStart.getFullYear()}년 (${formatDate(
      useStart
    )}~${formatDate(useEnd)})에 사용할 연차입니다.`;

    const explainEl = document.getElementById("academicExplain");
    if (explainEl) explainEl.textContent = explain;
  } else {
    const explainEl = document.getElementById("academicExplain");
    if (explainEl) explainEl.textContent = "-";
  }

  // 1) 학년도 달력 일수
  const yearInfo = calcYearDays(year);
  document.getElementById("calendarTotalDays").textContent =
    yearInfo.total;
  document.getElementById("calendarDaysNoSat").textContent =
    yearInfo.noSat;

  // 1-1) 근속연수 및 자동 기본 연차일수
  const startDateVal = document.getElementById("startDate").value;
  const service = calcServiceYears(startDateVal, year);
  const serviceSpan = document.getElementById("serviceYears");
  if (serviceSpan) {
    serviceSpan.textContent = service.years || 0;
  }

  let autoBase = 0;
  if (service.years > 0) {
    autoBase = calcBaseAnnualFromService(service.years);
    const autoBaseSpan = document.getElementById("autoAnnualBase");
    if (autoBaseSpan) {
      autoBaseSpan.textContent = autoBase.toString();
    }
  } else {
    const autoBaseSpan = document.getElementById("autoAnnualBase");
    if (autoBaseSpan) {
      autoBaseSpan.textContent = "-";
    }
  }

  // 1-2) 근속연수 기반 근속수당 자동 입력 (통상임금 섹션)
  if (service.years > 0) {
    const autoSeniority = calcSeniorityAllowanceFromService(service.years);
    const seniorityInput = document.getElementById("owSeniority");
    if (seniorityInput) {
      // 사용자가 직접 숫자를 넣어두지 않은 경우(0일 때)만 자동 세팅
      const current = num(seniorityInput.value);
      if (current === 0) {
        seniorityInput.value = String(autoSeniority);
      }
    }
  }

  // 2) 제외기간
  const excludeTotal = calcExcludeTotal();
  document.getElementById("excludeTotalDays").textContent =
    excludeTotal.toFixed(1);

  const workable = Math.max(0, yearInfo.noSat - excludeTotal);
  document.getElementById("workableDays").textContent =
    workable.toFixed(1);

  // 3) 현재 학년도 방학 기간(여름·겨울) / 학기중 근무일수
  const vac1Start = document.getElementById("vac1Start").value;
  const vac1End = document.getElementById("vac1End").value;
  const vac2Start = document.getElementById("vac2Start").value;
  const vac2End = document.getElementById("vac2End").value;

  const vac1DaysNoSat = countDaysWithoutSaturday(vac1Start, vac1End);
  const vac2DaysNoSat = countDaysWithoutSaturday(vac2Start, vac2End);
  const vacDaysNoSat = vac1DaysNoSat + vac2DaysNoSat;

  document.getElementById("vac1DaysNoSat").textContent =
    vac1DaysNoSat;
  document.getElementById("vac2DaysNoSat").textContent =
    vac2DaysNoSat;
  document.getElementById("vacDaysNoSat").textContent =
    vacDaysNoSat;

  const termDaysNoSat = Math.max(0, yearInfo.noSat - vacDaysNoSat);
  document.getElementById("termDaysNoSat").textContent =
    termDaysNoSat;

  // 방학 중 유급근무일수 입력값
  const vacWorkDays = numById("vacWorkDays");

  // 출근율(참고용) = (학기중 근무일수 + 방학 중 유급 근무일수) / 학년도 토요일제외 일수
  let attendanceRate = 0;
  if (yearInfo.noSat > 0) {
    attendanceRate =
      ((termDaysNoSat + vacWorkDays) / yearInfo.noSat) * 100;
  }
  document.getElementById("termAttendanceRate").textContent =
    yearInfo.noSat ? attendanceRate.toFixed(1) : "-";

  // 출근율 80% 기준 판정
  let judgeText = "-";
  if (yearInfo.noSat) {
    if (attendanceRate >= 80) {
      judgeText = "80% 이상 (연차 전액 부여 기준 충족 가능)";
    } else {
      judgeText = "80% 미만 (연차 감액 또는 미부여 가능)";
    }
  }
  const judgeEl = document.getElementById("attendance80Judge");
  if (judgeEl) judgeEl.textContent = judgeText;

  // 4) 전년도 학년도 달력 및 방학(여름·겨울)
  let prevYear = null;
  if (!isNaN(year)) prevYear = year - 1;

  const prevYearInfo = calcYearDays(prevYear);
  if (prevYear) {
    document.getElementById("prevYearLabel").textContent = prevYear;
  } else {
    document.getElementById("prevYearLabel").textContent = "-";
  }
  document.getElementById("prevYearTotalDays").textContent =
    prevYearInfo.total || "-";
  document.getElementById("prevYearDaysNoSat").textContent =
    prevYearInfo.noSat || "-";

  const prevVac1Start = document.getElementById("prevVac1Start").value;
  const prevVac1End = document.getElementById("prevVac1End").value;
  const prevVac2Start = document.getElementById("prevVac2Start").value;
  const prevVac2End = document.getElementById("prevVac2End").value;

  const prevVac1DaysNoSat = countDaysWithoutSaturday(
    prevVac1Start,
    prevVac1End
  );
  const prevVac2DaysNoSat = countDaysWithoutSaturday(
    prevVac2Start,
    prevVac2End
  );
  const prevVacDaysNoSat = prevVac1DaysNoSat + prevVac2DaysNoSat;
  const prevTermDaysNoSat = Math.max(
    0,
    prevYearInfo.noSat - prevVacDaysNoSat
  );

  document.getElementById("prevVac1DaysNoSat").textContent =
    prevVac1DaysNoSat;
  document.getElementById("prevVac2DaysNoSat").textContent =
    prevVac2DaysNoSat;
  document.getElementById("prevVacDaysNoSat").textContent =
    prevVacDaysNoSat;
  document.getElementById("prevTermDaysNoSat").textContent =
    isNaN(prevTermDaysNoSat) ? 0 : prevTermDaysNoSat;

  const prevAttendanceRate =
    prevYearInfo.noSat > 0
      ? (prevTermDaysNoSat / prevYearInfo.noSat) * 100
      : 0;
  document.getElementById("prevAttendanceRate").textContent =
    prevYearInfo.noSat ? prevAttendanceRate.toFixed(1) : "-";

  // 5) 방학근무 보수
  const wageTotals = calcWageTotals();
  document.getElementById("wageTotal").textContent =
    wageTotals.total.toLocaleString();
  document.getElementById("wageTaxable").textContent =
    wageTotals.taxable.toLocaleString();
  document.getElementById("wageNonTaxable").textContent =
    wageTotals.nontax.toLocaleString();

  // 6) 통상임금
  const ow = calcOrdinaryWage();

  // 7) 연차·연차수당 (자동 기본연차 반영)
  const annual = calcAnnual(ow.hourly, autoBase);

  // 8) 4대보험 기준금액 (방학근무 과세분 + (선택 시) 연차미사용수당)
  const includeUnused =
    document.getElementById("includeUnusedIn4ins").checked;
  const siBase =
    wageTotals.taxable + (includeUnused ? annual.unusedPay : 0);
  document.getElementById("siBase").textContent =
    Math.round(siBase).toLocaleString();

  const si = calcSocialInsurance(siBase);

  // 9) 연말정산 세금 기준금액 (방학근무 과세분 + 연차미사용수당)
  const taxBase = wageTotals.taxable + annual.unusedPay;
  document.getElementById("taxBase").textContent =
    Math.round(taxBase).toLocaleString();

  const tax = calcTax(taxBase);

  // 10) 종합 요약 섹션 반영
  document.getElementById("sumAnnualTotal").textContent =
    annual.totalAnnual.toFixed(2);
  document.getElementById("sumAnnualUsed").textContent =
    annual.usedDaysConv.toFixed(2);
  document.getElementById("sumAnnualUnused").textContent =
    annual.unused.toFixed(2);
  document.getElementById("sumAnnualUnusedPay").textContent =
    Math.round(annual.unusedPay).toLocaleString();

  document.getElementById("sumWageTotal").textContent =
    wageTotals.total.toLocaleString();
  document.getElementById("sumWageTaxable").textContent =
    wageTotals.taxable.toLocaleString();
  document.getElementById("sumOwHourly").textContent =
    Math.round(ow.hourly).toLocaleString();
  document.getElementById("sumPaidHoursPerDay").textContent =
    numById("paidHoursPerDay").toFixed(1);

  document.getElementById("sumSiEmp").textContent =
    Math.round(si.empTotal).toLocaleString();
  document.getElementById("sumSiInd").textContent =
    Math.round(si.indTotal).toLocaleString();
  document.getElementById("sumIncomeTax").textContent =
    Math.round(tax.incomeTax).toLocaleString();
  document.getElementById("sumLocalTax").textContent =
    Math.round(tax.localTax).toLocaleString();
}

// 이벤트 세팅
document.addEventListener("DOMContentLoaded", () => {
  // 기본 행 하나씩 만들어두기
  addExcludeRow();
  addWageRow("방학근무수당", "");
  addWageRow("방학 중 주휴수당(과세분)", "");

  // 제외기간 행 추가 버튼
  document.getElementById("addExcludeBtn").addEventListener("click", () => {
    addExcludeRow();
    recalcAll();
  });

  // 방학근무 보수 행 추가 버튼
  document.getElementById("addWageBtn").addEventListener("click", () => {
    addWageRow();
    recalcAll();
  });

  // 동적 삭제 버튼들 - 이벤트 위임
  document
    .getElementById("excludeBody")
    .addEventListener("click", (e) => {
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

  // 체크박스를 라디오처럼 동작시키기 (소정 근로시간 유형)
  const workTypeBoxes = document.querySelectorAll(".workType");
  workTypeBoxes.forEach((box) => {
    box.addEventListener("change", (e) => {
      if (e.target.checked) {
        // 다른 체크박스 전부 해제
        workTypeBoxes.forEach((other) => {
          if (other !== e.target) other.checked = false;
        });
      } else {
        // 전부 해제되는 걸 방지: 최소 1개는 항상 선택
        const anyChecked = Array.from(workTypeBoxes).some(
          (c) => c.checked
        );
        if (!anyChecked) e.target.checked = true;
      }
      recalcAll();
    });
  });

  // 기타 입력 변경 시마다 재계산
  document.body.addEventListener("input", () => {
    recalcAll();
  });

  // 첫 계산
  recalcAll();
});