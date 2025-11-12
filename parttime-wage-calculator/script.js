// 바이브 코딩 감성, 한국어 주석만 씀 :)

// ===== 유틸 =====
const $ = (sel) => document.querySelector(sel)

function ymd(d) {
  const z = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`
}
function parseDate(v) {
  if (!v) return null
  const [y, m, d] = v.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}
function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
function isSameOrBefore(a, b) {
  return a.getTime() <= b.getTime()
}
function isSameOrAfter(a, b) {
  return a.getTime() >= b.getTime()
}
function floor10(n) {
  return Math.floor(n / 10) * 10
}
function dayToKoreaNum(d) {
  const w = d.getDay()
  return w === 0 ? 7 : w
}
function weekKeyMonToSun(d) {
  const x = new Date(d)
  const dow = x.getDay() // 0=일
  const diffToMon = dow === 0 ? -6 : 1 - dow
  const monday = addDays(x, diffToMon)
  const y = monday.getFullYear()
  const m = String(monday.getMonth() + 1).padStart(2, '0')
  const dd = String(monday.getDate()).padStart(2, '0')
  return `${y}-W${m}${dd}`
}
function nextWeekKeyOf(weekKey) {
  const m = weekKey.match(/(\d{4})-W(\d{2})(\d{2})/)
  if (!m) return ''
  const y = Number(m[1]),
    mm = Number(m[2]),
    dd = Number(m[3])
  const mon = new Date(y, mm - 1, dd)
  const nextMon = addDays(mon, 7)
  const nm = String(nextMon.getMonth() + 1).padStart(2, '0')
  const nd = String(nextMon.getDate()).padStart(2, '0')
  return `${nextMon.getFullYear()}-W${nm}${nd}`
}
function groupBy(arr, keyFn) {
  const m = {}
  for (const it of arr) {
    const k = keyFn(it)
    ;(m[k] ||= []).push(it)
  }
  return m
}
function hasAnyPlannedWork(weekArr) {
  return weekArr.some((it) => it.paidHours > 0)
}

// ===== 계산 메인 =====
function calc() {
  const start = parseDate($('#startDate')?.value)
  const end = parseDate($('#endDate')?.value)
  const hourly = Number($('#hourlyWage')?.value || 0)
  const hoursPerDay = Number($('#hoursPerDay')?.value || 0)
  const breakEnabled = $('#breakEnabled')?.checked || false
  const breakMinutes = Number($('#breakMinutes')?.value || 0)

  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  const workDays = new Set(days.filter((d) => $(`#${d}`)?.checked))

  if (!(start && end && isSameOrBefore(start, end))) {
    return showResult(0, 0, 0, 0, 0, '기간을 확인해줘')
  }
  if (hourly <= 0 || hoursPerDay <= 0) {
    return showResult(0, 0, 0, 0, 0, '시급/근로시간을 확인해줘')
  }
  if (workDays.size === 0) {
    return showResult(0, 0, 0, 0, 0, '근무 요일을 하나 이상 선택해줘')
  }

  // --- 휴게시간 차감 ---
  const breakHours = breakEnabled ? Math.max(0, breakMinutes / 60) : 0
  const paidHoursPerDay = Math.max(0, hoursPerDay - breakHours)

  // --- 계약기간 날짜별로 생성 ---
  const daysArr = []
  for (let d = new Date(start); isSameOrBefore(d, end); d = addDays(d, 1)) {
    const wn = dayToKoreaNum(d)
    const key = ['', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][wn]
    const planned = workDays.has(key)
    const paidHours = planned ? paidHoursPerDay : 0
    daysArr.push({
      date: new Date(d),
      ymd: ymd(d),
      weekNoKey: weekKeyMonToSun(d),
      isSunday: wn === 7,
      planned,
      paidHours,
    })
  }

  // --- 기본급 ---
  const baseHours = daysArr.reduce((s, it) => s + it.paidHours, 0)
  const basePayRaw = baseHours * hourly
  const basePay = floor10(basePayRaw)

  // --- 주휴수당 ---
  const weeks = groupBy(daysArr, (it) => it.weekNoKey)
  let jhuRawSum = 0
  for (const wkKey of Object.keys(weeks)) {
    const wk = weeks[wkKey]
    const weeklyPlannedHours = wk.reduce((s, it) => s + it.paidHours, 0)
    const perfectAttendance = true
    const nextWeekKey = nextWeekKeyOf(wkKey)
    const hasNextWeekWork = Object.keys(weeks).includes(nextWeekKey)
      ? hasAnyPlannedWork(weeks[nextWeekKey])
      : false
    const sundayInside = wk.some(
      (it) =>
        it.isSunday &&
        isSameOrAfter(it.date, start) &&
        isSameOrBefore(it.date, end)
    )
    const qualifies =
      weeklyPlannedHours >= 15 &&
      perfectAttendance &&
      hasNextWeekWork &&
      sundayInside

    if (qualifies) {
      jhuRawSum += paidHoursPerDay * hourly
    }
  }
  const jhuPay = floor10(jhuRawSum)

  // --- 기관부담금 (예: 기본급 + 주휴수당의 10%) ---
  const instPay = floor10((basePay + jhuPay) * 0.1)

  // --- 총액 ---
  const total = basePay + jhuPay + instPay

  // --- 예산 잔액 ---
  const budget = Number($('#budget')?.value || 0)
  const remain = budget - total

  showResult(basePay, jhuPay, instPay, total, remain)
}

// ===== 결과 표시 =====
function showResult(basePay, jhuPay, instPay, total, remain, msg) {
  const elBase = $('#outBase')
  const elJhu = $('#outJhu')
  const elInst = $('#outInst')
  const elTot = $('#outTotal')
  const elRemain = $('#outRemain')
  const elMsg = $('#outMsg')

  if (elBase) elBase.textContent = Number(basePay).toLocaleString()
  if (elJhu) elJhu.textContent = Number(jhuPay).toLocaleString()
  if (elInst) elInst.textContent = Number(instPay).toLocaleString()
  if (elTot) elTot.textContent = Number(total).toLocaleString()

  if (elRemain) {
    elRemain.textContent = Number(remain).toLocaleString()
    elRemain.style.color = remain < 0 ? 'red' : '#111'
    elRemain.style.fontWeight = remain < 0 ? '700' : '500'
  }

  if (elMsg) elMsg.textContent = msg || ''
}

// ===== 이벤트 바인딩 =====
function bind() {
  const inputs = [
    '#startDate',
    '#endDate',
    '#hourlyWage',
    '#hoursPerDay',
    '#mon',
    '#tue',
    '#wed',
    '#thu',
    '#fri',
    '#sat',
    '#sun',
    '#breakEnabled',
    '#breakMinutes',
    '#budget',
  ]
  inputs.forEach((sel) => {
    const el = $(sel)
    if (!el) return
    el.addEventListener('input', calc)
    el.addEventListener('change', calc)
  })
  $('#btnCalc')?.addEventListener('click', (e) => {
    e.preventDefault()
    calc()
  })
  calc()
}

document.addEventListener('DOMContentLoaded', bind)
