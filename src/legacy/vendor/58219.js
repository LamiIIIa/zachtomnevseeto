/* Snapshot source: https://forumstatic.ru/files/0012/d8/04/58219.js; source encoding: utf-8 */
/*********************************
  MyBB.ru,
  Тест быстроплюс v2. для imagiart.ru
  Версия: V2.0 РЕНО
  Автор: Deff
  Дата: 14.09.2022 Последняя правка(alert) 20/05/2023
*********************************/
var addComment = parseInt($('script:last').attr('addComment'));
if(isNaN(addComment))addComment = 1;
(function() {

        function setDigit(th) {
            var d=parseInt(th.innerHTML);
            if(d>0)$(th).addClass('noNull');
            th.innerHTML=d;
        }

window.$alert = window.alert;
        function setPlus(sel) {
            window.alert = function (ass) {
                if(ass.indexOf('Мы не смогли сохранить ваше сообщение')!=-1)return;
                $alert(ass)
            }
            var a = sel.prop('href');
            var pid = a.match(/\?id=(\d+)/)[1];

            var uid = sel.parents('.post').find('.pl-email a[href*="profile.php?"]').prop('href');
            if (uid) uid = uid.match(/\?id=(\d+)$/)[1];
            var v = a.match(/&v=(\d+)/)[1] == 0 ? -1 : 1;
            $('#post-' + pid + '-vote').hide();
            $.get(a + '&format=json', function(data) {

//alert(JSON.stringify(data));

                if (data.error && data.error.message) $.jGrowl(data.error.message);
                if (data.delta) {
                    var pr = data.response;
                    if (pr > 0) {
                        pr = pr.toString();
                        $('#p' + pid + ' .post-rating p>a').addClass('noNull');
                    }
                    $('#p' + pid + ' .post-rating p>a').text(pr);
                    var $res = $('.pl-email a[href$="profile.php?id=' + uid + '"]').parents('.post').find('.pa-respect');
                    var $pos = $('.pl-email a[href$="profile.php?id=' + UserID + '"]').parents('.post').find('.pa-positive');

                    function replaceRating(sel, v, revert) {
                        var html = $(sel).html(),
                            delta = v;
                        if (revert) delta = delta > 0 ? -1 : 1;
                        if (v > 0) {
                            html = html.replace(/\[\+(\d+)\//g, function(str, p1, b, p2) {
                                return '[+' + (parseInt(p1) + delta) + '/';
                            });
                        } else {
                            html = html.replace(/\/-(\d+)\]/g, function(str, p1, b, p2) {
                                return '/-' + (parseInt(p1) - delta) + ']';
                            });
                        }
                        $(sel).html(html);
                    };
                    if ($res.html().indexOf('[') != -1) {
                        $res.each(function() {
                            replaceRating(this, v);
                        });
                        $pos.each(function() {
                            replaceRating(this, v);
                        });
                        if (Math.abs(data.delta) == 2) {
                            v = v > 0 ? -1 : 1;
                            $res.each(function() {
                                replaceRating(this, v, 1);
                            });
                            $pos.each(function() {
                                replaceRating(this, v, 1);
                            });
                        }
                    } else {
                        var d0 = $res.find('span:not(.fld-name)').html(),
                            p0 = $pos.find('span:not(.fld-name)').html();
                        var d1 = parseInt(d0) + v;
                        if (p0) {
                            var p1 = parseInt(p0) + v;
                        }
                        if (d1 && d1 > 0) {
                            d1 = '+' + d1;
                        }
                        if (p1 && p1 > 0) {
                            p1 = '+' + p1;
                        }
                        $res.find('span:not(.fld-name)').html(d1);
                        if (p0) $pos.find('span:not(.fld-name)').html(p1);
                    }
                }

            });

        }

        window.BR=function (th) {
            var lnk=$(th).parents('.post-box').find('.post-vote>p>a');
            setPlus(lnk);
        }


    $().pun_mainReady(function() {
        if(addComment)$('div.post-vote').show();
        $('.post .post-rating p a').each(function() {
            this.setAttribute("onclick", "BR(this)");
            $(this).attr('title','Плюс без комментария')
            var a=$(this).parents('.post-rating').next('div.post-vote');
            if(a.length)a.find('p>a').attr('title','Плюсики с комментарием');
            setDigit(this);
        });



        $('.pa-respect a[href*="/relation.php?id="], div.post-vote p > a').live('click', function() {//>img[alt="+"]
            var dig = $(this).parents('.post').find('.post-rating p a')[0];
            $('#pun-reputation').delegate("#reputationButtonSend", "click", function() {
                $('#pun-reputation').undelegate("#reputationButtonSend", "click");
                setTimeout(function(){setDigit(dig);},500);
            });

        })

    });
}());
