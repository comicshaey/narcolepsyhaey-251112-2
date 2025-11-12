const $ = (sel) => document.querySelector(sel)

function ymd(d){const z=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`}
function parseDate(v){if(!v)return null;const [y,m,d]=v.split('-').map(Number);if(!y||!m||!d)return null;return new Date(y,m-1,d)}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function isSameOrBefore(a,b){return a.getTime()<=b.getTime()}
function isSameOrAfter(a,b){return a.getTime()>=b.getTime()}
function floor10(n){return Math.floor(n/10)*10}
function dayToKoreaNum(d){const w=d.getDay();return w===0?7:w}
function weekKeyMonToSun(d){
  const x=new Date(d), dow=x.getDay()
  const diffToMon=(dow===0?-6:1-dow)
  const monday=addDays(x,diffToMon)
  return `${monday.getFullYear()}-W${String(monday.getMonth()+1).padStart(2,'0')}${String(monday.getDate()).padStart(2,'0')}`
}
function nextWeekKeyOf(weekKey){
  const m=weekKey.match(/(\d{4})-W(\d{2})(\d{2})/)
  if(!m) return ''
  const y=+m[1], mm=+m[2], dd=+m[3]
  const mon=new Date(y,mm-1,dd)
  const nextMon=addDays(mon,7)
  return `${nextMon.getFullYear()}-W${String(nextMon.getMonth()+1).padStart(2,'0')}${String(nextMon.getDate()).padStart(2,'0')}`
}
function groupBy(arr,keyFn){const m={};for(const it of arr){const k=keyFn(it);(m[k] ||= []).push(it)}return m}
function hasAnyPlannedWork(weekArr){return weekArr.some(it=>it.paidHours>0)}

// ===== 메인 계산 =====
function calc(){
  const start=parseDate($('#startDate')?.value)
  const end=parseDate($('#endDate')?.value)
  const hourly=Number($('#hourlyWage')?.value||0)
  const hoursPerDay=Number($('#hoursPerDay')?.value||0)
  const breakEnabled=$('#breakEnabled')?.checked||false
  const breakMinutes=Number($('#breakMinutes')?.value||0)
  const days=['mon','tue','wed','thu','fri','sat','sun']
  const workDays=new Set(days.filter(d=>$(`#${d}`)?.checked))

  if(!(start&&end&&isSameOrBefore(start,end))) return showResult(0,0,0,0,0,"기간을 확인해줘")
  if(hourly<=0||hoursPerDay<=0) return showResult(0,0,0,0,0,"시급/근로시간을 확인해줘")
  if(workDays.size===0) return showResult(0,0,0,0,0,"근무 요일을 하나 이상 선택해줘")

  const breakHours = breakEnabled ? Math.max(0, breakMinutes/60) : 0
  const paidHoursPerDay = Math.max(0, hoursPerDay - breakHours)

  const daysArr=[]
  for(let d=new Date(start); isSameOrBefore(d,end); d=addDays(d,1)){
    const wn=dayToKoreaNum(d)
    const key=['','mon','tue','wed','thu','fri','sat','sun'][wn]
    const planned=workDays.has(key)
    daysArr.push({
      date:new Date(d),
      ymd:ymd(d),
      weekNoKey:weekKeyMonToSun(d),
      isSunday:(wn===7),
      planned,
      paidHours: planned ? paidHoursPerDay : 0
    })
  }

  // ✅ 실근로일 계산
  const workDayCount = daysArr.filter(it=>it.planned).length

  // ✅ 기본급
  const baseHours = daysArr.reduce((s,it)=>s+it.paidHours,0)
  const basePay   = floor10(baseHours * hourly)

  // ✅ 주휴수당 (법정 요건 반영)
  const weeks = groupBy(daysArr,it=>it.weekNoKey)
  let jhuRawSum=0, jhuDaysCount=0
  for(const wkKey of Object.keys(weeks)){
    const wk=weeks[wkKey]
    const weeklyHours=wk.reduce((s,it)=>s+it.paidHours,0)
    const nextWeekKey=nextWeekKeyOf(wkKey)
    const hasNext=Object.keys(weeks).includes(nextWeekKey)?hasAnyPlannedWork(weeks[nextWeekKey]):false
    const sundayInside=wk.some(it=>it.isSunday && isSameOrAfter(it.date,start)&&isSameOrBefore(it.date,end))
    if(weeklyHours>=15 && hasNext && sundayInside){
      jhuRawSum += paidHoursPerDay * hourly
      jhuDaysCount += 1
    }
  }
  const jhuPay=floor10(jhuRawSum)

  // ✅ 총액
  const total=basePay+jhuPay

  // ✅ 예산 잔액
  const budget=Number($('#budget')?.value||0)
  const remain=budget-total

  // ✅ 출력
  showResult(basePay,jhuPay,total,remain,workDayCount,jhuDaysCount)
}

// ===== 결과 표시 =====
function showResult(basePay,jhuPay,total,remain,workDays,jhuDays,msg){
  $('#outBase')?.textContent=basePay.toLocaleString()
  $('#outJhu')?.textContent=jhuPay.toLocaleString()
  $('#outTotal')?.textContent=total.toLocaleString()

  // ✅ 지급일수 한 줄 표시
  const paidDays=workDays+jhuDays
  const textLine=`실근로일 ${workDays}일 + 유급주휴일 ${jhuDays}일 = 총 ${paidDays}일`
  const lineEl=$('#outDaysLine')
  if(lineEl) lineEl.textContent=textLine

  const elR=$('#outRemain')
  if(elR){
    elR.textContent=remain.toLocaleString()
    elR.style.color=remain<0?'red':'#111'
    elR.style.fontWeight=remain<0?'700':'500'
  }
  $('#outMsg')?.textContent=msg||''
}

// ===== 이벤트 =====
function bind(){
  const inputs=[
    '#startDate','#endDate','#hourlyWage','#hoursPerDay',
    '#mon','#tue','#wed','#thu','#fri','#sat','#sun',
    '#breakEnabled','#breakMinutes','#budget'
  ]
  inputs.forEach(sel=>{
    const el=$(sel);if(!el)return
    el.addEventListener('input',calc)
    el.addEventListener('change',calc)
  })
  $('#btnCalc')?.addEventListener('click',e=>{e.preventDefault();calc()})
  calc()
}

document.addEventListener('DOMContentLoaded',bind)
