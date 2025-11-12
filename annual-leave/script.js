
/**
 * annual-leave/script.js
 * 교육공무직 연차 유급휴가 일수 계산기
 * - 업로드된 annual-leave/index.html의 요소 IDs/구조에 맞춤
 * - addEx(), calc(), downloadHwp() 포함
 * - DOMContentLoaded 시 자동 바인딩 및 1회 계산
 * - 별도의 auto-calc-patch.js 없이도 자동 계산 동작
 */

/* ---------- Utilities ---------- */
function parseDate(id) {
  var el = typeof id === "string" ? document.getElementById(id) : id;
  var v = el ? (el.value || el.textContent || "") : "";
  return v ? new Date(String(v).slice(0, 10) + "T00:00:00") : null;
}

function countDaysExcludingSaturday(start, end) {
  if (!start || !end) return 0;
  var cnt = 0;
  for (var d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 6) cnt++; // 토요일 제외
  }
  return cnt;
}

function yearsBetween(start, end) {
  if (!start || !end) return 0;
  var y = end.getFullYear() - start.getFullYear();
  var a = new Date(start);
  a.setFullYear(start.getFullYear() + y);
  if (a > end) y--;
  return y;
}

function z(n) { return ("0" + n).slice(-2); }

/* ---------- Dynamic Exclusion Period Rows ---------- */
function addEx() {
  var box = document.getElementById("exList");
  if (!box) return;

  var wrap = document.createElement("div");
  wrap.className = "exitem";
  wrap.innerHTML =
    '<div class="row">'
    + '<div><label>사유</label><input type="text" class="exReason" placeholder="예: 육아휴직"></div>'
    + '<div><label>시작</label><input type="date" class="exStart"></div>'
    + "</div>"
    + '<div class="row">'
    + '<div><label>종료</label><input type="date" class="exEnd"></div>'
    + '<div style="display:flex;align-items:flex-end"><button class="btn delExBtn" type="button">삭제</button></div>'
    + "</div>";

  box.appendChild(wrap);

  // Bind events
  var del = wrap.querySelector(".delExBtn");
  if (del) del.addEventListener("click", function () { wrap.remove(); calc(); });

  wrap.querySelectorAll("input").forEach(function (el) {
    el.addEventListener("input", calc);
    el.addEventListener("change", calc);
  });

  calc();
}

