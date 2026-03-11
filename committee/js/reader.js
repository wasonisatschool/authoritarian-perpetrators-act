/* ===================================================
   委員會主管法規閱讀器 — reader.js
   =================================================== */
(function () {
  'use strict';

  var lawContent   = document.getElementById('law-content');
  var tocList      = document.getElementById('toc-list');
  var searchInput  = document.getElementById('search-input');
  var searchClear  = document.getElementById('search-clear');
  var searchCount  = document.getElementById('search-count');
  var noResults    = document.getElementById('no-results');
  var noResultsTerm = document.getElementById('no-results-term');
  var readerSidebar = document.getElementById('reader-sidebar');
  var readerOverlay = document.getElementById('reader-overlay');
  var readerMenuBtn = document.getElementById('reader-menu-btn');

  var currentHighlightIndex = -1;
  var allMarks = [];
  var lawData = null;

  var dataFile = window._lawDataFile;
  if (!dataFile) return;

  fetch(dataFile)
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      lawData = data;
      renderDocument(data);
      buildTOC(data);
      initObserver();
    })
    .catch(function (err) {
      lawContent.innerHTML = '<p style="color:#c0392b;padding:20px">載入資料失敗：' + escapeHTML(err.message) + '</p>';
    });

  function renderDocument(data) {
    var html = '<div id="doc-header">'
      + '<h1>' + escapeHTML(data.title) + '</h1>'
      + '<p id="doc-preamble">立法目的：' + escapeHTML(data.preamble) + '</p>'
      + '</div>';

    data.chapters.forEach(function (chapter) {
      var chapterId = 'chapter-' + chapter.number;
      html += '<section class="chapter" id="' + chapterId + '">';
      html += '<div class="chapter-header">'
        + '<span class="chapter-number">第' + toChineseNum(chapter.number) + '章</span>'
        + '<span class="chapter-title">' + escapeHTML(chapter.title) + '</span>'
        + '</div>';
      chapter.articles.forEach(function (article) {
        html += '<article class="article" id="article-' + article.number + '">';
        html += '<div class="article-header">'
          + '<span class="article-number">第' + toChineseNum(article.number) + '條</span>'
          + '<span class="article-title-label">（' + escapeHTML(article.title) + '）</span>'
          + '</div>';
        html += '<div class="article-content">' + escapeHTML(article.content) + '</div>';
        html += '</article>';
      });
      html += '</section>';
    });

    lawContent.innerHTML = html;
  }

  function buildTOC(data) {
    var html = '';
    data.chapters.forEach(function (chapter) {
      html += '<li><a href="#chapter-' + chapter.number + '" data-chapter="' + chapter.number + '">'
        + '第' + toChineseNum(chapter.number) + '章　' + escapeHTML(chapter.title)
        + '</a></li>';
    });
    tocList.innerHTML = html;
    tocList.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
        closeSidebar();
      });
    });
  }

  function initObserver() {
    var chapters = document.querySelectorAll('.chapter');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var num = entry.target.id.replace('chapter-', '');
          tocList.querySelectorAll('a').forEach(function (a) {
            a.classList.toggle('active', a.dataset.chapter === String(num));
          });
        }
      });
    }, { rootMargin: '-60px 0px -50% 0px', threshold: 0 });
    chapters.forEach(function (c) { observer.observe(c); });
  }

  /* Search */
  var debounceTimer = null;
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(doSearch, 150);
    });
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); navigateHighlight(1); }
      if (e.key === 'Escape') { clearSearch(); }
    });
  }
  if (searchClear) searchClear.addEventListener('click', clearSearch);

  function doSearch() {
    var term = searchInput ? searchInput.value.trim() : '';
    if (searchClear) searchClear.style.display = term ? 'block' : 'none';
    clearMarks();
    if (!term) {
      if (searchCount) searchCount.textContent = '';
      if (noResults) noResults.style.display = 'none';
      return;
    }
    var count = highlightText(term);
    if (count === 0) {
      if (searchCount) searchCount.textContent = '0 筆';
      if (noResults) { noResults.style.display = 'block'; if (noResultsTerm) noResultsTerm.textContent = term; }
    } else {
      if (searchCount) searchCount.textContent = count + ' 筆';
      if (noResults) noResults.style.display = 'none';
      currentHighlightIndex = 0;
      scrollToMark(0);
    }
  }

  function highlightText(term) {
    var regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    var els = lawContent.querySelectorAll('.article-content, .article-title-label, #doc-preamble');
    allMarks = [];
    els.forEach(function (el) { walkText(el, regex); });
    return allMarks.length;
  }

  function walkText(node, regex) {
    if (node.nodeType === Node.TEXT_NODE) {
      var text = node.textContent;
      if (!regex.test(text)) { regex.lastIndex = 0; return; }
      regex.lastIndex = 0;
      var frag = document.createDocumentFragment();
      var last = 0, match;
      while ((match = regex.exec(text)) !== null) {
        if (match.index > last) frag.appendChild(document.createTextNode(text.slice(last, match.index)));
        var mk = document.createElement('mark');
        mk.textContent = match[0];
        frag.appendChild(mk);
        allMarks.push(mk);
        last = regex.lastIndex;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'MARK') {
      Array.from(node.childNodes).forEach(function (c) { walkText(c, regex); });
    }
  }

  function clearMarks() {
    lawContent.querySelectorAll('mark').forEach(function (m) {
      m.parentNode.replaceChild(document.createTextNode(m.textContent), m);
    });
    lawContent.querySelectorAll('.article-content, .article-title-label, #doc-preamble').forEach(function (el) { el.normalize(); });
    allMarks = [];
    currentHighlightIndex = -1;
  }

  function navigateHighlight(dir) {
    if (!allMarks.length) return;
    if (currentHighlightIndex >= 0) allMarks[currentHighlightIndex].classList.remove('current');
    currentHighlightIndex = (currentHighlightIndex + dir + allMarks.length) % allMarks.length;
    scrollToMark(currentHighlightIndex);
  }

  function scrollToMark(i) {
    if (allMarks[i]) {
      allMarks[i].classList.add('current');
      allMarks[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function clearSearch() {
    if (searchInput) searchInput.value = '';
    if (searchClear) searchClear.style.display = 'none';
    if (searchCount) searchCount.textContent = '';
    if (noResults) noResults.style.display = 'none';
    clearMarks();
    if (searchInput) searchInput.focus();
  }

  /* Mobile sidebar */
  if (readerMenuBtn) {
    readerMenuBtn.addEventListener('click', function () {
      var isOpen = readerSidebar.classList.toggle('open');
      if (readerOverlay) readerOverlay.classList.toggle('show', isOpen);
      readerMenuBtn.setAttribute('aria-expanded', String(isOpen));
    });
  }

  if (readerOverlay) {
    readerOverlay.addEventListener('click', closeSidebar);
  }

  function closeSidebar() {
    if (readerSidebar) readerSidebar.classList.remove('open');
    if (readerOverlay) readerOverlay.classList.remove('show');
    if (readerMenuBtn) readerMenuBtn.setAttribute('aria-expanded', 'false');
  }

  /* Utilities */
  function escapeHTML(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var CHINESE_NUMERALS = ['','一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','二十一','二十二','二十三','二十四','二十五','二十六','二十七','二十八','二十九','三十','三十一','三十二','三十三','三十四','三十五','三十六','三十七','三十八','三十九','四十','四十一','四十二'];
  function toChineseNum(n) { return CHINESE_NUMERALS[n] || String(n); }

}());
