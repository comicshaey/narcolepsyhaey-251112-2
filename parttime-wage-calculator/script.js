// ===== 숫자 표시 포맷 =====
// 십원 단위 절삭: 일의 자리를 0으로 맞춤
function fmt(n){
  const tenWon = Math.floor(Number(n) / 10) * 10; // 10원 단위 절삭
  return tenWon.toLocaleString('ko-KR');
}

// 숫자 입력 헬퍼 (빈칸/NaN -> 0)
function val(id){
  const v = Number(document.getElementById(id).value);
  return isNaN(v) ? 0 : v;
}

// 메인 계산
function calc(){
  // --- 기간 계산 ---
  const start = new Date(document.getElementById('startDate').value);
  const end   = new Date(document.getElementById('endDate').value);
  if(isNaN(start) || isNaN(end) || end < start){
    alert('근로계약 시작일과 종료일을 정확히 입력하세요.'); 
    return;
  }
  const MS_DAY   = 1000 * 60 * 60 * 24;
  const totalDays = Math.floor((end - start) / MS_DAY) + 1; // 양끝 포함
  const weeks     = totalDays / 7;                          // 단순 주수(소수 포함)

  // --- 요일별 주간 시간 합계 ---
  const ids = ['sun','mon','tue','wed','thu','fri','sat']; // 일~토
  let weeklyHours = 0;
  let weeklyDays  = 0;
  for(const d of ids){
    const checked = document.getElementById(d).checked;
    const hours   = val(d + 'H');
    if(checked){
      weeklyHours += hours;
      weeklyDays  += 1;
    }
  }
  if(weeklyDays === 0){
    alert('근무 요일을 최소 1개 이상 선택해 주세요.');
    return;
  }

  // --- 기타 입력 ---
  const volPaid   = document.getElementById('volPaid').value; // 'Y' | 'N'
  const volHours  = val('volHours');
  const budgetBase    = val('budgetBase');     // 주중 예산
  const budgetHoliday = val('budgetHoliday');  // 주휴 예산
  const wage      = val('wage');

  // --- 주휴수당 로직 ---
  const weeklyPaidHours    = weeklyHours + (volPaid === 'Y' ? volHours : 0);
  const holidayEligible    = weeklyPaidHours >= 15; // 주 15시간 이상
  const weeklyHolidayHours = holidayEligible ? (weeklyPaidHours / Math.max(1, weeklyDays)) : 0;

  // --- 금액 계산 ---
  const weeklyBasePay    = weeklyPaidHours    * wage;
  const weeklyHolidayPay = weeklyHolidayHours * wage;

  const totalBase    = weeklyBasePay    * weeks;
  const totalHoliday = weeklyHolidayPay * weeks;
  const total        = totalBase + totalHoliday;

  // --- 표시 (십원 단위 절삭 포맷) ---
  document.getElementById('basePay').innerText    = fmt(totalBase);
  document.getElementById('holidayPay').innerText = fmt(totalHoliday);
  document.getElementById('totalPay').innerText   = fmt(total);

  const remainBase    = budgetBase    - totalBase;
  const remainHoliday = budgetHoliday - totalHoliday;
  const remainTotal   = (budgetBase + budgetHoliday) - total;

  document.getElementById('baseRemain').innerText    = fmt(remainBase);
  document.getElementById('holidayRemain').innerText = fmt(remainHoliday);
  document.getElementById('totalRemain').innerText   = fmt(remainTotal);

  // 예산 초과 경고 (둘 중 하나라도 초과하면 표시)
  const over = remainBase < 0 || remainHoliday < 0 || remainTotal < 0;
  document.getElementById('warn').style.display = over ? 'block' : 'none';
}