/* ---------- Core Calculation ---------- */
function calc() {
  // 1) 입력값 수집
  var ps = parseDate("periodStart"),
      pe = parseDate("periodEnd"),
      vac1s = parseDate("vac1Start"),
      vac1e = parseDate("vac1End"),
      vac2s = parseDate("vac2Start"),
      vac2e = parseDate("vac2End"),
      absS  = parseDate("absStart"),
      absE  = parseDate("absEnd");

  var vac1Work = parseInt(document.getElementById("vac1Work").value || "0", 10);
  var vac2Work = parseInt(document.getElementById("vac2Work").value || "0", 10);

  // 2) 일수 계산 (토요일 제외)
  var total = countDaysExcludingSaturday(ps, pe);          // 달력상 총일수(토 제외)
  var vac1  = countDaysExcludingSaturday(vac1s, vac1e);    // 여름방학
  var vac2  = countDaysExcludingSaturday(vac2s, vac2e);    // 겨울방학
  var abs   = countDaysExcludingSaturday(absS, absE);      // 결근/제외(단일 입력)

  // 제외기간(여러 건) 누적
  var excl = (function () {
    var items = document.querySelectorAll("#exList .exitem");
    var t = 0;
    for (var i = 0; i < items.length; i++) {
      var s = items[i].querySelector(".exStart");
      var e = items[i].querySelector(".exEnd");
      if (s && e && s.value && e.value) {
        t += countDaysExcludingSaturday(new Date(s.value + "T00:00:00"), new Date(e.value + "T00:00:00"));
      }
    }
    return t;
  })();

  // 학기 총일수/근무일수
  var semester = total - (vac1 + vac2);
  var daysNoVacWork = semester - excl - abs;            // 방중출근 제외 전
  var worked = daysNoVacWork + vac1Work + vac2Work;     // 실제 근무일수(방중출근 포함)

  // 3) 화면 반영
  var daysSemesterEl = document.getElementById("daysSemester");
  var daysNoVacWorkEl = document.getElementById("daysNoVacWork");
  var daysWorkedEl = document.getElementById("daysWorked");
  if (daysSemesterEl) daysSemesterEl.value = semester || 0;
  if (daysNoVacWorkEl) daysNoVacWorkEl.value = daysNoVacWork || 0;
  if (daysWorkedEl)    daysWorkedEl.value = worked || 0;

  // 4) 근속/기본연차 계산
  var type = document.getElementById("type").value; // 상시근무자 / 방학중비상시근무자
  var base = (type === "상시근무자") ? 15 : 12;

  // 기준일(연차 부여 기준일): 기간 종료일 + 1일의 연도 기준, 기관=1/1, 학교=3/1
  var peNext = (pe) ? new Date(pe.getTime() + 24 * 3600 * 1000) : null;
  var targetYear = peNext ? peNext.getFullYear() : (new Date()).getFullYear();
  var grantOrg = document.getElementById("grantOrg").value;
  var ref = new Date(targetYear, grantOrg === "기관" ? 0 : 2, 1); // 1월1일 or 3월1일

  var firstHire = parseDate("firstHire");
  var years = yearsBetween(firstHire, ref);
  var extra = firstHire ? Math.floor(Math.max(years - 1, 0) / 2) : 0;

  // 화면 반영
  var baseLeaveEl = document.getElementById("baseLeave");
  var yearsEl = document.getElementById("years");
  var extraLeaveEl = document.getElementById("extraLeave");
  if (baseLeaveEl)  baseLeaveEl.value = base;
  if (yearsEl)      yearsEl.value = years;
  if (extraLeaveEl) extraLeaveEl.value = extra;

  // 기준일 표시
  var refDateEl = document.getElementById("refDate");
  if (ref && refDateEl) {
    refDateEl.value = ref.getFullYear() + "." + z(ref.getMonth() + 1) + "." + z(ref.getDate());
  }

  // 5) 부여 규칙 텍스트(학기 기준 / 달력상 총일수 기준)
  function ratio(a, b) { return (b > 0) ? (a / b) : 0; }

  var semText = "-";
  if (type !== "상시근무자") {
    var r1 = ratio(worked, semester);
    var r2 = ratio(worked, semester - excl);
    if (r1 >= 0.8) {
      semText = (base + extra) + " 일";
    } else if (r1 < 0.8 && r2 >= 0.8) {
      semText = ((base + extra) * (semester - excl) / semester).toFixed(2) + " 일 (비율부여)";
    } else {
      semText = "개근 월수만큼 부여";
    }
  }

  var r3 = ratio(worked, total), r4 = ratio(worked, total - excl);
  var calText = "-";
  if (r3 >= 0.8) {
    calText = (15 + extra) + " 일";
  } else if (r3 < 0.8 && r4 >= 0.8) {
    calText = ((15 + extra) * (total - excl) / total).toFixed(2) + " 일 (비율부여)";
  } else {
    calText = "개근 월수만큼 부여";
  }

  var ruleSemesterEl = document.getElementById("ruleSemester");
  var ruleCalendarEl = document.getElementById("ruleCalendar");
  if (ruleSemesterEl) ruleSemesterEl.innerText = semText;
  if (ruleCalendarEl) ruleCalendarEl.innerText = calText;
}

