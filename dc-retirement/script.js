document.addEventListener("DOMContentLoaded", () => {
  const matrixBody          = document.getElementById("matrixBody");
  const addMatrixRowBtn     = document.getElementById("addMatrixRowBtn");

  const addExtraBtn         = document.getElementById("addExtraBtn");
  const extraList           = document.getElementById("extraAllowanceList");

  const calcBtn             = document.getElementById("calcBtn");
  const resultBox           = document.getElementById("result");

  const periodRadios        = document.querySelectorAll('input[name="periodType"]');
  const monthHeaderElements = document.querySelectorAll(".month-header");

  // ------------------------
  // 공통 유틸
  // ------------------------

  const fmt = (n) => n.toLocaleString("ko-KR");

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

  // ------------------------
  // 월단위 임금 매트릭스
  // ------------------------

  function updateMonthHeaders() {
    const periodTypeEl = document.querySelector('input[name="periodType"]:checked');
    const periodType = periodTypeEl ? periodTypeEl.value : "calendar";

    const labelsCalendar = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
    const labelsSchool   = ["3월","4월","5월","6월","7월","8월","9월","10월","11월","12월","1월(익년)","2월(익년)"];

    monthHeaderElements.forEach((th, idx) => {
      if (periodType === "calendar") {
        th.textContent = labelsCalendar[idx] || "";
      } else {
        th.textContent = labelsSchool[idx] || "";
      }
    });
  }

  function addMatrixRow(defaultName = "") {
    const tr = document.createElement("tr");
    tr.className = "matrix-row";

    // 수당명
    const nameTd = document.createElement("td");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "matrix-name-input";
    nameInput.placeholder = "예: 기본급 / 초과근무수당";
    nameInput.value = defaultName;
    nameTd.appendChild(nameInput);
    tr.appendChild(nameTd);

    // 12개월 금액 입력
    for (let i = 0; i < 12; i++) {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "number";
      input.className = "matrix-amount-input";
      input.placeholder = "0";
      td.appendChild(input);
      tr.appendChild(td);
    }

    // 삭제 버튼
    const deleteTd = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "matrix-delete-btn";
    deleteBtn.textContent = "삭제";
    deleteBtn.addEventListener("click", () => {
      matrixBody.removeChild(tr);
    });
    deleteTd.appendChild(deleteBtn);
    tr.appendChild(deleteTd);

    matrixBody.appendChild(tr);
  }

  function getMatrixAnnualSum() {
    const rows = matrixBody.querySelectorAll(".matrix-row");
    let sum = 0;

    rows.forEach((row) => {
      const amountInputs = row.querySelectorAll(".matrix-amount-input");
      amountInputs.forEach((input) => {
        const v = Number(input.value);
        if (!isNaN(v)) sum += v;
      });
    });

    return sum;
  }

  // ------------------------
  // 기타 연간 수당
  // ------------------------

  function addExtraRow(nameValue = "", amountValue = "") {
    const row = document.createElement("div");
    row.className = "extra-row";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "예: 기타 연간 수당명";
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
      const nameInput   = row.querySelector(".extra-name");
      const amountInput = row.querySelector(".extra-amount");
      const name   = (nameInput?.value || "").trim();
      const amount = Number(amountInput?.value || 0);
      if (name !== "" || (!isNaN(amount) && amount > 0)) {
        count += 1;
      }
    });
    return count;
  }

  // ------------------------
  // 초기 세팅
  // ------------------------

  // 월 헤더 초기화
  updateMonthHeaders();

  // 기본 행 몇 개 깔아두기 (엑셀 느낌)
  addMatrixRow("기본급");
  addMatrixRow("초과근무수당");
  addMatrixRow("기타 수당");

  // 연간 수당 행 하나
  addExtraRow();

  // 라디오 바뀔 때마다 헤더 변경
  periodRadios.forEach((r) => {
    r.addEventListener("change", () => {
      updateMonthHeaders();
    });
  });

  // 버튼 이벤트들
  addMatrixRowBtn.addEventListener("click", () => {
    addMatrixRow();
  });

  addExtraBtn.addEventListener("click", () => {
    addExtraRow();
  });

  // ------------------------
  // 메인 계산 로직
  // ------------------------

  calcBtn.addEventListener("click", () => {
    const excludedMonthly = getNumberValue("excludedMonthly"); // 제외기간 중 월단위 임금 합계(연간)
    let   excludedMonths  = getNumberValue("excludedMonths");  // 제외 개월 수
    const yearlyTotal     = getNumberValue("yearlyTotal");     // 연 단위 정기지급 임금 합계

    if (excludedMonths < 0)  excludedMonths = 0;
    if (excludedMonths > 12) excludedMonths = 12;

    // ① 월단위 임금 매트릭스 전체 합계 (12개월 합산)
    const annualFromMatrix = getMatrixAnnualSum();

    // ② 기타 연간 수당
    const extraTotal = getExtraAllowancesTotal();
    const extraCount = getExtraAllowancesCount();

    // 아무것도 안 넣었을 때 방어
    if (!annualFromMatrix && !extraTotal && !yearlyTotal) {
      resultBox.innerHTML = "월단위 임금 내역·기타 수당·연 단위 임금 중 최소 하나는 입력해주세요.";
      return;
    }

    // 월단위 계열 연간 합산 (= ① + 기타 연간 수당)
    const annualMonthlyWithExtra = annualFromMatrix + extraTotal;

    // ③ 방학·제외기간 조정
    const monthsForCalc   = 12 - excludedMonths;
    const adjustedMonthly = (annualMonthlyWithExtra - excludedMonthly) * (monthsForCalc / 12);

    // ④ 최종 DC형 임금총액
    const finalTotal = adjustedMonthly + yearlyTotal;

    const periodText = getPeriodInfo();

    // 결과 출력
    let html = "";

    html += "📌 <b>DC형 퇴직연금 산정용 임금총액</b><br>";
    html += "<span style='font-size:18px;display:inline-block;margin-top:4px;'>" +
            fmt(Math.round(finalTotal)) + " 원</span><br><br>";

    html += "• 산정 기간: " + periodText + "<br><br>";

    html += "【월단위 임금 내역 합계】<br>";
    html += "· 수당별·월별 실지급액 합계: " + fmt(Math.round(annualFromMatrix)) + " 원<br><br>";

    html += "【기타 추가 수당(연간)】<br>";
    html += "· 기타 수당 합계: " + fmt(Math.round(extraTotal)) + " 원";
    if (extraCount > 0) {
      html += " (항목 " + extraCount + "개)";
    }
    html += "<br>";
    html += "→ 월단위 계열 연간 합산 금액: " + fmt(Math.round(annualMonthlyWithExtra)) + " 원<br><br>";

    html += "【제외기간 조정】<br>";
    html += "· 제외기간 개월 수: " + excludedMonths + "개월<br>";
    html += "· 제외기간 중 월단위 임금 합계: " + fmt(Math.round(excludedMonthly)) + " 원<br>";
    html += "→ 제외기간 조정 후 월단위 임금: " + fmt(Math.round(adjustedMonthly)) + " 원<br><br>";

    html += "【연 단위 정기지급 임금】<br>";
    html += "· 연 단위 정기지급 임금 총액: " + fmt(Math.round(yearlyTotal)) + " 원<br>";

    resultBox.innerHTML = html;
  });
});
