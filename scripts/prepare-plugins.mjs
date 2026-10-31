// Performance adaptations are build steps, separate from plugin business code.
// Reimporting a newer plugin must not restore GitHub CSS or gallery prefetching.
export function preparePlugin(id, original) {
  let source = original.replace(/^\uFEFF/, '').replace(/\r/g, '')
  // Native file editor decodes numeric HTML entities in textarea readback.
  // Equivalent JS escape preserves the runtime entity through future edits.
  source = source.replace(/&#(?=\d|x[0-9a-f])/gi, '\\x26#')
  if (id === 'shop') {
    return source.replace(/@import\s+url\(['"]https:\/\/lamiiiia\.github\.io\/zachtomnevseeto\/forum\.css[^'"]*['"]\);/gi, '')
  }
  if (id === 'technique-search' || id === 'battle-assistant') {
    source = source.replaceAll('if (actionRow && actionRow.parentNode)', 'if (actionRow && actionRow !== form && form.contains(actionRow) && actionRow.parentNode)')
    return `(function(){if([1,2,5].indexOf(Number(window.GroupID||(window.FORUM&&window.FORUM.group_id)))===-1)return;\n${source}\n})();`
  }
  if (id !== 'npc-gallery' || (source.includes('data-ng-src') && !source.includes('function warmImages('))) return source
  const start = source.indexOf('  function warmImages('), end = source.indexOf('  function fetchDocument(', start)
  if (start < 0 || end < 0 || !source.includes('<img loading="lazy" src="')) throw new Error('Gallery structure changed; review the lazy-image adapter before publication')
  source = source.slice(0, start) + source.slice(end)
  source = source.replace('  var imagePool = {};\n', '').replace(/\s*warmImages\((?:cached\.cards|cards)\);/g, '')
  source = source.replace('<img loading="lazy" src="', '<img loading="lazy" decoding="async" fetchpriority="low" data-ng-src="')
  const viewport = "    var viewport = root.querySelector('.ng-viewport');"
  if (!source.includes(viewport)) throw new Error('Gallery viewport changed')
  source = source.replace(viewport, viewport + `
    if (root._ngImages) root._ngImages.disconnect();
    var images = track.querySelectorAll('img[data-ng-src]');
    function revealImage(image) {
      image.src = image.getAttribute('data-ng-src');
      image.removeAttribute('data-ng-src');
    }
    if (window.IntersectionObserver) {
      root._ngImages = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          revealImage(entry.target);
          root._ngImages.unobserve(entry.target);
        });
      }, { root: viewport, rootMargin: '0px 140px', threshold: 0 });
      images.forEach(function (image) { root._ngImages.observe(image); });
    } else images.forEach(revealImage);
`)
  const begin = source.indexOf('    var setCards = startRotation(root);')
  const finish = source.indexOf("\n  }\n\n  if (document.readyState", begin)
  if (begin < 0 || finish < 0) throw new Error('Gallery initialization changed')
  const body = source.slice(begin, finish)
  return source.slice(0, begin) + `    function begin() {
      if (root.dataset.ngStarted) return;
      root.dataset.ngStarted = '1';
${body}
    }
    if (window.IntersectionObserver) {
      var visible = new IntersectionObserver(function (entries) {
        if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
        visible.disconnect(); begin();
      }, { rootMargin: '200px 0px' });
      visible.observe(root);
    } else begin();` + source.slice(finish)
}
