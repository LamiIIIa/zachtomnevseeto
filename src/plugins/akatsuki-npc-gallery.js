(function () {
  'use strict';

  var CONFIG = {
    baseUrl: 'https://akatsukigood.forum.cool',
    sourceTopicId: 214,
    targetForumId: 8,
    shuffleIntervalMs: 5 * 60 * 1000,
    title: '\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0438 \u043C\u0438\u0440\u0430',
    subtitle: '\u041E\u0431\u0440\u0430\u0437\u044B, \u0438\u043C\u0435\u043D\u0430 \u0438 \u043B\u043E\u044F\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435\u0439'
  };

  var ROOT_ID = 'akatsuki-npc-gallery';
  var STYLE_ID = ROOT_ID + '-style';
  var CACHE_KEY = 'akatsuki-npc-gallery-v17-topic-' + CONFIG.sourceTopicId;
  var imagePool = {};

  function isTargetPage() {
    return !!document.querySelector('#forum_f' + CONFIG.targetForumId + ', a[href*="viewforum.php?id=' + CONFIG.targetForumId + '"]');
  }

  function absoluteUrl(value) {
    try { return new URL(value, CONFIG.baseUrl).href; } catch (error) { return value || ''; }
  }

  function cleanText(value) {
    return String(value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function russianName(value) {
    return cleanText(value).split(/\s*(?:\u2551|\|\||\|)\s*/)[0] || cleanText(value);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function readField(post, fieldName) {
    var labels = post.querySelectorAll('strong');
    for (var i = 0; i < labels.length; i += 1) {
      var label = cleanText(labels[i].textContent).replace(/:$/, '').toLowerCase();
      if (label !== fieldName.toLowerCase()) continue;
      var labelWrap = labels[i].closest('span');
      var value = labelWrap && labelWrap.nextElementSibling;
      if (value) return cleanText(value.textContent);
      var parent = labels[i].parentElement;
      if (parent) {
        var text = cleanText(parent.textContent);
        return cleanText(text.replace(new RegExp('^' + fieldName + '\\s*:', 'i'), ''));
      }
    }
    return '';
  }

  function chooseBanner(post) {
    var images = post.querySelectorAll('.post-content img.postimg');
    for (var i = 0; i < images.length; i += 1) {
      // Only the introductory banner, never a portrait inside the dossier.
      if (images[i].closest('.spoiler-box, .quote-box, blockquote, table')) continue;
      var src = images[i].getAttribute('src');
      if (src) return absoluteUrl(src);
    }
    return '';
  }

  function parseCards(documentNode) {
    var cards = [];
    var posts = documentNode.querySelectorAll('.post[id^="p"]');
    Array.prototype.forEach.call(posts, function (post) {
      var content = post.querySelector('.post-content');
      if (!content) return;
      var image = chooseBanner(post);
      var name = readField(content, '\u0418\u043C\u044F');
      var loyalty = readField(content, '\u041B\u043E\u044F\u043B\u044C\u043D\u043E\u0441\u0442\u044C');
      var spoilerTitle = content.querySelector('.spoiler-box > div:first-child');
      if (!name && spoilerTitle) name = cleanText(spoilerTitle.textContent);
      name = russianName(name);
      if (!image || !name) return;
      var permalink = post.querySelector('a.permalink');
      var postId = String(post.id || '').replace(/^p/, '');
      cards.push({
        id: postId,
        name: name,
        loyalty: loyalty || '\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430',
        image: image,
        url: absoluteUrl(permalink ? permalink.getAttribute('href') : '/viewtopic.php?id=' + CONFIG.sourceTopicId + '#p' + postId)
      });
    });
    return cards;
  }

  function pageUrls(documentNode) {
    var urls = {};
    var links = documentNode.querySelectorAll('a[href*="viewtopic.php?id=' + CONFIG.sourceTopicId + '"]');
    Array.prototype.forEach.call(links, function (link) {
      var href = absoluteUrl(link.getAttribute('href'));
      if (/[?&]p=\d+/i.test(href)) urls[href.split('#')[0]] = true;
    });
    return Object.keys(urls);
  }

  function uniqueCards(cards) {
    var seen = {};
    return cards.filter(function (card) {
      if (seen[card.id]) return false;
      seen[card.id] = true;
      return true;
    });
  }

  function cardsMarker(cards) {
    return cards.reduce(function (max, card) {
      var id = parseInt(card.id, 10) || 0;
      return id > max ? id : max;
    }, 0);
  }

  function readSessionCache() {
    try {
      var cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
      if (!cached || !Array.isArray(cached.cards) || !cached.cards.length) return null;
      cached.marker = parseInt(cached.marker, 10) || cardsMarker(cached.cards);
      return cached;
    } catch (error) {
      return null;
    }
  }

  function writeSessionCache(cards) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        marker: cardsMarker(cards),
        cards: cards,
        savedAt: Date.now()
      }));
    } catch (error) {
      // The gallery still works when sessionStorage is disabled or full.
    }
  }

  function warmImages(cards) {
    cards.forEach(function (card) {
      if (!card.image || imagePool[card.image]) return;
      var image = new Image();
      image.decoding = 'async';
      image.src = card.image;
      imagePool[card.image] = image;
    });
  }

  function fetchDocument(url) {
    return fetch(url, { credentials: 'same-origin', cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        var charset = /charset\s*=\s*([\w-]+)/i.exec(response.headers.get('content-type') || '');
        return response.arrayBuffer().then(function (buffer) {
          return new TextDecoder(charset ? charset[1] : 'windows-1251').decode(buffer);
        });
      })
      .then(function (html) { return new DOMParser().parseFromString(html, 'text/html'); });
  }

  function loadCards() {
    var firstUrl = CONFIG.baseUrl + '/viewtopic.php?id=' + CONFIG.sourceTopicId;
    return fetchDocument(firstUrl).then(function (firstDocument) {
      var cards = parseCards(firstDocument);
      var urls = pageUrls(firstDocument).filter(function (url) { return url !== firstUrl; });
      if (!urls.length) return cards;
      return Promise.all(urls.map(fetchDocument)).then(function (documents) {
        documents.forEach(function (documentNode) { cards = cards.concat(parseCards(documentNode)); });
        return uniqueCards(cards);
      });
    }).then(uniqueCards);
  }

  function latestPostMarker() {
    var firstUrl = CONFIG.baseUrl + '/viewtopic.php?id=' + CONFIG.sourceTopicId;
    return fetchDocument(firstUrl).then(function (firstDocument) {
      var documents = [firstDocument];
      var urls = pageUrls(firstDocument);
      var lastUrl = urls.sort(function (left, right) {
        var leftPage = parseInt(new URL(left).searchParams.get('p'), 10) || 1;
        var rightPage = parseInt(new URL(right).searchParams.get('p'), 10) || 1;
        return leftPage - rightPage;
      }).pop();
      if (!lastUrl || lastUrl === firstUrl) return cardsMarker(parseCards(firstDocument));
      return fetchDocument(lastUrl).then(function (lastDocument) {
        documents.push(lastDocument);
        var edgeCards = [];
        documents.forEach(function (documentNode) { edgeCards = edgeCards.concat(parseCards(documentNode)); });
        return cardsMarker(edgeCards);
      });
    });
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    var scope = '#pun #' + ROOT_ID;
    style.textContent = [
      '#pun .ng-description-host { height:auto!important; min-height:0!important; min-width:0!important; flex-flow:column nowrap!important; justify-content:flex-start!important; align-items:stretch!important; gap:6px!important; }',
      '#pun .ng-description-host .forum-card__main, #pun .ng-description-host .tcl, #pun .ng-description-host .intd, #pun .ng-description-host .tclcon { box-sizing:border-box!important; flex:none!important; width:100%!important; max-width:100%!important; min-width:0!important; }',
      '#pun .ng-description-host .tclcon { gap:8px!important; }',
      '#pun .ng-description-host .tclcon > br { display:none!important; }',
      '#pun .ng-description-host .lintop { height:auto!important; min-height:30px; margin:0!important; }',
      '#pun .ng-description-host .forum-card__last-post { margin-top:0!important; }',
      scope + ' { --ng-accent:var(--color-link,#863030); --ng-ink:var(--color-txt1,#282627); display:block!important; width:100%!important; max-width:100%!important; min-width:0!important; contain:inline-size; margin:14px 0!important; padding:8px 0!important; color:var(--ng-ink); font:12px/1.3 Arial,sans-serif; clear:both; }',
      scope + ', ' + scope + ' * { box-sizing:border-box!important; }',
      scope + ' h5 { display:block!important; margin:0 0 8px!important; padding:0!important; font:400 10px/1.4 Arial,sans-serif!important; text-align:center!important; letter-spacing:.18em; color:var(--ng-accent); }',
      scope + ' .slider-container { display:flex!important; align-items:center!important; gap:8px!important; width:100%!important; min-width:0!important; overflow:hidden!important; }',
      scope + ' .ng-viewport { display:block!important; flex:1 1 0!important; width:0!important; min-width:0!important; overflow-x:auto!important; overflow-y:hidden!important; scrollbar-width:none!important; -ms-overflow-style:none!important; scroll-snap-type:x proximity; }',
      scope + ' .ng-viewport::-webkit-scrollbar { display:none!important; width:0!important; height:0!important; }',
      scope + ' .ng-track { display:flex!important; align-items:stretch!important; width:max-content!important; min-width:0!important; max-width:none!important; gap:12px!important; margin:0 auto!important; padding:0 0 6px!important; transform:none!important; }',
      scope + ' a.ng-card { display:flex!important; flex-direction:column!important; flex:0 0 220px!important; width:220px!important; min-width:220px!important; max-width:220px!important; gap:0!important; margin:0!important; padding:0 6px!important; border:0!important; background:transparent!important; color:var(--ng-ink)!important; text-decoration:none!important; scroll-snap-align:start; text-align:center!important; box-shadow:none!important; }',
      scope + ' .ng-card > span { display:block!important; position:static!important; float:none!important; width:100%!important; margin:0!important; padding:0!important; transform:none!important; text-indent:0!important; background:transparent!important; }',
      scope + ' .ng-card .ng-name { display:flex!important; align-items:center!important; justify-content:center!important; min-height:30px!important; padding:3px!important; color:var(--ng-accent)!important; font:700 12px/1.25 Arial,sans-serif!important; white-space:normal!important; overflow-wrap:anywhere; }',
      scope + ' .ng-card .ng-photo { height:52px!important; min-height:52px!important; max-height:52px!important; flex:0 0 52px!important; overflow:hidden!important; border-radius:6px!important; }',
      scope + ' .ng-card .ng-photo img { display:block!important; position:static!important; width:100%!important; height:100%!important; max-width:100%!important; max-height:100%!important; object-fit:cover!important; object-position:center!important; margin:0!important; padding:0!important; border:0!important; transform:none!important; }',
      scope + ' { margin:2px 0!important; padding:0!important; }',
      scope + ' .ng-card .ng-loyalty { padding:5px 3px!important; color:var(--ng-ink)!important; font:400 11px/1.3 Arial,sans-serif!important; white-space:normal!important; }',
      scope + ' .ng-arrow { display:flex!important; position:static!important; align-items:center!important; justify-content:center!important; flex:0 0 24px!important; width:24px!important; height:24px!important; margin:0!important; padding:0!important; border:1px solid currentColor!important; border-radius:50%!important; background:transparent!important; color:var(--ng-accent)!important; cursor:pointer; }',
      scope + ' .ng-arrow::before { content:""!important; width:6px; height:6px; border:solid currentColor; border-width:0 2px 2px 0; transform:rotate(-45deg); }',
      scope + ' .ng-prev::before { transform:rotate(135deg); }',
      scope + ' .ng-arrow:disabled { opacity:.3; cursor:default; }',
      scope + '.ng-fits .ng-arrow { display:none!important; }',
      scope + '.ng-fits .ng-viewport { overflow-x:hidden!important; }',
      scope + ' .ng-status, ' + scope + ' .ng-empty { margin:0!important; padding:12px!important; white-space:normal; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function cardHtml(card) {
    var name = russianName(card.name);
    var loyalty = cleanText(card.loyalty).replace(/^.*?:\s*/, '');
    return '<a class="ng-card" href="' + escapeHtml(card.url) + '" title="\u041E\u0442\u043A\u0440\u044B\u0442\u044C">' +
      '<span class="ng-name">' + escapeHtml(name) + '</span>' +
      '<span class="ng-photo"><img loading="lazy" src="' + escapeHtml(card.image) + '" alt="' + escapeHtml(name) + '"></span>' +
      '<span class="ng-loyalty">' + escapeHtml(loyalty) + '</span></a>';
  }

  function renderCards(root, cards) {
    var track = root.querySelector('.ng-track');
    track.innerHTML = cards.length ? cards.map(cardHtml).join('') : '<p class="ng-empty">\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B.</p>';
    var viewport = root.querySelector('.ng-viewport');
    var previous = root.querySelector('.ng-prev');
    var next = root.querySelector('.ng-next');
    var container = root.querySelector('.slider-container');
    function updateControls() {
      root.classList.toggle('ng-fits', track.scrollWidth <= container.clientWidth);
      previous.disabled = viewport.scrollLeft <= 1;
      next.disabled = viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 1;
    }
    root._ngUpdateControls = updateControls;
    if (!root.dataset.ngControlsReady) {
      root.dataset.ngControlsReady = '1';
      previous.addEventListener('click', function () { viewport.scrollBy({ left: -284, behavior: 'smooth' }); });
      next.addEventListener('click', function () { viewport.scrollBy({ left: 284, behavior: 'smooth' }); });
      viewport.addEventListener('scroll', updateControls, { passive: true });
      if (window.ResizeObserver) {
        var observer = new ResizeObserver(function () {
          if (root._ngUpdateControls) root._ngUpdateControls();
        });
        observer.observe(container);
        observer.observe(track);
      } else window.addEventListener('resize', function () {
        if (root._ngUpdateControls) root._ngUpdateControls();
      });
    }
    updateControls();
  }

  function weightedOrder(cards, random) {
    random = random || Math.random;
    // Post IDs grow with publication order; this also supports older session caches.
    var ranked = cards.slice().sort(function (a, b) { return Number(a.id) - Number(b.id); });
    return ranked.map(function (card, index) {
      var weight = 1 + 3 * index / Math.max(1, ranked.length - 1);
      return { card: card, score: -Math.log(Math.max(Number.MIN_VALUE, random())) / weight };
    }).sort(function (a, b) { return a.score - b.score; }).map(function (item) { return item.card; });
  }

  function startRotation(root) {
    var cards = [];
    var lastShuffle = 0;
    var lastInteraction = 0;
    function busy() {
      return document.hidden || root.matches(':hover') || root.contains(document.activeElement) || Date.now() - lastInteraction < 15000;
    }
    function shuffle() {
      if (!cards.length) return;
      renderCards(root, weightedOrder(cards));
      root.querySelector('.ng-viewport').scrollLeft = 0;
      root._ngUpdateControls();
      lastShuffle = Date.now();
    }
    ['pointerdown', 'touchstart', 'keydown', 'wheel'].forEach(function (type) {
      root.addEventListener(type, function () { lastInteraction = Date.now(); }, { passive: true });
    });
    var timer = setInterval(function () {
      if (!root.isConnected) { clearInterval(timer); return; }
      if (Date.now() - lastShuffle >= CONFIG.shuffleIntervalMs && !busy()) shuffle();
    }, 5000);
    return function (newCards) {
      var first = !cards.length;
      cards = newCards;
      if (first || !busy()) shuffle();
      else lastShuffle = 0;
    };
  }

  function mount() {
    if (!isTargetPage() || document.getElementById(ROOT_ID)) return;
    injectStyle();
    var row = document.querySelector('#forum_f' + CONFIG.targetForumId);
    var anchor = document.querySelector('a[href*="viewforum.php?id=' + CONFIG.targetForumId + '"]');
    var description = row ? row.querySelector('.tclcon') : (anchor && anchor.closest('.tclcon'));
    if (!description) return;
    var host = description.closest('.forum-card') || row;
    if (host) host.classList.add('ng-description-host');
    var root = document.createElement('section');
    root.id = ROOT_ID;
    root.className = 'ng-gallery';
    root.innerHTML = '<h5>\u0438\u0445 \u0436\u0434\u0443\u0442</h5><div class="slider-container"><button class="ng-arrow ng-prev" type="button" aria-label="\u041D\u0430\u0437\u0430\u0434"></button><div class="ng-viewport slider-track-wrapper"><div class="ng-track slider-track"><p class="ng-status">\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043C \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435\u0439\u2026</p></div></div><button class="ng-arrow ng-next" type="button" aria-label="\u0412\u043F\u0435\u0440\u0451\u0434"></button></div>';
    description.insertBefore(root, description.querySelector('.modlist'));
    var setCards = startRotation(root);

    var cached = readSessionCache();
    if (cached) {
      warmImages(cached.cards);
      setCards(cached.cards);
    }

    var refresh = cached ? latestPostMarker().then(function (marker) {
      if (marker <= cached.marker) return null;
      return loadCards();
    }) : loadCards();

    refresh.then(function (cards) {
      if (!cards) return;
      warmImages(cards);
      writeSessionCache(cards);
      setCards(cards);
    }).catch(function () {
      if (cached) return;
      root.querySelector('.ng-track').innerHTML = '<p class="ng-empty">\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435\u0439. <a class="ng-source" href="' + CONFIG.baseUrl + '/viewtopic.php?id=' + CONFIG.sourceTopicId + '">\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A</a></p>';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
