

// ====== 유틸 ======
const $ = (sel) => document.querySelector(sel)

function ymd(d){ // 날짜를 YYYY-MM-DD 문자열로
  const z = (n) => String(n).padStart(2,'0')
  return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`
}

function parseDate(v){
  const [y,m,d] = v.split('-').map(Number)
  return new Date(y, m-1, d)
}

function addDays(d, n){
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function isSameOrBefore(a,b){ return a.getTime() <= b.getTime() }
function isSameOrAfter(a,b){ return a.getTime() >= b.getTime() }

// 십원 단위 내림(일의 자리를 0으로)
function floor10(n){
  return Math.floor(n / 10) * 10
}

// 월(1)~일(7) 매핑. Date.getDay()는 일(0)~토(6)라서 살짝 보정
function dayToKoreaNum(d){ // 1~7
  const w = d.getDay() // 0~6, 0=일
  return w === 0 ? 7 : w // 7=일
}

// ====== 핵심 계산 ======
function calc(){
  // ---- 입력값 읽기 ----
  const start = parseDate( $('#startDate').value )
  const end   = parseDate( $('#endDate').value )
  const hourly = Number( $('#hourlyWage').value || 0 )        // 시급
  const hoursPerDay = Number( $('#hoursPerDay').value || 0 )   // 하루 소정근로시간(유급 기준)
  const breakEnabled = $('#breakEnabled')?.checked || false
  const breakMinutes = Number( $('#breakMinutes')?.value || 0 )

  // 요일 체크박스: mon,tue,wed,thu,fri,sat,sun
  const days = ['mon','tue','wed','thu','fri','sat','sun']
  const workDays = new Set(
    days.filter(d => $(`#${d}`)?.checked).map(d => d)
  )

  // 유효성 대충 체크 (필수만)
  if(!(start && end && isSameOrBefore(start,end))) return showResult(0,0,0,"기간을 확인해줘")
  if(hourly <= 0 || hoursPerDay <= 0) return showResult(0,0,0,"시급/근로시간을 확인해줘")
  if(workDays.size === 0) return showResult(0,0,0,"근무 요일을 하나 이상 선택해줘")

  // 휴게시간(분)을 시간으로 변환. 휴게 차감이 켜져 있으면 하루 유급시간에서 빼준다.
  const breakHours = breakEnabled ? Math.max(0, breakMinutes/60) : 0
  const paidHoursPerDay = Math.max(0, hoursPerDay - breakHours)

  // ---- 달력 루프(계약기간 내의 모든 날짜) ----
  const daysArr = []
  for(let d=new Date(start); isSameOrBefore(d,end); d=addDays(d,1)){
    const wn = dayToKoreaNum(d) // 1~7 (월1 .. 일7)
    const key = ['','mon','tue','wed','thu','fri','sat','sun'][wn]
    const planned = workDays.has(key) // 소정근무일인가?
    const paidHours = planned ? paidHoursPerDay : 0
    daysArr.push({
      date: new Date(d),
      ymd: ymd(d),
      weekNoKey: weekKeyMonToSun(d), // "YYYY-Wxx" 형태(월~일 기준 주 키)
      isSunday: (wn===7),
      planned,
      paidHours,
    })
  }

  // ---- 기본급: 계획된 근무일의 유급시간 합계 × 시급 ----
  const baseHours = daysArr.reduce((s, it)=> s + it.paidHours, 0)
  const basePay = baseHours * hourly

  // ---- 주휴수당: 주(월~일) 단위로 판정 ----
  const weeks = groupBy(daysArr, it=>it.weekNoKey)

  let jhuPay = 0
  for(const wkKey of Object.keys(weeks)){
    const wk = weeks[wkKey]

    // 그 주의 월~일 중 계약기간 내 "소정근로" 시간 합계(휴게 차감 반영: 소정근로시간은 휴게 제외가 원칙임)
    const weeklyPlannedHours = wk.reduce((s,it)=> s + it.paidHours, 0)

    // 개근 판단: 이 계산기는 “예정된 근무일은 다 출근했다고 가정”
    const perfectAttendance = true

    // 다음 주 근로 예정: 다음 주 구간 중 소정근무일이 1일 이상 존재?
    const nextWeekKey = nextWeekKeyOf(wkKey)
    const hasNextWeekWork = Object.keys(weeks).includes(nextWeekKey) 
      ? hasAnyPlannedWork(weeks[nextWeekKey])
      : false

    // 주휴일(그 주의 일요일)이 계약기간 안에 존재?
    const sundayInside = wk.some(it => it.isSunday && isSameOrAfter(it.date, start) && isSameOrBefore(it.date, end))

    // 3가지 요건 + 일요일 존재해야 인정
    const qualifies = (weeklyPlannedHours >= 15) && perfectAttendance && hasNextWeekWork && sundayInside

    if(qualifies){
      // "하루 소정근로시간" 산정: 이 계산기는 고정형 가정 → paidHoursPerDay 사용
      const oneDayHours = paidHoursPerDay
      jhuPay += (oneDayHours * hourly)
    }
  }

  // ---- 합계 및 십원 단위 내림(최종 1회) ----
  const totalRaw = basePay + jhuPay
  const total = floor10(totalRaw)

  // 기본급/주휴는 보기 좋게만 표시(내림을 이 항목에도 적용하고 싶으면 floor10(basePay) 등으로 바꿔도 됨)
  showResult(basePay, jhuPay, total)
}

