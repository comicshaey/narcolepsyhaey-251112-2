

document.addEventListener("DOMContentLoaded", () => {
  const addExtraBtn = document.getElementById("addExtraBtn");
  const extraList   = document.getElementById("extraAllowanceList");
  const calcBtn     = document.getElementById("calcBtn");
  const resultBox   = document.getElementById("result");

  // 수당 항목 한 줄 추가
  function addExtraRow(nameValue = "", amountValue = "") {
    const row = document.createElement("div");
    row.className = "extra-row";

    // 수당명
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "예: 수익자부담금";
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

  // 첫 화면에 기본 한 줄
  addExtraRow();

  // [+ 수당 추가] 클릭
  addExtraBtn.addEventListener("click", () => {
    addExtraRow();
  });

  // 숫자값 가져오는 함수 (비어있으면 0)
  function getNumberValue(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const v = Number(el.value);
    return isNaN(v) ? 0 : v;
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

  // 계산 버튼 클릭 시
  calcBtn.addEventListener("click", () => {
    const monthlyTotal    = getNumberValue("monthlyTotal");       // 연간 월 단위 임금 총액
    const excludedMonthly = getNumberValue("excludedMonthly");   // 제외기간 내 월 단위 임금 합계
    let   excludedMonths  = getNumberValue("excludedMonths");    // 제외개월 수
    const yearlyTotal     = getNumberValue("yearlyTotal");       // 연 단위 임금 총액

    // 최소 입력 체크
    if (!monthlyTotal && !yearlyTotal) {
      resultBox.innerHTML = "연간 월 단위 임금 또는 연 단위 임금 중 적어도 하나는 입력해주세요.";
      return;
    }

    if (excludedMonths < 0)  excludedMonths = 0;
    if (excludedMonths > 12) excludedMonths = 12;

    // 추가 수당
    const extraTotal = getExtraAllowancesTotal();
    const extraCount = getExtraAllowancesCount();

    // ① 연간 월 단위 임금 + 추가 수당
    const annualMonthlyWithExtra = monthlyTotal + extraTotal;

    // ② 방학·제외기간 조정
    //    (annualMonthlyWithExtra - excludedMonthly) * (12 - 제외개월) / 12
    const monthsForCalc  = 12 - excludedMonths;
    const adjustedMonthly = (annualMonthlyWithExtra - excludedMonthly) * (monthsForCalc / 12);

    // ③ 최종 DC형 임금총액
    const finalTotal = adjustedMonthly + yearlyTotal;

    // 포맷터
    const fmt = (n) => n.toLocaleString("ko-KR");

    // 산정 기간 설명
    const periodText = getPeriodInfo();

    // 결과 HTML 구성
    let html = "";

    html += "📌 <b>DC형 퇴직연금 산정용 임금총액</b><br>";
    html += "<span style='font-size:18px;display:inline-block;margin-top:4px;'>" +
            fmt(Math.round(finalTotal)) + " 원</span><br><br>";

    html += "• 산정 기간: " + periodText + "<br><br>";

    html += "• 연간 월 단위 임금 총액: " + fmt(Math.round(monthlyTotal)) + " 원<br>";
    html += "• 직종별 추가 수당 합계: " + fmt(Math.round(extraTotal)) + " 원";
    if (extraCount > 0) {
      html += " (항목 " + extraCount + "개)";
    }
    html += "<br>";
    html += "→ 합산 월 단위 기준: " + fmt(Math.round(annualMonthlyWithExtra)) + " 원<br><br>";

    html += "• 방학·제외기간 개월 수: " + monthsForCalc + "개월 반영<br>";
    html += "• 제외기간 중 월 단위 임금 합계: " + fmt(Math.round(excludedMonthly)) + " 원<br>";
    html += "→ 제외기간 조정 후 월 단위 임금: " + fmt(Math.round(adjustedMonthly)) + " 원<br><br>";

    html += "• 연 단위 임금 총액: " + fmt(Math.round(yearlyTotal)) + " 원<br>";

    resultBox.innerHTML = html;
  });
});