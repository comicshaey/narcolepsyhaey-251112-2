// /static/disable-copy.js
(function(){
  const host = location.hostname||""
  const ok = ["edusprouthaey.co.kr","narcolepsyhaeyisking.co.kr","localhost","127.0.0.1"].includes(host)
  if(!ok) return

  try{document.title+=" •"}catch(_){}

  const stop=e=>e.preventDefault()
  document.addEventListener("contextmenu",stop,{capture:true,passive:false})
  document.addEventListener("selectstart",stop,{capture:true,passive:false})
  document.addEventListener("dragstart",stop,{capture:true,passive:false})

  document.addEventListener("keydown",e=>{
    const k=(e.key||"").toLowerCase()
    if(e.keyCode==123) return e.preventDefault()
    if(e.ctrlKey && ["u","s","c","a","p","i","j","k"].includes(k)) e.preventDefault()
    if(e.ctrlKey && e.shiftKey && ["i","j","c","k"].includes(k)) e.preventDefault()
  },true)

  document.documentElement.style.userSelect="none"

  // 콘솔 감지 리로드는 비활성
  const DEVTOOLS_RELOAD = false
  if(DEVTOOLS_RELOAD){
    setInterval(()=>{
      const t=Date.now();debugger;const d=Date.now()-t
      if(d>120) location.reload()
    },2000)
  }

  document.addEventListener("copy",e=>e.preventDefault(),true)
  window.onbeforeprint=()=>alert("인쇄 제한 중입니다.")
})()
