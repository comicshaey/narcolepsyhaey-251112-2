// /static/script.js
// - 휴게시간 차감: 체크박스 ON/OFF + 분 단위 입력 → 하루 유급시간에서 차감
// - 주휴수당 요건: (주 15시간↑) && (개근 가정) && (다음 주 근로 예정) && (그 주 일요일이 계약기간 내)
// - 금액 처리: 기본급 = 십원 단위 내림, 주휴수당 = 십원 단위 내림, 총액 = (내림된 둘의 합) (추가 내림 없음)
// - 반영되는 입력 ID: #startDate #endDate #hourlyWage #hoursPerDay
//   요일 체크: #mon #tue #wed #thu #fri #sat #sun
//   휴게: #breakEnabled #breakMinutes
// - 출력 ID: #outBase #outJhu #outTotal #outMsg
// - 계산 버튼(옵션): #btnCalc

// ====== 도우미 ======
const $ = (sel) => document.querySelector(sel)

function ymd(d){ // YYYY-MM-DD
  const z = (n) => String(n).padStart(2,'0')
  return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`
}

function parseDate(v){
  if(!v) return null
  const [y,m,d] = v.split('-').map(Number)
  if(!y || !m || !d) return null
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

// 1=월 ... 7=일 (Date.getDay는 0=일 ~ 6=토라서 보정)
function dayToKoreaNum(d){
  const w = d.getDay()
  return w === 0 ? 7 : w
}

// 월~일 기준 "주" 키 만들기 (주 시작 = 월요일)
// 주차 표시는 단순화: "YYYY-WMMDD" (그 주의 월요일 날짜를 붙임)
function weekKeyMonToSun(d){
  const x = new Date(d)
  const dow = x.getDay() // 0=일
  const diffToMon = (dow === 0 ? -6 : 1 - dow)
  const monday = addDays(x, diffToMon)
  const y = monday.getFullYear()
  const m = String(monday.getMonth()+1).padStart(2,'0')
  const dd = String(monday.getDate()).padStart(2,'0')
  return `${y}-W${m}${dd}`
}

// 현재 주 키의 다음 주 키
function nextWeekKeyOf(weekKey){
  const m = weekKey.match(/(\d{4})-W(\d{2})(\d{2})/)
  if(!m) return ''
  const y = Number(m[1]), mm=Number(m[2]), dd=Number(m[3])
  const mon = new Date(y, mm-1, dd)
  const nextMon = addDays(mon, 7)
  const nm = String(nextMon.getMonth()+1).padStart(2,'0')
  const nd = String(nextMon.getDate()).padStart(2,'0')
  return `${nextMon.getFullYear()}-W${nm}${nd}`
}

function groupBy(arr, keyFn){
  const m = {}
  for(const it of arr){
    const k = keyFn(it)
    ;(m[k] ||= []).push(it)
  }
  return m
}

function hasAnyPlannedWork(weekArr){
  return weekArr.some(it => it.paidHours > 0)
}

// ====== 계산 메인 ======
function calc(){
  // --- 입력 읽기 ---
  const start = parseDate( $('#startDate')?.value )
  const end   = parseDate( $('#endDate')?.value )
  const hourly = Number( $('#hourlyWage')?.value || 0 )      // 시급
  const hoursPerDay = Number( $('#hoursPerDay')?.value || 0 ) // 하루 소정근로시간(원천)
  const breakEnabled = $('#breakEnabled')?.checked || false
  const breakMinutes = Number( $('#breakMinutes')?.value || 0 )

  const days = ['mon','tue','wed','thu','fri','sat','sun']
  const workDays = new Set( days.filter(d => $(`#${d}`)?.checked) )

  // --- 유효성 체크(필수만) ---
  if(!(start && end && isSameOrBefore(start,end))){
    return showResult(0,0,0,"기간을 확인해줘")
  }
  if(hourly <= 0 || hoursPerDay <= 0){
    return showResult(0,0,0,"시급/근로시간을 확인해줘")
  }
  if(workDays.size === 0){
    return showResult(0,0,0,"근무 요일을 하나 이상 선택해줘")
  }

  // --- 휴게시간 처리 ---
  // 휴게 체크 ON이면 분→시간 변환 후, 하루 유급시간에서 차감
  const breakHours = breakEnabled ? Math.max(0, breakMinutes/60) : 0
  const paidHoursPerDay = Math.max(0, hoursPerDay - breakHours)

  // --- 계약기간 날짜 펼치기 ---
  const daysArr = []
  for(let d=new Date(start); isSameOrBefore(d,end); d=addDays(d,1)){
    const wn = dayToKoreaNum(d) // 1~7
    const key = ['','mon','tue','wed','thu','fri','sat','sun'][wn]
    const planned = workDays.has(key)
    const paidHours = planned ? paidHoursPerDay : 0
    daysArr.push({
      date: new Date(d),
      ymd: ymd(d),
      weekNoKey: weekKeyMonToSun(d),
      isSunday: (wn===7),
      planned,
      paidHours,
    })
  }

  // --- 기본급: 기간 전체 유급시간 합 × 시급 → 십원 단위 내림 ---
  const baseHours = daysArr.reduce((s, it)=> s + it.paidHours, 0)
  const basePayRaw = baseHours * hourly
  const basePay = floor10(basePayRaw) // ✅ 기본급 내림

  // --- 주휴수당: 주별 요건 판정 → 합산 → 십원 단위 내림 ---
  const weeks = groupBy(daysArr, it=>it.weekNoKey)
  let jhuRawSum = 0

  for(const wkKey of Object.keys(weeks)){
    const wk = weeks[wkKey]

    // 1) 주 소정근로시간(휴게 제외 = paidHours)
    const weeklyPlannedHours = wk.reduce((s,it)=> s + it.paidHours, 0)

    // 2) 개근 여부: 현 단계에선 "예정된 근무일 전부 출근"으로 가정
    //    (결근/무단결근 입력 항목이 필요하면 나중에 붙이자)
    const perfectAttendance = true

    // 3) 다음 주 근로 예정: 다음 주에 소정근무일이 1일 이상 있는가
    const nextWeekKey = nextWeekKeyOf(wkKey)
    const hasNextWeekWork = Object.keys(weeks).includes(nextWeekKey)
      ? hasAnyPlannedWork(weeks[nextWeekKey])
      : false

    // 보조: 그 주의 '일요일'이 계약기간 내 존재하는가 (주휴일이 실제로 계약기간 안에 있어야 지급)
    const sundayInside = wk.some(it => it.isSunday && isSameOrAfter(it.date, start) && isSameOrBefore(it.date, end))

    const qualifies = (weeklyPlannedHours >= 15) && perfectAttendance && hasNextWeekWork && sundayInside

    if(qualifies){
      // 하루 소정근로시간: 본 계산기는 고정형 가정(요일 동일)
      jhuRawSum += (paidHoursPerDay * hourly)
    }
  }

  const jhuPay = floor10(jhuRawSum) // ✅ 주휴수당 내림

  // --- 총액: 내림된 기본급 + 내림된 주휴수당 (추가 내림 없음) ---
  const total = basePay + jhuPay

  showResult(basePay, jhuPay, total)
}

// ====== 출력 ======
function showResult(basePay, jhuPay, total, msg){
  const elBase = $('#outBase')
  const elJhu  = $('#outJhu')
  const elTot  = $('#outTotal')
  const elMsg  = $('#outMsg')

  if(elBase) elBase.textContent = Number(basePay).toLocaleString()
  if(elJhu)  elJhu.textContent  = Number(jhuPay).toLocaleString()
  if(elTot)  elTot.textContent  = Number(total).toLocaleString()
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

  // 초기 1회 계산
  calc()
}

document.addEventListener('DOMContentLoaded', bind)