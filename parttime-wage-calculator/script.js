
// 셀렉터 헬퍼
const $ = (sel) => document.querySelector(sel);

// 날짜/수학 유틸
function ymd(d){var z=n=>String(n).padStart(2,'0');return d.getFullYear()+"-"+z(d.getMonth()+1)+"-"+z(d.getDate())}
function parseDate(v){if(!v)return null;var a=v.split('-').map(Number);if(a.length<3)return null;return new Date(a[0],a[1]-1,a[2])}
function addDays(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x}
function isSameOrBefore(a,b){return a.getTime()<=b.getTime()}
function isSameOrAfter(a,b){return a.getTime()>=b.getTime()}
function floor10(n){return Math.floor(n/10)*10}
function dayToKoreaNum(d){var w=d.getDay();return w===0?7:w}
function weekKeyMonToSun(d){
  var x=new Date(d), dow=x.getDay();
  var diffToMon=(dow===0?-6:1-dow);
  var monday=addDays(x,diffToMon);
  return monday.getFullYear()+"-W"+String(monday.getMonth()+1).padStart(2,'0')+String(monday.getDate()).padStart(2,'0');
}
function nextWeekKeyOf(weekKey){
  var m=weekKey.match(/(\d{4})-W(\d{2})(\d{2})/); if(!m) return '';
  var y=+m[1], mm=+m[2], dd=+m[3];
  var mon=new Date(y,mm-1,dd), nextMon=addDays(mon,7);
  return nextMon.getFullYear()+"-W"+String(nextMon.getMonth()+1).padStart(2,'0')+String(nextMon.getDate()).padStart(2,'0');
}
function groupBy(arr,keyFn){var m={}; for(var i=0;i<arr.length;i++){var it=arr[i], k=keyFn(it); (m[k]||(m[k]=[])).push(it)} return m}
function hasAnyPlannedWork(weekArr){for(var i=0;i<weekArr.length;i++){if(weekArr[i].paidHours>0)return true}return false}
function fmt(n){return Number(n||0).toLocaleString('ko-KR')}

// 메인 계산
function calc(){
  try{
    var start=parseDate(($('#startDate')||{}).value);
    var end=parseDate(($('#endDate')||{}).value);
    var hourly=Number(($('#hourlyWage')||{}).value||0);
    var hoursPerDay=Number(($('#hoursPerDay')||{}).value||0);
    var breakEnabled=(($('#breakEnabled')||{}).checked)||false;
    var breakMinutes=Number(($('#breakMinutes')||{}).value||0);

    var days=['mon','tue','wed','thu','fri','sat','sun'];
    var workDays=new Set();
    for(var i=0;i<days.length;i++){
      var id=days[i], el=$('#'+id);
      if(el && el.checked) workDays.add(id);
    }

    if(!(start&&end&&isSameOrBefore(start,end))) return showResult(0,0,0,0,0,0,"기간을 확인해줘");
    if(hourly<=0||hoursPerDay<=0) return showResult(0,0,0,0,0,0,"시급/근로시간을 확인해줘");
    if(workDays.size===0) return showResult(0,0,0,0,0,0,"근무 요일을 하나 이상 선택해줘");

    var breakHours=breakEnabled?Math.max(0,breakMinutes/60):0;
    var paidHoursPerDay=Math.max(0,hoursPerDay-breakHours);

    var daysArr=[], d;
    for(d=new Date(start); isSameOrBefore(d,end); d=addDays(d,1)){
      var wn=dayToKoreaNum(d);
      var key=['','mon','tue','wed','thu','fri','sat','sun'][wn];
      var planned=workDays.has(key);
      daysArr.push({
        date:new Date(d),
        ymd:ymd(d),
        weekNoKey:weekKeyMonToSun(d),
        isSunday:(wn===7),
        planned:planned,
        paidHours: planned ? paidHoursPerDay : 0
      });
    }

    var workDayCount=0; for(i=0;i<daysArr.length;i++){ if(daysArr[i].planned) workDayCount++; }

    var baseHours=0; for(i=0;i<daysArr.length;i++){ baseHours+=daysArr[i].paidHours; }
    var basePay=floor10(baseHours*hourly);

    var weeks=groupBy(daysArr,function(it){return it.weekNoKey});
    var jhuRawSum=0, jhuDaysCount=0;
    var keys=Object.keys(weeks);
    for(i=0;i<keys.length;i++){
      var wk=weeks[keys[i]];
      var weeklyHours=0; for(var j=0;j<wk.length;j++){ weeklyHours+=wk[j].paidHours; }
      var nextKey=nextWeekKeyOf(keys[i]);
      var hasNext = (weeks.hasOwnProperty(nextKey)) ? hasAnyPlannedWork(weeks[nextKey]) : false;
      var sundayInside=false;
      for(j=0;j<wk.length;j++){
        var it=wk[j];
        if(it.isSunday && isSameOrAfter(it.date,start) && isSameOrBefore(it.date,end)){ sundayInside=true; break; }
      }
      if(weeklyHours>=15 && hasNext && sundayInside){
        jhuRawSum += paidHoursPerDay*hourly;
        jhuDaysCount += 1;
      }
    }
    var jhuPay=floor10(jhuRawSum);

    var total=basePay+jhuPay;

    var budgetEl=$('#budget');
    var budget=Number(budgetEl?budgetEl.value:0);
    var remain=budget-total;

    showResult(basePay,jhuPay,total,remain,workDayCount,jhuDaysCount,"");
  }catch(e){
    var msg = (e && e.message) ? e.message : String(e);
    showResult(0,0,0,0,0,0,"오류: "+msg);
    // 콘솔에도 남겨두자
    console.error(e);
  }
}

// 결과 표시
function showResult(basePay,jhuPay,total,remain,workDays,jhuDays,msg){
  var outBase=$('#outBase'), outJhu=$('#outJhu'), outTot=$('#outTotal'),
      outRemain=$('#outRemain'), outMsg=$('#outMsg'), outLine=$('#outDaysLine');

  if(outBase) outBase.textContent = fmt(basePay);
  if(outJhu)  outJhu.textContent  = fmt(jhuPay);
  if(outTot)  outTot.textContent  = fmt(total);

  if(outLine){
    var paidDays=workDays+jhuDays;
    outLine.textContent = "실근로일 "+workDays+"일 + 유급주휴일 "+jhuDays+"일 = 총 "+paidDays+"일";
  }

  if(outRemain){
    outRemain.textContent = fmt(remain);
    outRemain.style.color = remain < 0 ? 'red' : '#111';
    outRemain.style.fontWeight = remain < 0 ? '700' : '500';
  }

  if(outMsg) outMsg.textContent = msg || '';
}

// 바인딩
function bind(){
  var ids=[
    'startDate','endDate','hourlyWage','hoursPerDay',
    'mon','tue','wed','thu','fri','sat','sun',
    'breakEnabled','breakMinutes','budget'
  ];
  for(var i=0;i<ids.length;i++){
    var el=document.getElementById(ids[i]);
    if(!el) continue;
    el.addEventListener('input',calc);
    el.addEventListener('change',calc);
  }
  var btn=document.getElementById('btnCalc');
  if(btn){
    btn.addEventListener('click',function(e){ e.preventDefault(); calc(); });
  }else{
    // 버튼이 없으면 경고 출력
    showResult(0,0,0,0,0,0,"'계산하기' 버튼을 찾을 수 없어요(id=btnCalc).");
  }
  // 로드 시 1회 계산 (입력 기본값 반영)
  calc();
}

// DOMContentLoaded 보장
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',bind);
}else{
  bind();
}
