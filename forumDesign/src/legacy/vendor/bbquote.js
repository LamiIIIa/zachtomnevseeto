/* Snapshot source: https://forumstatic.ru/f/su/1bb/bbquote.js?v=1; source encoding: utf-8 */
/* 
 * BB-quoting for MyBB.ru forums /production/
 * version: 2.0.14
 * created by Alex_63, 11.02.2024, updated 11.04.2025
 * support: vk.com/alex__63, forum.mybb.ru/profile.php?id=32995
**/

if (window.BBQuote && BBQuote.quote) 
    throw new Error('Duplicate found: BBQuote is already installed.');

var BBQuote = {};

(function() {
    BBQuote.version = '2.0.14';
    BBQuote.customTags = {};

    // стандартные теги
    BBQuote.tags = [
        "table", "", "", 
        "strong", "[b]", "[/b]", 
        'span[style="font-style: italic"]', "[i]", "[/i]", 
        "em.bbuline", "[u]", "[/u]", 
        "del", "[s]", "[/s]", 
        'span[style^="color"]', "[color]", "[/color]", 
        'span[style^="font-family"]', "[font]", "[/font]", 
        'span[style^="font-size"]', "[size]", "[/size]", 
        "span.highlight-text", "[mark]", "[/mark]", 
        'span[style*="text-align: "]', "[align]", "[/align]", 
        'p[style*="text-align:"]', "[align]", "[/align]", 
        "sup", "[sup]", "[/sup]", 
        "sub", "[sub]", "[/sub]", 
        "abbr", '[abbr]', "[/abbr]", 
        "img.postimg", "[img]", "[/img]", 
        'img:not(.postimg)[src*="/img/smilies/"][alt]', "", "", 
        "ul>li>p", '', '\n\n',
        "ul>li", "[*]", "\n", 
        'li', '', '\n',
        "ul", "[ul]", "[/ul]\n",
        "p", "\n", "\n", 
        "br", "", "\n", 
        "hr", "", "[hr]",
        ".code-box", "[code]", "[/code]", 
        '.quote-box.spoiler-box.media-box', '[media]', '[/media]',
        ".quote-box.spoiler-box:not(.media-box)", "[spoiler]", "[/spoiler]", 
        '.quote-box.hide-box', "[hide]", "[/hide]", 
        ".quote-box:not(.spoiler-box):not(.hide-box)", "[quote]", "[/quote]", 
        'a.post-mention', '', '',
        "a[href]", "[url]", "[/url]", 
        '.html-post-box .html-content', "[html]", "[/html]", 
        "iframe[src]", "[video]", "[/video]", 
        'div[id^="block-"]', '[block]', '[/block]',
        "style,script", "", ""
    ];

    // обработка кастомных тегов (при их наличии)
    BBQuote.extend = function(obj) {
        for (var selector in obj) {
            BBQuote.customTags[selector] = obj[selector];
            BBQuote.tags.push(selector);
            BBQuote.tags.push(obj[selector][0]);
            BBQuote.tags.push(obj[selector][1]);
        }
    };

    BBQuote.addAttribute = function(tag, attr, quotes) {
        if (!!attr && tag.match(/^\s*\[([a-zA-Z0-9\-_]+)\]\s*$/)) {
            attr = quotes ? '"' + attr + '"' : attr;
            tag = tag.replace(/\]\s*$/, '=' + attr + ']');
        }
        return tag;
    };

    // парсер BB-кодов в заданном контексте
    BBQuote.parse = function(context) {

        var tags = BBQuote.tags;

        function replacer2(str, tag, offset, s) {
            return tag;
        }

        function replacer(str, tag, offset, s) {
            tag = tag.replace(/style="([^"]*)"/img, replacer2)
                .replace(/;/g, " ")
                .replace(/:/g, "=")
                .replace(/"/g, "")
                .replace("background-color", "bgcolor")
                .replace('table-layout', 'layout');
            return "[" + tag + "]";
        }

        context.find('div[onclick]').trigger('click');

        for (var INDEX = 0; INDEX < tags.length; INDEX += 3) $(context.find(tags[INDEX]).get().reverse()).map(function() {
            var startTag = tags[INDEX + 1],
                endTag = tags[INDEX + 2],
                temp,
                attr, 
                tagName = this.tagName.toLowerCase(); 

            // таблицы
            if (tags[INDEX].indexOf("table") != -1) {
                startTag = $(this).clone().wrap("<div></div>").parent().html()
                    .replace(/<tbody>|<\/tbody>/gim, "")
                    .replace(/<((?:table|tr|td)[^>]*)>/gim, replacer);
                startTag = startTag.replace(/<(\/(?:table|tr|td))>/gim, "[$1]");
                $(this).html("");
            }

            // блок "код"
            if ($(this).is('.code-box')) {
                temp = $(this).find(".blockcode>.scrollbox>pre").text();
                $(this).html($('<pre />').text(temp))
            }

            // цитаты и скрытый текст
            if ($(this).is('.quote-box') && !$(this).is('.spoiler-box')) {
                function parseQuoteBox(quoteBox) {
                    var cite = quoteBox.children("cite"),
                        text = cite.text();

                    if (quoteBox.is('.hide-box')) {
                        var match = text.match(/\s(\d+)\s/);
                        startTag = BBQuote.addAttribute(startTag, match && match[1]);
                        return quoteBox.children("blockquote").html();
                    } else if (BBQuote.customQuotes) {
                        text = BBQuote.parseCustomQuotes(quoteBox);
                    } else 
                        text = text.substring(0, text.lastIndexOf(" "));

                    startTag = BBQuote.addAttribute(startTag, text, true);
                    return quoteBox.children("blockquote").html();
                }
                $(this).html(parseQuoteBox($(this)));
            }

            // спойлер текстовый и медиа
            if ($(this).is(".spoiler-box")) {
                function parseSpoilerBox(spoilerBox) {
                    var title = spoilerBox.children("div").html();
                    startTag = BBQuote.addAttribute(startTag, $.trim(title), true);
                    return spoilerBox.children('script').text() || spoilerBox.children("blockquote").html();
                }
                $(this).html(parseSpoilerBox($(this)));
            }

            // теги форматирования текста, выравнивание, цвет и т.п.
            if (tags[INDEX].indexOf("[style") != -1 && tags[INDEX].indexOf(': italic') == -1) {
                var style = $(this).attr('style');
                if (tags[INDEX].indexOf('text-align: ') != -1 && $(this).is('span')) {
                    style = style.split(';')[1];
                }
                try {
                    attr = style.split(';')[0].split(',')[0].split(":")[1].replace(/px|;/g, "");
                } catch (ex) {
                    attr = "";
                }
                startTag = BBQuote.addAttribute(startTag, $.trim(attr));
            }

            // ссылки
            if (tags[INDEX].indexOf("href") != -1 && !$(this).parents("cite").length) {
                attr = $(this).attr("href");
                if (!attr.indexOf('//'))
                    attr = location.protocol + attr;
                else if (!attr.indexOf('/'))
                    attr = location.origin + attr;
                if (attr != $(this).text())
                    startTag = BBQuote.addAttribute(startTag, $.trim(attr));
            }

            // поясняющий текст
            if (tagName == "abbr") {
                attr = $(this).attr("title");
                startTag = BBQuote.addAttribute(startTag, $.trim(attr), true);
            }

            // фрейм HTML в постах от сервиса
            if (tags[INDEX].indexOf(".html-post-box") != -1) {
                attr = $(this).children('iframe[id]').length
                    ? decodeURIComponent(HTMLinPost.frameData[$(this).children('iframe[id]')[0].id])
                    : $(this).html();
                $(this).html($("<pre />").text(attr));
            } 
            
            // видеофреймы
            if (tags[INDEX].indexOf("iframe[src]") != -1) {
                attr = $(this).attr("src");
                startTag += $.trim(attr); 
            }

            // списки
            if (tagName == 'ul') {
                var style = $(this).attr('style');
                if (style) {
                    var listType = style.split(': ')[1];
                    if (listType != 'disc') {
                        startTag = BBQuote.addAttribute(startTag, listType);
                    }
                }
            }

            if (tagName == 'li') {
                $(this).html($.trim($(this).html()));
            }

            // тег [block]
            if (tags[INDEX].indexOf('block') != -1) {
                var cls = $(this).attr('class');
                if (cls == 'hvmask') {
                    $(this).html('');
                    startTag = endTag = '';
                }
                else
                    startTag = BBQuote.addAttribute(startTag, cls);
            }
            
            // изображения
            if (tags[INDEX].indexOf("img.postimg") != -1) {
                attr = $(this).attr("src");
                var title = $(this).attr('title');
                if (title)
                    startTag = BBQuote.addAttribute(startTag, title);
                startTag += $.trim(attr);
            }

            // стандартные смайлы
            if (tagName == "img" && this.src.indexOf("/img/smilies/") != -1 && this.alt && !this.className.match(/postimg/))
                startTag = this.alt;

            if (tagName == "style" || tagName == "script") 
                $(this).html("");

            // кастомные теги и функции их обработки
            for (var selector in BBQuote.customTags) {
                if (tags[INDEX] == selector) {
                    var customFunc = BBQuote.customTags[selector][2];
                    if ($.isFunction(customFunc)) {
                        startTag = customFunc(startTag, $(this));
                    }
                }
            }

            // параграфы
            if (tags[INDEX] == "p") {
                $(this).html($(this).html().replace(/\s*<br[^<>]*>\s*$/, ""));
                if (!$(this).parent().is('.post-content,blockquote') && !$(this).siblings('p').length)
                    startTag = endTag = '';
            }

            startTag = startTag.replace(/\=\]$/, ']');
            $(this).replaceWith(startTag + $(this).html() + endTag);
        });
        return context.text().replace(/\n{4,}/gim, "\n\n");
    }

    // получение HTML выделенной области текста
    BBQuote.getSelectionHTML = function() {
        try {
            var range = FORUM.lastSelectionRange || window.getSelection().getRangeAt(0), 
                html;
            if (range && range.collapsed) 
                html = "";
            else {
                var div = document.createElement("div");
                div.appendChild(range.cloneContents());
                html = div.innerHTML;
            }
            return html;
        } catch(e) {
            return "";
        }
    };

    // основная функция - BB цитирование, предобработка поста или выделенной области
    BBQuote.quote = function(author, postId) {
        var html = BBQuote.getSelectionHTML(),
            selection = window.getSelection && getSelection(),
            range = FORUM.lastSelectionRange || selection && selection.rangeCount && selection.getRangeAt(0),
            parent = $("#p" + postId + "-content");

        if (html && range && $(range.commonAncestorContainer).closest(parent).length) {
            BBQuote.context = $('<div class="post-content" />').html(html);
        } else {
            BBQuote.context = $("#p" + postId + "-content").clone();
            if (!BBQuote.includeNestedQuotes)
                BBQuote.context.find(".quote-box.answer-box").remove();
        }
        BBQuote.context.find("p.lastedit,dl.post-sig").remove();
        BBQuote.context.html(BBQuote.context.html().replace(/\s+(?=<p|<div)/img, ""));
        insert('[quote="' + author + '"]' + $.trim(BBQuote.parse(BBQuote.context)) + "[/quote]\n");
    };

    BBQuote.preserveSelection = function() {
        try {
            var sel = window.getSelection();
            FORUM.lastSelectionRange = sel.isCollapsed ? null : sel.getRangeAt(0).cloneRange()
        } catch(e) {}
    }

    BBQuote.defaultQuote = window.quote;
    window.quote = BBQuote.quote;

    $(document).on('selectionchange', function() {
        setTimeout(BBQuote.preserveSelection)
    })
}());
