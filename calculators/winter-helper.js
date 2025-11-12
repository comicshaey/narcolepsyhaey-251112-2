function fmt(n){return Number(n).toLocaleString('ko-KR')}
function val(id){return Number(document.getElementById(id).value||0)}
function calc(){
  const budgetBase = val('budgetBase')
  const budgetHoliday = val('budgetHoliday')
  const wage = val('wage')
  const weeks = val('weeks')
  const weeklyHours = val('weeklyHours')
  const weeklyDays = Math.max(1, val('weeklyDays'))
  const volPaid = document.getElementById('volPaid').value
  const volHours = val('volHours')

  const weeklyPaidHours = weeklyHours + (volPaid==='Y' ? volHours : 0)
  const holidayEligible = weeklyPaidHours >= 15
  const weeklyHolidayHours = holidayEligible ? (weeklyPaidHours / weeklyDays) : 0

  const weeklyBasePay = weeklyPaidHours * wage
  const weeklyHolidayPay = weeklyHolidayHours * wage

  const totalBase = weeklyBasePay * weeks
  const totalHoliday = weeklyHolidayPay * weeks
  const total = totalBase + totalHoliday

  document.getElementById('basePay').innerText = fmt(totalBase)
  document.getElementById('holidayPay').innerText = fmt(totalHoliday)
  document.getElementById('totalPay').innerText = fmt(total)

  const baseRemain = budgetBase - totalBase
  const holidayRemain = budgetHoliday - totalHoliday
  const totalRemain = (budgetBase + budgetHoliday) - total

  document.getElementById('baseRemain').innerText = fmt(baseRemain)
  document.getElementById('holidayRemain').innerText = fmt(holidayRemain)
  document.getElementById('totalRemain').innerText = fmt(totalRemain)

  const over = baseRemain < 0 || holidayRemain < 0 || totalRemain < 0
  document.getElementById('warn').style.display = over ? 'block' : 'none'
}
