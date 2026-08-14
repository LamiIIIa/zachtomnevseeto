/* Snapshot source: https://forumstatic.ru/files/0018/26/1d/86722.js; source encoding: windows-1251 */
if(document.URL.search(/\/edit.php\?id.*&action=edit/igm)!=-1||document.URL.indexOf("/post.php?tid=")!=-1||document.URL.indexOf("/post.php?action=post&tid=")!=-1){
$(document).ready(function() {
var stL0="<style>#get-htm{display:none;} #code-html {overflow:auto;overflow-x:hidden;max-height:300px;width:100%; border:2px inset;font-family: use-lang-def;text-transform: none;font-size: 13px;font-weight: 400;line-height: normal;padding: 1px;text-align: default;text-indent: 0px;}</style><fieldset id=\"get-htm\"><legend><span>HTML-код</span></legend></br><div id=\"code-html\"></div></br></fieldset>";
var stL2="<span class=\"button-html\" style=\"font-size:0.9em;position:absolute;right:16%;\">Получить HTML- код</span><img src=\"http://c.radikal.ru/c43/1806/34/2b198f381acc.png\" class=\"button-html\" style=\"cursor:pointer;cursor:hand;position:absolute;right:13%;margin-top:-4px;\" onclick=\"$('#get-htm').toggle();\"/>";
$("#post-preview").after(stL0);
$("#form-buttons").parents("fieldset").find("legend:first").append(stL2);
$("#code-html").css({"color":""+$("#main-reply").css("color")+""})
$("#code-html").css({"border-color":""+$("#main-reply").css("background-color")+""})
$("#code-html").css({"background-color":""+$("#main-reply").css("background-color")+""})

var Phtm=$("#post-preview .fs-box").html(); //alert(Phtm)
Phtm=Phtm.replace(/&quot;/img,'&#38;quot&#59;');
Phtm=Phtm.replace(/&lt;/igm,"&#38;lt&#59;");
Phtm=Phtm.replace(/&gt;/igm,"&#38;gt&#59;");
Phtm=Phtm.replace(/</igm,"&lt;");
Phtm=Phtm.replace(/>/igm,"&gt;");
Phtm=Phtm.replace(/"/igm,"&quot;");
Phtm=Phtm.replace(/^\t{5}/igm,"");
Phtm=Phtm.replace(/\t/igm,"&#160; &#160; &#160; &#160; ");
Phtm=Phtm.replace(/\n/igm,'<br />'); /*\n*/ //alert(Phtm)
$("#code-html").html(Phtm)
});}

