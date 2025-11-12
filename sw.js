// /sw.js
self.addEventListener('install', e=>self.skipWaiting())
self.addEventListener('activate', e=>e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', e=>{
  const r = e.request
  const accept = r.headers.get('accept')||''
  const isHTML = r.method==='GET' && (r.mode==='navigate' || accept.includes('text/html'))
  const isStatic = new URL(r.url).pathname.startsWith('/static/')
  if(!isHTML || isStatic) return

  e.respondWith((async()=>{
    try{
      const orig = await fetch(r)
      const ct = (orig.headers.get('content-type')||'').toLowerCase()
      if(!ct.includes('text/html')) return orig

      const text = await orig.text()
      if(text.includes('/static/disable-copy.js')) return new Response(text,{headers:orig.headers,status:orig.status,statusText:orig.statusText})

      const tag = '<script src="/static/disable-copy.js"></script>\n'
      let injected = text
      if(text.includes('</head>')) injected = text.replace('</head>',`  ${tag}</head>`)
      else if(text.includes('</body>')) injected = text.replace('</body>',`  ${tag}</body>`)
      else injected = tag+text

      const headers = new Headers(orig.headers)
      headers.delete('content-length')
      return new Response(injected,{headers,status:orig.status,statusText:orig.statusText})
    }catch(_){
      return fetch(r)
    }
  })())
})
