// coach-ot/script.js : overtime calculator (similar logic to v2)
const $$=(s,c=document)=>Array.from(c.querySelectorAll(s)); const $=(s,c=document)=>c.querySelector(s);
function fmt(n,d=2){if(n===null||isNaN(n))return'';return new Intl.NumberFormat('ko-KR',{maximumFractionDigits:d,minimumFractionDigits:d}).format(n)}
function fmt0(n){return new Intl.NumberFormat('ko-KR').format(Math.round(n))}
function timeToMin(t){if(!t)return null;const[a,b]=t.split(':').map(Number);return a*60+b}
function minDiff(s,e){if(s==null||e==null)return 0;let S=s,E=e;if(E<S)E+=1440;return E-S}
function overlap([s1,e1],[s2,e2]){const s=Math.max(s1,s2),e=Math.min(e1,e2);return Math.max(0,e-s)}
function nightOverlap(start,end,ns,ne){if(start==null||end==null||ns==null||ne==null)return 0;let S=start,E=end;if(E<S)E+=1440; if(ne<=ns){return overlap([S,E],[ns,1440])+overlap([S,E],[0,ne])} return overlap([S,E],[ns,ne])}
function calcOW(){const base=+($('#base').value||0),meal=+($('#meal').value||0),hol=+($('#holiday').value||0),bon=+($('#bonus').value||0);const ow=(base+meal+hol/12+bon/12)/209;$('#ordinaryWage').value=fmt(ow,2);return ow}
function addRow(data={}){const tb=$('#otTable tbody');const tr=document.createElement('tr');tr.innerHTML=`
<td><input type="date" class="date" value="${data.date||''}"></td>
<td><input type="text" class="dow" disabled></td>
<td><select class="cls"><option value="internal">법내</option><option value="external">법외</option></select></td>
<td class="center"><input type="checkbox" class="isHoliday"></td>
<td><input type="time" class="start" step="60" value="${data.start||''}"></td>
<td><input type="time" class="end" step="60" value="${data.end||''}"></td>
<td class="numeric totalH">0.00</td>
<td class="numeric nightH">0.00</td>
<td class="numeric mulShow">—</td>
<td class="numeric pay">0</td>
<td><input type="text" class="memo" placeholder="비고"></td>`;tb.appendChild(tr);wireRow(tr);return tr}
function wireRow(tr){const date=$('.date',tr),dow=$('.dow',tr),cls=$('.cls',tr),isH=$('.isHoliday',tr),st=$('.start',tr),en=$('.end',tr);
function setDow(){const v=date.value;if(!v){dow.value='';return}const d=new Date(v+'T00:00:00');dow.value=['일','월','화','수','목','금','토'][d.getDay()]; if(dow.value==='일'){isH.checked=true;cls.value='external'}}
function recalc(){const ub=+($('#unpaidBreakMin').value||0);const s=timeToMin(st.value),e=timeToMin(en.value);const diff=Math.max(0,minDiff(s,e)-(isNaN(ub)?0:ub));const tH=diff/60;
 const ns=timeToMin($('#night_start').value), ne=timeToMin($('#night_end').value); const nH=nightOverlap(s,e,ns,ne)/60;
 const mul_i=+($('#mul_internal').value||1.5),mul_e=+($('#mul_external').value||1.5),mul_h=+($('#mul_holiday').value||2.0),nx=+($('#night_extra').value||0.5); const ow=parseFloat(($('#ordinaryWage').value||'0').replace(/,/g,''))||0;
 const mul=isH.checked?mul_h:(cls.value==='external'?mul_e:mul_i); const pay = (ow*mul*tH)+(ow*nx*nH);
 $('.totalH',tr).textContent=fmt(tH,2); $('.nightH',tr).textContent=fmt(nH,2); $('.mulShow',tr).textContent=mul.toFixed(2); $('.pay',tr).textContent=fmt0(pay); aggregate();}
[date,st,en,$('#unpaidBreakMin'),$('#mul_internal'),$('#mul_external'),$('#mul_holiday'),$('#night_extra'),$('#night_start'),$('#night_end')].forEach(el=>{el.addEventListener('change',recalc);el.addEventListener('input',recalc)});
cls.addEventListener('change',recalc); isH.addEventListener('change',recalc); date.addEventListener('change',setDow); setDow(); recalc()}
function aggregate(){let sumH=0,sumN=0,sumPay=0; $$('#otTable tbody tr').forEach(tr=>{sumH+=+($('.totalH',tr).textContent||0); sumN+=+($('.nightH',tr).textContent||0); sumPay+=+($('.pay',tr).textContent.replace(/,/g,'')||0)});
 $('#sum_totalH').textContent=fmt(sumH,2); $('#sum_nightH').textContent=fmt(sumN,2); $('#sum_pay').textContent=new Intl.NumberFormat('ko-KR').format(Math.round(sumPay));
 const weekly=+($('#weeklyHours').value||0),leave=+($('#leaveHours').value||0); $('#actualWeeklyHours').value=fmt(weekly-leave,2); $('#estPay').value=new Intl.NumberFormat('ko-KR').format(Math.round(sumPay))}
function exportExcel(){const rows=[['일자','요일','구분','휴일','시작','종료','총시간','야간시간','배수','금액(원)','비고']]; $$('#otTable tbody tr').forEach(tr=>{rows.push([
 $('.date',tr).value,$('.dow',tr).value,$('.cls',tr).value==='internal'?'법내':'법외',$('.isHoliday',tr).checked?'Y':'',$('.start',tr).value,$('.end',tr).value,$('.totalH',tr).textContent,$('.nightH',tr).textContent,$('.mulShow',tr).textContent,$('.pay',tr).textContent,$('.memo',tr).value||'' ])});
 const ws=XLSX.utils.aoa_to_sheet(rows); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'운동부 OT'); XLSX.writeFile(wb,'coach_overtime.xlsx')}
function init(){addRow(); $('#addRow').addEventListener('click',()=>addRow()); $('#clearRows').addEventListener('click',()=>{$('#otTable tbody').innerHTML=''; addRow(); aggregate()}); $('#exportExcel').addEventListener('click',exportExcel);
 ['base','meal','holiday','bonus'].forEach(id=>$('#'+id).addEventListener('input',()=>{calcOW(); aggregate()})); ['weeklyHours','leaveHours','unpaidBreakMin','mul_internal','mul_external','mul_holiday','night_extra','night_start','night_end'].forEach(id=>$('#'+id).addEventListener('input',aggregate)); calcOW(); aggregate()}
document.addEventListener('DOMContentLoaded',init);
