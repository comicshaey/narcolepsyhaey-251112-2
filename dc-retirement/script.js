//251114금

document.addEventListener("DOMContentLoaded", () => {
  const addExtraBtn = document.getElementById("addExtraBtn");
  const extraList   = document.getElementById("extraAllowanceList");
  const calcBtn     = document.getElementById("calcBtn");
  const resultBox   = document.getElementById("result");

  const monthlyAllowanceContainer = document.getElementById("monthlyAllowanceContainer");
  const periodRadios = document.querySelectorAll('input[name="periodType"]');

  // ------------------------
  // 월 정기 수당 (월별 입력) 세팅
  // ------------------------

  // 월별 입력 칸 생성 (12개 고정, 라벨은 기간에 따라 바뀜)
  function createMonthlyAllowanceFields() {
    monthlyAllowanceContainer.innerHTML = "";

    for (let i = 0; i < 12; i++) {
      const row = document.createElement("div");
      row.className = "month-row";

      const label = document.createElement("span");
      label.className = "month-label";
      label.dataset.index = String(i); // 나중에 라벨 업데이트용

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

  // 현재 선택된 산정기간에 따라 월 라벨 업데이트
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

  // 월별 수당 합계 계산
  function getMonthlyAllowancesTotal() {
    const inputs = monthlyAllowanceContainer.querySelectorAll(".month-allowance-input");
    let sum = 0;
    inputs.forEach((input) => {
      const v = Number(input.value);
      if (!isNaN(v)) {
        sum += v;
      }
    });
    return sum;
  }

  // 산정 기간 텍스트 만들기
  function getPeriodInfo() {
    const periodTypeEl = document.querySelector('input[name="periodType"]:checked');
    const periodType = periodTypeEl ? periodTypeEl.value : "calendar";
    const baseYear = getNumberValue("baseYear");

    let text = "";
    if (periodType === "calendar") {
      // 1월~12월 기준
      if (baseYear) {
        text = `${baseYear}년 1월 ~ 12월 기준 (연도 기준 산정)`;
      } else {
        text = "1월 ~ 12월 기준 (연도 기준 산정)";
      }
    } else {
      // 3월~익년 2월 기준 (학년도)
      if (baseYear) {
        const nextYear = baseYear + 1;
        text = `${baseYear}학년도 기준 (${baseYear}년 3월 ~ ${nextYear}년 2월)`;
      } else {
        text = "3월 ~ 익년 2월 기준 (학년도 기준 산정)";
      }
    }
    return text;
  }

  // ------------------------
  // 기타 추가 수당 (연간 금액)
  // ------------------------

  // 수당 항목 한 줄 추가
  function addExtraRow(nameValue = "", amountValue = "") {
    const row = document.createElement("div");
    row.className = "extra-row";

    // 수당명
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "예: 기타 수당명";
    nameInput.className = "text-input extra-name";
    nameInput.value = nameValue;

    // 연간 금액
    const amountInput = document.createElement("input");
    amountInput.type = "number";
    amountInput.placeholder = "연간 금액 (원단위)";
    amountInput.className = "number-input extra-amount";
    amountInput.value = amountValue;

    // 삭제 버튼
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

  // 추가 수당 연간 합계
  function getExtraAllowancesTotal() {
    const amountInputs = extraList.querySelectorAll(".extra-amount");
    let sum = 0;
    amountInputs.forEach((input) => {
      const v = Number(input.value);
      if (!isNaN(v)) {
        sum += v;
      }
    });
    return sum;
  }

  // 실질적으로 입력된 수당 항목 개수
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

  // 숫자값 가져오기 (비어있으면 0)
  function getNumberValue(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const v = Number(el.value);
    return isNaN(v) ? 0 : v;
  }

  const fmt = (n) => n.toLocaleString("ko-KR");

  // ------------------------
  // 초기 세팅
  // ------------------------

  // 월별 수당 입력칸 만들기
  createMonthlyAllowanceFields();

  // 기간 라디오 바뀌면 월 라벨만 바꾸기 (입력값은 그대로 유지)
  periodRadios.forEach((r) => {
    r.addEventListener("change", () => {
      updateMonthLabels();
    });
  });

  // 기타 추가 수당 기본 한 줄
  addExtraRow();

  // [+ 수당 추가] 클릭
  addExtraBtn.addEventListener("click", () => {
    addExtraRow();
  });

  // ------------------------
  // 메인 계산 로직
  // ------------------------

  calcBtn.addEventListener("click", () => {
    const monthlyTotal    = getNumberValue("monthlyTotal");     // 월 단위 임금 월간 총액
    const excludedMonthly = getNumberValue("excludedMonthly"); // 제외기간 내 월 단위 임금 합계(연간)
    let   excludedMonths  = getNumberValue("excludedMonths");  // 제외 개월 수
    const yearlyTotal     = getNumberValue("yearlyTotal");     // 연 단위 정기지급 합계(연간)

    // 최소 입력 체크
    if (!monthlyTotal && !yearlyTotal) {
      resultBox.innerHTML = "월 단위 임금 또는 연 단위 임금 중 적어도 하나는 입력해주세요.";
      return;
    }

    if (excludedMonths < 0)  excludedMonths = 0;
    if (excludedMonths > 12) excludedMonths = 12;

    // 월별 정기 수당(수익자부담금 등) 합계 (산정기간 1년 전체)
    const monthlyVariableTotal = getMonthlyAllowancesTotal();

    // 기타 추가 수당 (연간)
    const extraTotal = getExtraAllowancesTotal();
    const extraCount = getExtraAllowancesCount();

    // ① 월 단위 기본임금(월간) → 연간으로 환산
    const annualBaseFromMonthly = monthlyTotal * 12;

    // ② 월 단위에서 발생하는 기타 항목:
    //    - 월 정기 수당(월별 입력 합계)
    //    - 기타 연간 수당(연간 금액으로 입력한 것들)
    //    → 전부 "월 단위 임금 계열"에 합쳐서 생각
    const annualMonthlyWithExtra =
      annualBaseFromMonthly + monthlyVariableTotal + extraTotal;

    // ③ 방학·제외기간 조정
    //    (annualMonthlyWithExtra - excludedMonthly) * (12 - 제외개월) / 12
    const monthsForCalc   = 12 - excludedMonths;
    const adjustedMonthly = (annualMonthlyWithExtra - excludedMonthly) * (monthsForCalc / 12);

    // ④ 최종 DC형 임금총액
    const finalTotal = adjustedMonthly + yearlyTotal;

    // 산정 기간 설명
    const periodText = getPeriodInfo();

    // 결과 HTML 구성
    let html = "";

    html += "<b>DC형 퇴직연금 산정용 임금총액</b><br>";
    html += "<span style='font-size:18px;display:inline-block;margin-top:4px;'>" +
            fmt(Math.round(finalTotal)) + " 원</span><br><br>";

    html += "• 산정 기간: " + periodText + "<br><br>";

    html += "【월 단위 임금 계열】<br>";
    html += "· 월 단위 임금 월간 총액: " + fmt(Math.round(monthlyTotal)) + " 원<br>";
    html += "· 월 정기 수당 합계(산정기간 전체): " + fmt(Math.round(monthlyVariableTotal)) + " 원<br>";
    html += "· 기타 추가 수당 합계(연간): " + fmt(Math.round(extraTotal)) + " 원";
    if (extraCount > 0) {
      html += " (항목 " + extraCount + "개)";
    }
    html += "<br>";
    html += "→ 월 단위 기준 연간 합산 금액: " + fmt(Math.round(annualMonthlyWithExtra)) + " 원<br><br>";

    html += "【제외기간 조정】<br>";
    html += "· 제외기간 개월 수: " + monthsForCalc + "개월 반영<br>";
    html += "· 제외기간 중 월 단위 임금 합계: " + fmt(Math.round(excludedMonthly)) + " 원<br>";
    html += "→ 제외기간 조정 후 월 단위 임금: " + fmt(Math.round(adjustedMonthly)) + " 원<br><br>";

    html += "【연 단위 정기지급 임금】<br>";
    html += "· 연 단위 정기지급 임금 총액: " + fmt(Math.round(yearlyTotal)) + " 원<br>";

    resultBox.innerHTML = html;
  });
});
