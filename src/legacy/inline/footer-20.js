document.addEventListener("DOMContentLoaded", () => {

    function buildRadar(radar, stats) {
        const values = stats.split(",").map(Number);
        const labels = ["Нин","Тай","Ген","Тактика","Знания","Сила","Скорость","Чакра","Здоровье","Фуин"];
        const count = values.length;
        const size = 500;
        const center = size/2;
        const radiusMax = 200;

        let svg = `<svg viewBox="0 0 ${size} ${size}">`;

        function ringPoints(r){
            let pts = "";
            for(let i=0;i<count;i++){
                const angle=(Math.PI*2/count)*i - Math.PI/2;
                pts+=`${center + r*Math.cos(angle)},${center + r*Math.sin(angle)} `;
            }
            return pts;
        }

        for(let i=1;i<=10;i++){
            svg+=`<polygon class="radar-circle" points="${ringPoints(radiusMax*(i/10))}"></polygon>`;
        }

        for(let i=0;i<count;i++){
            const angle=(Math.PI*2/count)*i - Math.PI/2;
            svg+=`<line class="radar-line" x1="${center}" y1="${center}" x2="${center + radiusMax*Math.cos(angle)}" y2="${center + radiusMax*Math.sin(angle)}"></line>`;
        }

        for(let i=0;i<count;i++){
            const angle=(Math.PI*2/count)*i - Math.PI/2;
            svg+=`<text class="label" x="${center + (radiusMax+25)*Math.cos(angle)}" y="${center + (radiusMax+25)*Math.sin(angle)}">${labels[i]}</text>`;
        }

        let polygon="";
        for(let i=0;i<count;i++){
            const val=values[i]/10;
            const angle=(Math.PI*2/count)*i - Math.PI/2;
            const r=radiusMax*val;
            polygon+=`${center + r*Math.cos(angle)},${center + r*Math.sin(angle)} `;
        }

        svg+=`<polygon class="radar-area" points="${polygon}"></polygon>`;
        svg+=`</svg>`;
        radar.innerHTML=svg;
    }

    // Ищем все текстовые узлы с [radar=...]
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    const nodesToReplace = [];
    while(walker.nextNode()){
        if(/\[radar=(.*?)\]/.test(walker.currentNode.nodeValue)){
            nodesToReplace.push(walker.currentNode);
        }
    }

    nodesToReplace.forEach(textNode => {
        const parent = textNode.parentNode;
        const frag = document.createDocumentFragment();
        const parts = textNode.nodeValue.split(/\[radar=(.*?)\]/);

        for(let i=0; i<parts.length; i++){
            if(i%2===0){
                frag.appendChild(document.createTextNode(parts[i]));
            } else {
                const stats = parts[i];
                const wrapper = document.createElement("div");
                wrapper.className = "radar-wrapper";

                const radarDiv = document.createElement("div");
                radarDiv.className = "radar";
                radarDiv.dataset.stats = stats;
                wrapper.appendChild(radarDiv);

                if(typeof USERGROUP!=='undefined' && (USERGROUP==1 || USERGROUP==2)){
                    const editor = document.createElement("div");
                    editor.className = "radar-editor";
                    editor.innerHTML = `<input class="radar-input" value="${stats}"><button class="radar-apply">Применить</button>`;
                    wrapper.appendChild(editor);

                    const btn = editor.querySelector(".radar-apply");
                    btn.addEventListener("click", ()=>{
                        const val = editor.querySelector(".radar-input").value.trim();
                        radarDiv.dataset.stats = val;
                        buildRadar(radarDiv,val);
                    });
                }

                buildRadar(radarDiv, stats);
                frag.appendChild(wrapper);
            }
        }
        parent.replaceChild(frag, textNode);
    });
});
