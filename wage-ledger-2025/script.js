// wage-ledger-2025/script.js
const $$=(s,c=document)=>Array.from(c.querySelectorAll(s)); const $=(s,c=document)=>c.querySelector(s);
function fmt0(n){ return new Intl.NumberFormat('ko-KR').format(Math.round(n||0)) }
function num(v){ const n=parseFloat(String(v).replace(/,/g,'')); return isNaN(n)?0:n }

function addRow(){
  const tb = $('#wageTable tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
  <td><input type="text" class="name" placeholder="성명"></td>
  <td><input type="text" class="rank" placeholder="직종/직급"></td>
  <td><input type="number" class="p base" step="1" value="0"></td>
  <td><input type="number" class="p meal" step="1" value="0"></td>
  <td><input type="number" class="p position" step="1" value="0"></td>
  <td><input type="number" class="p family" step="1" value="0"></td>
  <td><input type="number" class="p commute" step="1" value="0"></td>
  <td><input type="number" class="p overtime" step="1" value="0"></td>
  <td><input type="number" class="p night" step="1" value="0"></td>
  <td><input type="number" class="p extra" step="1" value="0"></td>
  <td><input type="number" class="d hi" step="1" value="0"></td>
  <td><input type="number" class="d np" step="1" value="0"></td>
  <td><input type="number" class="d ei" step="1" value="0"></td>
  <td><input type="number" class="d it" step="1" value="0"></td>
  <td><input type="number" class="d lt" step="1" value="0"></td>
  <td><input type="number" class="d other" step="1" value="0"></td>
  <td class="numeric pay">0</td>
  <td class="numeric ded">0</td>
  <td class="numeric net">0</td>`;
  tb.appendChild(tr);
  ['input','change'].forEach(evt=>tr.addEventListener(evt, ()=>recalcRow(tr)));
  recalcRow(tr);
}

function recalcRow(tr){
  const p = ['base','meal','position','family','commute','overtime','night','extra'].reduce((a,k)=>a+num($('.'+k,tr).value),0);
  const d = ['hi','np','ei','it','lt','other'].reduce((a,k)=>a+num($('.'+k,tr).value),0);
  const net = p - d;
  $('.pay',tr).textContent = fmt0(p);
  $('.ded',tr).textContent = fmt0(d);
  $('.net',tr).textContent = fmt0(net);
  recalcTotals();
}

function recalcTotals(){
  let sP=0,sD=0,sN=0;
  $$('#wageTable tbody tr').forEach(tr=>{
    sP += parseFloat($('.pay',tr).textContent.replace(/,/g,''))||0;
    sD += parseFloat($('.ded',tr).textContent.replace(/,/g,''))||0;
    sN += parseFloat($('.net',tr).textContent.replace(/,/g,''))||0;
  });
  $('#sum_pay').textContent = fmt0(sP);
  $('#sum_ded').textContent = fmt0(sD);
  $('#sum_net').textContent = fmt0(sN);
}

function exportExcel(){
  const rows = [['학교장 임용권자 2025 임금대장'], ['기관명',$('#org').value], ['작성월',$('#month').value], ['메모',$('#memo').value], []];
  const head = ['성명','직종/직급','기본급','정액급식비','직책수당','가족수당','교통비','시간외수당','휴일·야간','기타지급','건강보험','국민연금','고용보험','소득세','지방소득세','기타공제','지급합계','공제합계','차인지급액'];
  rows.push(head);
  $$('#wageTable tbody tr').forEach(tr=>{
    rows.push([$('.name',tr).value,$('.rank',tr).value,
      $('.base',tr).value,$('.meal',tr).value,$('.position',tr).value,$('.family',tr).value,$('.commute',tr).value,$('.overtime',tr).value,$('.night',tr).value,$('.extra',tr).value,
      $('.hi',tr).value,$('.np',tr).value,$('.ei',tr).value,$('.it',tr).value,$('.lt',tr).value,$('.other',tr).value,
      $('.pay',tr).textContent,$('.ded',tr).textContent,$('.net',tr).textContent
    ]);
  });
  rows.push([]); rows.push(['합계','','','','','','','','','','','','','','','', $('#sum_pay').textContent, $('#sum_ded').textContent, $('#sum_net').textContent]);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '임금대장 2025');
  XLSX.writeFile(wb, 'wage_ledger_2025.xlsx');
}

function init(){
  $('#addRow').addEventListener('click', addRow);
  $('#clearRows').addEventListener('click', ()=>{ $('#wageTable tbody').innerHTML=''; recalcTotals() });
  $('#exportExcel').addEventListener('click', exportExcel);
  addRow();
}
document.addEventListener('DOMContentLoaded', init);