/* ---------- HWP-like Export ---------- */
function downloadHwp() {
  // 경고: 실제 HWP 바이너리를 생성하는 것은 불가. 한글에서 열리는 HTML을 .hwp 확장자로 저장.
  var jobSel = document.getElementById("jobSelect") ? document.getElementById("jobSelect").value : "";
  var job = (jobSel === "직접 입력")
    ? (document.getElementById("jobCustom") ? document.getElementById("jobCustom").value : "")
    : jobSel;

  var name = document.getElementById("empName") ? document.getElementById("empName").value : "";
  var firstHire = document.getElementById("firstHire") ? document.getElementById("firstHire").value : "";
  var orgName = document.getElementById("orgName") ? document.getElementById("orgName").value : "";
  var refDate = document.getElementById("refDate") ? document.getElementById("refDate").value : "";
  var ruleCal = document.getElementById("ruleCalendar") ? document.getElementById("ruleCalendar").innerText : "";

  var leaveDays = "";
  var m = (ruleCal || "").match(/([0-9]+(\.[0-9]+)?)\s*일/);
  if (m) leaveDays = m[1];

  var ymd = (refDate || new Date().toISOString().slice(0, 10)).replace(/-/g, ".");

  // 출근율 체크 라벨(학기 기준)
  var ps = parseDate("periodStart"),
      pe = parseDate("periodEnd"),
      vac1s = parseDate("vac1Start"),
      vac1e = parseDate("vac1End"),
      vac2s = parseDate("vac2Start"),
      vac2e = parseDate("vac2End"),
      absS  = parseDate("absStart"),
      absE  = parseDate("absEnd");

  var total = countDaysExcludingSaturday(ps, pe);
  var vac1 = countDaysExcludingSaturday(vac1s, vac1e);
  var vac2 = countDaysExcludingSaturday(vac2s, vac2e);
  var semester = total - (vac1 + vac2);

  // 제외/결근/방중출근 반영
  var excl = (function () {
    var items = document.querySelectorAll("#exList .exitem");
    var t = 0;
    for (var i = 0; i < items.length; i++) {
      var s = items[i].querySelector(".exStart");
      var e = items[i].querySelector(".exEnd");
      if (s && e && s.value && e.value) {
        t += countDaysExcludingSaturday(new Date(s.value + "T00:00:00"), new Date(e.value + "T00:00:00"));
      }
    }
    return t;
  })();

  var abs = countDaysExcludingSaturday(absS, absE);
  var daysNoVacWork = semester - excl - abs;
  var vac1Work = parseInt(document.getElementById("vac1Work").value || "0", 10);
  var vac2Work = parseInt(document.getElementById("vac2Work").value || "0", 10);
  var worked = daysNoVacWork + vac1Work + vac2Work;
  var r1 = (semester > 0) ? worked / semester : 0;
  var chk80 = r1 >= 0.8 ? "80% 이상 ( ○ )<br>80% 미만 (   )" : "80% 이상 (   )<br>80% 미만 ( ○ )";

  var h =
    '<html><head><meta charset="utf-8"><title>연차휴가일수 통보서</title></head>' +
    '<body style="font-family:Malgun Gothic,Arial,sans-serif; line-height:1.6">' +
    '<h2 style="text-align:center;margin-top:40px">교육공무직 연차휴가일수 및 보수표 통보서</h2>' +
    '<table border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse:collapse; margin-top:24px">' +
    '<tr><th>직 종</th><th>근로자</th><th>최초임용일</th><th>전년도 출근율</th><th>연차휴가일수</th><th>비고</th></tr>' +
    '<tr>' +
    '<td style="text-align:center">' + (job || "") + "</td>" +
    '<td style="text-align:center">' + (name || "") + "</td>" +
    '<td style="text-align:center">' + (firstHire || "") + "</td>" +
    '<td style="text-align:center">' + chk80 + "</td>" +
    '<td style="text-align:center">' + (leaveDays ? (leaveDays + "일") : "") + "</td>" +
    "<td></td>" +
    "</tr></table>" +
    '<p style="margin-top:12px">불입 직종별 보수표 사본 1부. 끝.</p>' +
    '<p style="text-align:center;margin-top:60px">' + ymd + "</p>" +
    '<p style="text-align:center;margin-top:40px">(' + (orgName || "(기관명)") + ")장 (직인)</p>" +
    "</body></html>";

  var blob = new Blob([h], { type: "application/octet-stream" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "연차휴가일수_통보서_" + (name || "") + ".hwp";
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}

/* ---------- Job Select: Custom Input Toggle ---------- */
(function () {
  var sel = document.getElementById("jobSelect");
  var custom = document.getElementById("jobCustom");
  function toggle() {
    if (!sel || !custom) return;
    custom.style.display = (sel.value === "직접 입력") ? "block" : "none";
  }
  if (sel) sel.addEventListener("change", toggle);
  toggle();
})();

/* ---------- Global Bindings ---------- */
function bindAll() {
  // 입력 변화 시 자동 계산
  document.querySelectorAll("input, select").forEach(function (el) {
    if (!el._calcBound) {
      el.addEventListener("input", function () { try { calc(); } catch (e) {} });
      el.addEventListener("change", function () { try { calc(); } catch (e) {} });
      el._calcBound = true;
    }
  });

  // 제외기간 버튼 연결
  var btn = document.getElementById("addExBtn");
  if (btn && !btn._bound) {
    btn.addEventListener("click", addEx);
    btn._bound = true;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  bindAll();
  try { calc(); } catch (e) {
    if (console && console.warn) console.warn("calc() 초기 실행 실패:", e);
  }
  // 동적 행 추가 대비
  var obs = new MutationObserver(function () { bindAll(); });
  obs.observe(document.body, { childList: true, subtree: true });
});

window.addEventListener("load", function () { try { calc(); } catch (e) {} });
