// DC형 퇴직연금 계산 스크립트
// 월 정기 임금(항목별) + 월별 변동 수당 + 연간 수당 + 제외기간 조정

document.addEventListener("DOMContentLoaded", () => {
  const addExtraBtn  = document.getElementById("addExtraBtn");
  const extraList    = document.getElementById("extraAllowanceList");
  const addFixedBtn  = document.getElementById("addFixedBtn");
  const fixedList    = document.getElementById("fixedAllowanceList");

  const calcBtn      = document.getElementById("calcBtn");
  const resultBox    = document.getElementById("result");

  const monthlyAllowanceContainer = document.getElementById("monthlyAllowanceContainer");
  const periodRadios = document.querySelectorAll('input[name="periodType"]');

  // ------------------------
  // 월 단위 정기 임금 (항목별, 월 금액)
  // ------------------------

  function addFixedRow(nameValue = "", amountValue = "") {
    const row = document.createElement("div");
    row.className = "fixed-row";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "예: 기본급";
    nameInput.className = "text-input fixed-name";
    nameInput.value = nameValue;

    const amountInput = document.createElement("input");
    amountInput.type = "number";
    amountInput.placeholder = "월 금액 (원)";
    amountInput.className = "number-input fixed-amount";
    amountInput.value = amountValue;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-small";
    deleteBtn.textContent = "삭제";

    deleteBtn.addEventListener("click", () => {
      fixedList.removeChild(row);
    });

    row.appendChild(nameInput);
    row.appendChild(amountInput);
    row.appendChild(deleteBtn);

    fixedList.appendChild(row);
  }

  function getFixedMonthlySum() {
    const amountInputs = fixedList.querySelectorAll(".fixed-amount");
    let sum = 0;
    amountInputs.forEach((input) => {
      const v = Number(input.value);
      if (!isNaN(v)) sum += v;
    });
    return sum;
  }

  // ------------------------
  // 월 정기 수당 (월별 입력)
  // ------------------------

  function createMonthlyAllowanceFields() {
    monthlyAllowanceContainer.innerHTML = "";

    for (let i = 0; i < 12; i++) {
      const row = document.createElement("div");
      row.className = "month-row";

      const label = document.createElement("span");
      label.className = "month-label";
      label.dataset.index = String(i);

      const input = document.createElement("input");
      input.type = "number";
      input.className = "number-input month-allowance-input";
      input.placeholder = "해당 월 수당 합계 (원)";

      row.appendChild(label);
      row.appendChild(input);
      monthlyAllowanceContainer.appendChild(row);
    }

    updateMonthLabels();
  }

  function updateMonthLabels() {
    const periodTypeEl = document.querySelector('input[name="periodType"]:checked');
    const periodType = periodTypeEl ? periodTypeEl.value : "calendar";

    const labelsCalendar = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
    const labelsSchool   = ["3월","4월","5월","6월","7월","8월","9월","10월","11월","12월","1월(익년)","2월(익년)"];

    const labelElems = monthlyAllowanceContainer.querySelectorAll(".month-label");

    labelElems.forEach((el, idx) => {
      if (periodType === "calendar") {
        el.textContent = labelsCalendar[idx] || "";
      } else {
        el.textContent = labelsSchool[idx] || "";
      }
    });
  }

  function getMonthlyAllowancesTotal() {
    const inputs = monthlyAllowanceContainer.querySelectorAll(".month-allowance-input");
    let sum = 0;
    inputs.forEach((input) => {
      const v = Number(input.value);
      if (!isNaN(v)) sum += v;
    });
    return sum;
  }

  // ------------------------
  // 기타 추가 수당 (연간 금액)
  // ------------------------

  function addExtraRow(nameValue = "", amountValue = "") {
    const row = document.createElement("div");
    row.className = "extra-row";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "예: 기타 수당명";
    nameInput.className = "text-input extra-name";
    nameInput.value = nameValue;

    const amountInput = document.createElement("input");
    amountInput.type = "number";
    amountInput.placeholder = "연간 금액 (원단위)";
    amountInput.className = "number-input extra-amount";
    amountInput.value = amountValue;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-small";
    deleteBtn.textContent = "삭제";

    deleteBtn.addEventListener("click", () => {
      extraList.removeChild(row);
    });

    row.appendChild(nameInput);
    row.appendChild(amountInput);
    row.appendChild(deleteBtn);

    extraList.appendChild(row);
  }

  function getExtraAllowancesTotal() {
    const amountInputs = extraList.querySelectorAll(".extra-amount");
    let sum = 0;
    amountInputs.forEach((input) => {
      const v = Number(input.value);
      if (!isNaN(v)) sum += v;
    });
    return sum;
  }

  function getExtraAllowancesCount() {
    const rows = extraList.querySelectorAll(".extra-row");
    let count = 0;
    rows.forEach((row) => {
      const nameInput = row.querySelector(".extra-name");
      const amountInput = row.querySelector(".extra-amount");
      const name = (nameInput?.value || "").trim();
      const amount = Number(amountInput?.value || 0);
      if (name !== "" || (!isNaN(amount) && amount > 0)) {
        count += 1;
      }
    });
    return count;
  }

  // ------------------------
  // 공통 유틸
  // ------------------------

  function getNumberValue(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const v = Number(el.value);
    return isNaN(v) ? 0 : v;
  }

  function getPeriodInfo() {
    const periodTypeEl = document.querySelector('input[name="periodType"]:checked');
    const periodType = periodTypeEl ? periodTypeEl.value : "calendar";
    const baseYear = getNumberValue("baseYear");

    let text = "";
    if (periodType === "calendar") {
      if (baseYear) {
        text = `${baseYear}년 1월 ~ 12월 기준 (연도 기준 산정)`;
      } else {
        text = "1월 ~ 12월 기준 (연도 기준 산정)";
      }
    } else {
      if (baseYear) {
        const nextYear = baseYear + 1;
        text = `${baseYear}학년도 기준 (${baseYear}년 3월 ~ ${nextYear}년 2월)`;
      } else {
        text = "3월 ~ 익년 2월 기준 (학년도 기준 산정)";
      }
    }
    return text;
  }

  const fmt = (n) => n.toLocaleString("ko-KR");

  // ------------------------
  // 초기 세팅
  // ------------------------

  // 월 정기 임금 기본 한 줄
  addFixedRow();

  // 월별 수당 입력칸 12개 생성
  createMonthlyAllowanceFields();

  // 기간 라디오 바뀌면 월 라벨만 변경
  periodRadios.forEach((r) => {
    r.addEventListener("change", () => {
      updateMonthLabels();
    });
  });

  // 기타 추가 수당 기본 한 줄
  addExtraRow();

  // 버튼들 이벤트
  addFixedBtn.addEventListener("click", () => {
    addFixedRow();
  });

  addExtraBtn.addEventListener("click", () => {
    addExtraRow();
  });

  // ------------------------
  // 메인 계산 로직
  // ------------------------

  calcBtn.addEventListener("click", () => {
    const excludedMonthly = getNumberValue("excludedMonthly"); // 제외기간 내 월 단위 임금 합계(연간)
    let   excludedMonths  = getNumberValue("excludedMonths");  // 제외 개월 수
    const yearlyTotal     = getNumberValue("yearlyTotal");     // 연 단위 정기지급 합계(연간)

    if (excludedMonths < 0)  excludedMonths = 0;
    if (excludedMonths > 12) excludedMonths = 12;

    // 월 단위 정기 임금(항목별) 합계 (월 기준)
    const fixedMonthlySum = getFixedMonthlySum();

    // 월별 변동 수당 합계 (연간)
    const monthlyVariableTotal = getMonthlyAllowancesTotal();

    // 기타 추가 수당 (연간)
    const extraTotal = getExtraAllowancesTotal();
    const extraCount = getExtraAllowancesCount();

    // 최소 입력 체크 (완전 0이면 경고)
    if (!fixedMonthlySum && !monthlyVariableTotal && !extraTotal && !yearlyTotal) {
      resultBox.innerHTML = "월 정기 임금, 월 정기 수당, 기타 수당, 연 단위 임금 중 최소 하나는 입력해주세요.";
      return;
    }

    // ① 월 정기 임금(한 달 합계)을 연간으로 환산
    const annualBaseFromMonthly = fixedMonthlySum * 12;

    // ② 월 단위 계열 = 정기 임금(연간) + 월별 변동 수당(연간) + 기타 연간 수당
    const annualMonthlyWithExtra =
      annualBaseFromMonthly + monthlyVariableTotal + extraTotal;

    // ③ 방학·제외기간 조정
    const monthsForCalc   = 12 - excludedMonths;
    const adjustedMonthly = (annualMonthlyWithExtra - excludedMonthly) * (monthsForCalc / 12);

    // ④ 최종 DC형 임금총액
    const finalTotal = adjustedMonthly + yearlyTotal;

    // 산정 기간 설명
    const periodText = getPeriodInfo();

    // 결과 출력
    let html = "";

    html += "📌 <b>DC형 퇴직연금 산정용 임금총액</b><br>";
    html += "<span style='font-size:18px;display:inline-block;margin-top:4px;'>" +
            fmt(Math.round(finalTotal)) + " 원</span><br><br>";

    html += "• 산정 기간: " + periodText + "<br><br>";

    html += "【월 단위 정기 임금】<br>";
    html += "· 정기 임금 월 합계: " + fmt(Math.round(fixedMonthlySum)) + " 원<br>";
    html += "→ 연간 환산(×12): " + fmt(Math.round(annualBaseFromMonthly)) + " 원<br><br>";

    html += "【월별 변동 수당】<br>";
    html += "· 월 정기 수당(수익자부담금 등) 합계: " + fmt(Math.round(monthlyVariableTotal)) + " 원<br><br>";

    html += "【기타 추가 수당(연간)】<br>";
    html += "· 기타 수당 합계: " + fmt(Math.round(extraTotal)) + " 원";
    if (extraCount > 0) {
      html += " (항목 " + extraCount + "개)";
    }
    html += "<br>";
    html += "→ 월 단위 계열 연간 합산 금액: " + fmt(Math.round(annualMonthlyWithExtra)) + " 원<br><br>";

    html += "【제외기간 조정】<br>";
    html += "· 제외기간 개월 수: " + (12 - monthsForCalc) + "개월<br>";
    html += "· 제외기간 중 월 단위 임금 합계: " + fmt(Math.round(excludedMonthly)) + " 원<br>";
    html += "→ 제외기간 조정 후 월 단위 임금: " + fmt(Math.round(adjustedMonthly)) + " 원<br><br>";

    html += "【연 단위 정기지급 임금】<br>";
    html += "· 연 단위 정기지급 임금 총액: " + fmt(Math.round(yearlyTotal)) + " 원<br>";

    resultBox.innerHTML = html;
  });
});
