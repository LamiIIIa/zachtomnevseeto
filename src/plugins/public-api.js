(function(g){
  'use strict';
  const version='2026-11-21-alwaysdata';
  const staticMirror=g.document?.currentScript?.src.includes('.gitverse.site/')===true;
  if(g.AkatsukiPublicAPI?.version===version)return;
  const primaryOrigin='https://akatski-forum-app.vercel.app';
  const mirrorOrigin='https://akatsuki-forum-mirror.onrender.com';
  const pending=new Map();
  function read(path,options={}) {
    if(!/^\/api\/v1\/(?:bingo|missions|lottery)(?:\?|$)/.test(path))return Promise.reject(Error('Неизвестный публичный API'));
    const config=g.AKATSUKI_PUBLIC_API_CONFIG||{};
    const primary=(options.primary||config.primary||primaryOrigin).replace(/\/$/,'');
    const mirror=config.mirror===false||config.mirror===''?'':(config.mirror||mirrorOrigin).replace(/\/$/,'');
    const key=primary+path+'|'+(options.minRevision||0)+'|'+!!options.requireInitialized;if(pending.has(key))return pending.get(key);
    const alwaysdata='https://itinessity.alwaysdata.net/akatsuki-game-api'+path.slice(4);
    const custom=primary!==primaryOrigin&&primary!==mirrorOrigin;
    const addresses=staticMirror?[mirrorOrigin+path,alwaysdata]:custom||!mirror
      ?[primary+path]:[...new Set([primary+path,mirror+path,alwaysdata])];
    const promise=(async()=>{
      for(const address of addresses){
        try{
          const url=new URL(address);
          url.searchParams.set('__akts_client',version);
          url.searchParams.set('__akts_nonce',String(Date.now()));
          const response=await fetch(url,{cache:'no-store',credentials:'omit',headers:{Accept:'application/json'},signal:AbortSignal.timeout(2500)});
          if(!response.ok){
            if(response.status<500&&![404,429].includes(response.status))
              throw Object.assign(Error('HTTP '+response.status),{permanent:true});
            continue;
          }
          if(!response.headers.get('content-type')?.includes('application/json'))continue;
          const data=await response.json();
          if(!data||typeof data!=='object'||(!Object.hasOwn(data,'saved')&&!Array.isArray(data.periods)))throw Error('Некорректный ответ API');
          if(/^\/api\/v1\/(?:bingo|missions)(?:\?|$)/.test(path)) {
            if(!data.saved||!Number.isSafeInteger(data.saved.revision)||data.saved.revision<0||!Array.isArray(data.saved.records))throw Error('Некорректная версия данных');
            if(data.saved.revision<(options.minRevision||0))throw Error('Устаревшая версия данных');
            if(options.requireInitialized&&data.saved.revision===0&&!data.saved.records.length)throw Error('Пустой ответ до инициализации');
          }
          return data;
        }catch(error){if(error.permanent)throw error;}
      }
      throw Error('Чтение БД недоступно. Попробуйте обновить позже.');
    })().finally(()=>pending.delete(key));
    pending.set(key,promise);return promise;
  }
  g.AkatsukiPublicAPI={version,read,mirror:mirrorOrigin};
})(globalThis);
