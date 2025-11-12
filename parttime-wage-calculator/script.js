
// 숫자 표시 포맷 (십원 단위 절삭)
function fmt(n){
  const tenWon = Math.floor(Number(n) / 10) * 10
  return tenWon.toLocaleString('ko-KR')
}
function val(id){return Number(document.getElementById(id).value||0)}

function calc(){
  const start = new Date(document.getElementById('startDate').value)
  const end = new Date(document.getElementById('endDate').value)
  if(isNaN(start)||isNaN(end)||end<start){alert('근로계약 시작일과 종료일을 정확히 입력하세요.');return;}
  const msPerDay = 1000*60*60*24
  const totalDays = Math.floor((end-start)/msPerDay)+1
  const weeks = totalDays/7

  const days = ['sun','mon','tue','wed','thu','fri','sat']
  let weeklyHours=0, weeklyDays=0
  for(let d of days){
    if(document.getElementById(d).checked){
      const h=val(d+'H')
      weeklyHours+=h
      weeklyDays++
    }
  }

  const volPaid=document.getElementById('volPaid').value
  const volHours=val('volHours')
  const budgetBase=val('budgetBase')
  const budgetHoliday=val('budgetHoliday')
  const wage=val('wage')

  const weeklyPaidHours=weeklyHours+(volPaid==='Y'?volHours:0)
  const holidayEligible=weeklyPaidHours>=15
  const weeklyHolidayHours=holidayEligible?(weeklyPaidHours/Math.max(1,weeklyDays)):0

  const weeklyBasePay=weeklyPaidHours*wage
  const weeklyHolidayPay=weeklyHolidayHours*wage
  const totalBase=weeklyBasePay*weeks
  const totalHoliday=weeklyHolidayPay*weeks
  const total=totalBase+totalHoliday

  document.getElementById('basePay').innerText=fmt(totalBase)
  document.getElementById('holidayPay').innerText=fmt(totalHoliday)
  document.getElementById('totalPay').innerText=fmt(total)
  document.getElementById('baseRemain').innerText=fmt(budgetBase-totalBase)
  document.getElementById('holidayRemain').innerText=fmt(budgetHoliday-totalHoliday)
  document.getElementById('totalRemain').innerText=fmt((budgetBase+budgetHoliday)-total)
  document.getElementById('warn').style.display=(total>(budgetBase+budgetHoliday))?'block':'none'
}