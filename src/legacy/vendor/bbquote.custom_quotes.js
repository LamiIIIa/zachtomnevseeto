/* Snapshot source: https://forumstatic.ru/f/su/1bb/bbquote.custom_quotes.js?v=1; source encoding: utf-8 */
/* 
    BB-цитирование: дополнение для обработки нестандартных цитат
    copyright Alex_63, 2024
    12.02.2024 / mod 31.03.2024
*/

if (window.BBQuote)(function() {
	BBQuote.customQuotes = true;
	BBQuote.parseCustomQuotes = function(quote) {
		var cite = quote.children('cite'),
			blockquote = quote.children('blockquote'),
			avatar = blockquote.find('.author-avatar');

		if (!cite.length)
			return '';

		if (avatar.length) {
			avatar.prependTo(cite);
			blockquote.find('.qc-post-link').remove();
		}

		var text = cite.text();

		if (cite.find(".author-avatar").length && cite.find("a.qc-post-link").length) {
			text = quote.attr('id')
				? cite[0].id.substr(1) + "," + quote.attr("id").substr(1)
				: '#p' + cite.find('span.qc-post-link>a').attr('href').split('#p')[1] + ',' + cite.find('.qc-uname:last').text()
		} else if (cite.find(".author-avatar").length && !cite.find('a').length) {
			text = cite.find('.qc-uname:last').text();
		} else if (!cite.find(".author-avatar").length && cite.find("span.qc-post-link").length) {
			text = "#p" + cite.find("span.qc-post-link>a").attr("href").split("#p")[1] + "," + cite.find(".qc-uname:last").text();
		} else if (!cite.find(".qc-uname").length && cite.find("a").length) {
			text = "#p" + cite.find("a[href]").attr("href").split("#p")[1] + "," + text.substring(0, text.lastIndexOf(" "));
		} else if (!cite.find("a[href]").length && text) {
			text = text.substring(0, text.lastIndexOf(" "));
		}

		return text;
	}
}())