// 월~일 기준 "주" 키 만들기 (월요일이 시작)
function weekKeyMonToSun(d){
  const x = new Date(d)
  const day = x.getDay() // 0=일
  // 월요일을 주의 시작으로 만들기 위해 보정
  const diffToMon = (day === 0 ? -6 : 1 - day) // 월요일까지 이동
  const monday = addDays(x, diffToMon)
  const year = monday.getFullYear()
  // 주차 표기는 간단히: 해당 주의 월요일 기준 yyyymmdd 비슷한 키
  const m = String(monday.getMonth()+1).padStart(2,'0')
  const dd = String(monday.getDate()).padStart(2,'0')
  return `${year}-W${m}${dd}`
}

function nextWeekKeyOf(weekKey){
  // weekKey 예: "2026-W0105" → 이 키의 월요일 날짜를 파싱해서 +7일
  const m = weekKey.match(/(\d{4})-W(\d{2})(\d{2})/)
  if(!m) return ''
  const y = Number(m[1]), mm=Number(m[2]), dd=Number(m[3])
  const mon = new Date(y, mm-1, dd)
  const nextMon = addDays(mon, 7)
  const nm = String(nextMon.getMonth()+1).padStart(2,'0')
  const nd = String(nextMon.getDate()).padStart(2,'0')
  return `${nextMon.getFullYear()}-W${nm}${nd}`
}

function hasAnyPlannedWork(weekArr){
  return weekArr.some(it => it.paidHours > 0)
}

function groupBy(arr, keyFn){
  const m = {}
  for(const it of arr){
    const k = keyFn(it)
    ;(m[k] ||= []).push(it)
  }
  return m
}

// ====== 결과 표시 ======
function showResult(basePay, jhuPay, total, msg){
  const elBase = $('#outBase')
  const elJhu  = $('#outJhu')
  const elTot  = $('#outTotal')
  const elMsg  = $('#outMsg')

  if(elBase) elBase.textContent = Math.round(basePay).toLocaleString()
  if(elJhu)  elJhu.textContent  = Math.round(jhuPay).toLocaleString()
  if(elTot)  elTot.textContent  = Math.round(total).toLocaleString()
  if(elMsg)  elMsg.textContent  = msg || ''
}

// ====== 이벤트 바인딩 ======
function bind(){
  const inputs = [
    '#startDate','#endDate','#hourlyWage','#hoursPerDay',
    '#mon','#tue','#wed','#thu','#fri','#sat','#sun',
    '#breakEnabled','#breakMinutes'
  ]
  inputs.forEach(sel=>{
    const el = $(sel)
    if(!el) return
    el.addEventListener('input', calc)
    el.addEventListener('change', calc)
  })
  $('#btnCalc')?.addEventListener('click', (e)=>{ e.preventDefault(); calc() })
}

// 초기화
document.addEventListener('DOMContentLoaded', bind)