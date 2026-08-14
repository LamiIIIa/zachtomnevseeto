$(".post-content").html(function() {
      var pos = 0, spanpos = 0, brpos = 0; var str = this.innerHTML;
      while (true) {
        spanpos = str.indexOf("<span", pos);
        brpos = str.substring(pos).search(/(\<br\s?\/?\>)+(?!<span style="display:inline-block)/);
        if (brpos == -1) {return str;} else {brpos += pos;}
        if (spanpos < brpos && spanpos != -1) {
          var span1 = 1, span2 = 0; pos = spanpos + 2;
          while (span1 != span2) {
            pos = str.indexOf("span", pos);
            if (str.substring(pos-1, pos) == "/") {span2++;} else {span1++;}
            pos++;
            if (str.indexOf("<span", pos) == str.indexOf("<br>", pos)) {break;}
          }
        } else if (spanpos > brpos || spanpos == -1) {
          str = str.substring(0, brpos) + str.substring(brpos).replace(/(\<br\s?\/?\>)+/, '</p><p>'); pos = brpos++;
        } else {return str;}
      }
     })
