const maxDiceCount = 9; // Максимальное кол-во кубиков за один бросок
const defaultDiceCount = 1; // Кол-во кубиков по умолчанию

const maxSideCount = 100; // Максимальное кол-во граней кубика
const defaultSideCount = 10; // Кол-во граней по умолчанию

function unhtml(s) { return s.replace(/&/g,"&").replace(/</g,"<").replace(/>/g,">"); }
 
function numword(s,one,two,many) { return(((s%100>=10 && s%100<=20) || s%10>=5) ? many : (s%10==1 ? one : two)); }
 
function dice() {
        var FoundErrors = '';
        var diceRes=""
        var CountCube = prompt("Количество кубиков", defaultDiceCount );
        if(CountCube>maxDiceCount  || CountCube<=0) {
        alert("Нельзя бросать столько кубиков.");  return false;}
        var SideCube = prompt("Сколько граней у кубика?", defaultSideCount );
        if(SideCube>maxSideCount  || SideCube<=0){
        alert("Не бывает таких кубиков.");         return false;}
        
        for(i=0; i<CountCube;i++)
        {
          var dice = (Math.round(Math.random()*SideCube));
          if(dice==0) dice=1;
          diceRes += dice*1936+"-";
        }
        smile('[dice='+diceRes+CountCube+':'+SideCube+']');
}
 
function addDice(post, from, internal) {
  var str = post.innerHTML;
  var a = $(post).closest('.post').innerHTML;
  var u = "";
  var num = +post.id.match(/\d+/g)[0];
  var date = new Date(+$(post).attr('data-posted')*1000).getSeconds();
  var fCanRandomise = 1;
   
  var ran = num + date;
  return str
    .replace(
        /\[dice=((?:\d+[-—])*)(?:(\d)(\d+)|(\d+)(:)(\d+))]/g,
        function(a, dice, diceC, diceS, adieC, fNewScheme, adieS) {
            dice  = dice.replace(/[-—]/g, '-');
            diceC = parseInt(fNewScheme ? adieC : diceC);
            diceS = parseInt(fNewScheme ? adieS : diceS);
            if(!fCanRandomise && fNewScheme)
                return '<div class="quote-box"><blockquote><p><b>Гадание по кубикам не удалось, сообщите Администрации.</b></p></blockquote></div>';
 
            var i,
                diceR = 0,
                s = '<div class="quote-box"><blockquote '
                    + 'style="text-align:left"><p>'
                    + '<b>Игрок кинул '
            +diceC+numword(diceC,' куб с ',' куба с ',' кубов с ')
            +diceS+numword(diceS,' гранью',' гранями',' гранями')
                    + '<br /><br />Результаты броска '
                    + (fNewScheme ? '' : '(старая схема)')+'</b>: (';
 
            dice = dice.split("-"); 
            for (var i=0; i < dice.length-1; ++i) {
                var d = parseInt(dice[i]/1936); 
                date=((date>>1)+((date&1)<<21))&0x3fffff;
                num=((num>>1)+((num&1)<<22))&0x7fffff;
                if(fNewScheme)
                    d = (ran=(((ran>>1)+(((ran&1) ? 0 : 1)<<23)+d+date)^num)&0xffffff)%diceS + 1;
                diceR += d;
                s+= (i?' + ':'') + d;
            }
 
            return (s + ')' + '=' + diceR + '</p></blockquote></div>');
        }
    );
}
$(document).ready(function() { initDices() });
$(document).on('pun_post', function() { initDices() });
$(document).on('pun_edit', function() { initDices() });

function initDices() {
    if (! FORUM.topic) return;

    $('.post-content').each(function(i, post) {
        var str = post.innerHTML;
        var isDiceInPost = /\[dice=((?:\d+[-—])*)(?:(\d)(\d+)|(\d+)(:)(\d+))]/.test(str);
        if (!isDiceInPost) { return;}
        post.innerHTML = addDice(post);
    });
}
