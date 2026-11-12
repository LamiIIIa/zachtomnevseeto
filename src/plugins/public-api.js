(function(g){
  'use strict';
  if(g.AkatsukiPublicAPI)return;
  const primaryOrigin='https://akatski-forum-app.vercel.app';
  const mirrorOrigin='https://akatsuki-forum-mirror.onrender.com';
  const pending=new Map();
  function read(path,options={}) {
    if(!/^\/api\/v1\/(?:bingo|missions|lottery)(?:\?|$)/.test(path))return Promise.reject(Error('Неизвестный публичный API'));
    const config=g.AKATSUKI_PUBLIC_API_CONFIG||{};
    const primary=(options.primary||config.primary||primaryOrigin).replace(/\/$/,'');
    const mirror=config.mirror===false||config.mirror===''?'':(config.mirror||mirrorOrigin).replace(/\/$/,'');
    const key=primary+path;if(pending.has(key))return pending.get(key);
    const controller=new AbortController();
    let hedge;
    const custom=primary!==primaryOrigin&&primary!==mirrorOrigin;
    const bases=custom||!mirror?[primary]:[mirror,...(primary===mirror?[]:[primary])];
    async function probe(base,budget) {
      const deadline=Date.now()+budget;
      while(!controller.signal.aborted&&Date.now()<deadline) {
        const attempt=new AbortController();
        const stop=()=>attempt.abort();controller.signal.addEventListener('abort',stop,{once:true});
        const timer=setTimeout(()=>attempt.abort(),Math.min(15000,deadline-Date.now()));
        try {
          const response=await fetch(base+path,{cache:'no-store',credentials:'omit',headers:{Accept:'application/json'},signal:attempt.signal});
          if(!response.ok) {
            if(response.status<500&&response.status!==429)throw Object.assign(Error('HTTP '+response.status),{permanent:true});
            throw Error('HTTP '+response.status);
          }
          if(!(response.headers.get('content-type')||'').includes('application/json'))throw Error('Зеркало запускается');
          const data=await response.json();
          if(!data||typeof data!=='object'||(!Object.hasOwn(data,'saved')&&!Array.isArray(data.periods)))throw Error('Некорректный ответ API');
          return data;
        } catch(error) {
          if(error.permanent||controller.signal.aborted)throw error;
        } finally {
          clearTimeout(timer);controller.signal.removeEventListener('abort',stop);
        }
        await new Promise(resolve=>{
          const timer=setTimeout(done,1000);
          function done(){clearTimeout(timer);controller.signal.removeEventListener('abort',done);resolve();}
          controller.signal.addEventListener('abort',done,{once:true});
          if(controller.signal.aborted)done();
        });
      }
      throw Error('Нет связи с публичным API');
    }
    const requests=bases.map((base,index)=>index===0?probe(base,base===mirror?75000:15000):new Promise((resolve,reject)=>{
      hedge=setTimeout(()=>probe(base,12000).then(resolve,reject),600);
      controller.signal.addEventListener('abort',()=>reject(Error('Завершено')),{once:true});
    }));
    const promise=Promise.any(requests).catch(()=>{throw Error('Не удалось загрузить данные с основного сервера и зеркала. Попробуйте обновить позже.');}).finally(()=>{clearTimeout(hedge);controller.abort();pending.delete(key);});
    pending.set(key,promise);return promise;
  }
  g.AkatsukiPublicAPI={read,mirror:mirrorOrigin};
})(globalThis);
