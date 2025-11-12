
const $ = (sel) => document.querySelector(sel)

// 날짜 처리 관련 유틸
function ymd(d){ const z=(n)=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}` }
function parseDate(v){ if(!v)return null; const [y,m,d]=v.split('-').map(Number); return new Date(y,m-1,d) }
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x }
function isSameOrBefore(a,b){return a.getTime()<=b.getTime()}
function isSameOrAfter(a,b){return a.getTime()>=b.getTime()}
function floor10(n){return Math.floor(n/10)*10}

// 요일 관련
function dayToKoreaNum(d){ const w=d.getDay(); return w===0?7:w }
function weekKeyMonToSun(d){
  const dow=d.getDay(), diffToMon=(dow===0?-6:1-dow)
  const monday=addDays(d,diffToMon)
  const y=monday.getFullYear(), m=String(monday.getMonth()+1).padStart(2,'0'), dd=String(monday.getDate()).padStart(2,'0')
  return `${y}-W${m}${dd}`
}
function nextWeekKeyOf(weekKey){
  const m=weekKey.match(/(\d{4})-W(\d{2})(\d{2})/)
  if(!m)return ''
  const [_,y,mm,dd]=m
  const mon=new Date(Number(y),Number(mm)-1,Number(dd))
  const nextMon=addDays(mon,7)
  const nm=String(nextMon.getMonth()+1).padStart(2,'0')
  const nd=String(nextMon.getDate()).padStart(2,'0')
  return `${nextMon.getFullYear()}-W${nm}${nd}`
}
function groupBy(arr,keyFn){const m={};for(const it of arr){const k=keyFn(it);(m[k] ||= []).push(it)}return m}
function hasAnyPlannedWork(weekArr){return weekArr.some(it=>it.paidHours>0)}

// ===== 계산 메인 =====
function calc(){
  const start=parseDate($('#startDate')?.value)
  const end=parseDate($('#endDate')?.value)
  const hourly=Number($('#hourlyWage')?.value||0)
  const hoursPerDay=Number($('#hoursPerDay')?.value||0)
  const breakEnabled=$('#breakEnabled')?.checked||false
  const breakMinutes=Number($('#breakMinutes')?.value||0)
  const days=['mon','tue','wed','thu','fri','sat','sun']
  const workDays=new Set(days.filter(d=>$(`#${d}`)?.checked))

  if(!(start&&end&&isSameOrBefore(start,end))) return showResult(0,0,0,0,"기간을 확인해줘")
  if(hourly<=0||hoursPerDay<=0) return showResult(0,0,0,0,"시급/근로시간을 확인해줘")
  if(workDays.size===0) return showResult(0,0,0,0,"근무 요일을 하나 이상 선택해줘")

  const breakHours=breakEnabled?Math.max(0,breakMinutes/60):0
  const paidHoursPerDay=Math.max(0,hoursPerDay-breakHours)

  const daysArr=[]
  for(let d=new Date(start); isSameOrBefore(d,end); d=addDays(d,1)){
    const wn=dayToKoreaNum(d)
    const key=['','mon','tue','wed','thu','fri','sat','sun'][wn]
    const planned=workDays.has(key)
    const paidHours=planned?paidHoursPerDay:0
    daysArr.push({date:new Date(d),ymd:ymd(d),weekNoKey:weekKeyMonToSun(d),isSunday:(wn===7),planned,paidHours})
  }

  // 기본급 계산
  const baseHours=daysArr.reduce((s,it)=>s+it.paidHours,0)
  const basePay=floor10(baseHours*hourly)

  // 주휴수당 계산
  const weeks=groupBy(daysArr,it=>it.weekNoKey)
  let jhuRaw=0
  for(const wkKey of Object.keys(weeks)){
    const wk=weeks[wkKey]
    const weeklyPlannedHours=wk.reduce((s,it)=>s+it.paidHours,0)
    const perfectAttendance=true
    const nextWeekKey=nextWeekKeyOf(wkKey)
    const hasNextWeekWork=Object.keys(weeks).includes(nextWeekKey)?hasAnyPlannedWork(weeks[nextWeekKey]):false
    const sundayInside=wk.some(it=>it.isSunday&&isSameOrAfter(it.date,start)&&isSameOrBefore(it.date,end))
    const qualifies=(weeklyPlannedHours>=15)&&perfectAttendance&&hasNextWeekWork&&sundayInside
    if(qualifies){ jhuRaw+=paidHoursPerDay*hourly }
  }
  const jhuPay=floor10(jhuRaw)

  const total=basePay+jhuPay
  const budget=Number($('#budget')?.value||0)
  const remain=budget-total

  showResult(basePay,jhuPay,total,remain)
}

// ===== 결과 표시 =====
function showResult(basePay,jhuPay,total,remain,msg){
  $('#outBase').textContent=Number(basePay).toLocaleString()
  $('#outJhu').textContent=Number(jhuPay).toLocaleString()
  $('#outTotal').textContent=Number(total).toLocaleString()

  const elRemain=$('#outRemain')
  elRemain.textContent=Number(remain).toLocaleString()
  elRemain.style.color=remain<0?'red':'#111'
  elRemain.style.fontWeight=remain<0?'700':'500'

  $('#outMsg').textContent=msg||''
}

// ===== 이벤트 바인딩 =====
function bind(){
  const inputs=[
    '#startDate','#endDate','#hourlyWage','#hoursPerDay',
    '#mon','#tue','#wed','#thu','#fri','#sat','#sun',
    '#breakEnabled','#breakMinutes','#budget'
  ]
  inputs.forEach(sel=>{
    const el=$(sel); if(!el) return
    el.addEventListener('input',calc)
    el.addEventListener('change',calc)
  })
  $('#btnCalc')?.addEventListener('click',e=>{e.preventDefault();calc()})
  calc()
}

document.addEventListener('DOMContentLoaded',bind)