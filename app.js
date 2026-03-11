/* ===================================================
   威權時期加害者識別及處理條例（草案） — app.js
   =================================================== */

(function () {
  'use strict';

  /* ---------- State ---------- */
  let lawData = null;
  let currentHighlightIndex = -1;
  let allMarks = [];

  /* ---------- DOM refs ---------- */
  const lawContent   = document.getElementById('law-content');
  const tocList      = document.getElementById('toc-list');
  const searchInput  = document.getElementById('search-input');
  const searchClear  = document.getElementById('search-clear');
  const searchCount  = document.getElementById('search-count');
  const noResults    = document.getElementById('no-results');
  const noResultsTerm = document.getElementById('no-results-term');
  const btnTop       = document.getElementById('btn-top');
  const btnMenu      = document.getElementById('btn-menu');
  const sidebar      = document.getElementById('sidebar');
  const overlay      = document.getElementById('sidebar-overlay');

  /* ====================================================
     1. FETCH & RENDER
     ==================================================== */
  fetch('data/law.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      lawData = data;
      renderDocument(data);
      buildTOC(data);
      initIntersectionObserver();
    })
    .catch(function (err) {
      lawContent.innerHTML =
        '<p style="color:#c0392b;padding:20px">載入資料失敗：' + err.message + '</p>';
    });

  /* ---- Render full document ---- */
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
        var articleId = 'article-' + article.number;
        html += '<article class="article" id="' + articleId + '">';
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

  /* ---- Build sidebar TOC ---- */
  function buildTOC(data) {
    var html = '';
    data.chapters.forEach(function (chapter) {
      html += '<li>'
        + '<a href="#chapter-' + chapter.number + '" data-chapter="' + chapter.number + '">'
        + '<span class="toc-num">' + chapter.number + '</span>'
        + escapeHTML('第' + toChineseNum(chapter.number) + '章　' + chapter.title)
        + '</a></li>';
    });
    tocList.innerHTML = html;

    /* Smooth scroll + close mobile sidebar */
    tocList.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.querySelector(a.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
        closeSidebar();
      });
    });
  }

  /* ====================================================
     2. INTERSECTION OBSERVER (active sidebar item)
     ==================================================== */
  function initIntersectionObserver() {
    var chapters = document.querySelectorAll('.chapter');
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.id;
            var num = id.replace('chapter-', '');
            setActiveTOC(num);
          }
        });
      },
      { rootMargin: '-60px 0px -50% 0px', threshold: 0 }
    );
    chapters.forEach(function (c) { observer.observe(c); });
  }

  function setActiveTOC(chapterNum) {
    tocList.querySelectorAll('a').forEach(function (a) {
      a.classList.toggle('active', a.dataset.chapter === String(chapterNum));
    });
  }

  /* ====================================================
     3. SEARCH & HIGHLIGHT
     ==================================================== */
  var searchDebounceTimer = null;

  searchInput.addEventListener('input', function () {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(performSearch, 150);
  });

  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      navigateHighlight(1);
    }
    if (e.key === 'Escape') {
      clearSearch();
    }
  });

  searchClear.addEventListener('click', clearSearch);

  function performSearch() {
    var term = searchInput.value.trim();
    searchClear.style.display = term ? 'block' : 'none';

    /* Clear previous marks */
    clearMarks();

    if (!term) {
      searchCount.textContent = '';
      noResults.style.display = 'none';
      showAllChapters();
      return;
    }

    /* Highlight matching text */
    var count = highlightText(term);

    if (count === 0) {
      searchCount.textContent = '0 筆';
      noResults.style.display = 'block';
      noResultsTerm.textContent = term;
    } else {
      searchCount.textContent = count + ' 筆';
      noResults.style.display = 'none';
      /* Scroll to first match */
      currentHighlightIndex = 0;
      scrollToMark(0);
    }
  }

  function highlightText(term) {
    var escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var regex = new RegExp(escaped, 'gi');
    var contents = lawContent.querySelectorAll('.article-content, .article-title-label, #doc-preamble');
    allMarks = [];

    contents.forEach(function (el) {
      walkText(el, regex);
    });

    return allMarks.length;
  }

  function walkText(node, regex) {
    if (node.nodeType === Node.TEXT_NODE) {
      var text = node.textContent;
      if (!regex.test(text)) { regex.lastIndex = 0; return; }
      regex.lastIndex = 0;

      var frag = document.createDocumentFragment();
      var lastIndex = 0;
      var match;

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }
        var mark = document.createElement('mark');
        mark.textContent = match[0];
        frag.appendChild(mark);
        allMarks.push(mark);
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'MARK') {
      Array.from(node.childNodes).forEach(function (child) {
        walkText(child, regex);
      });
    }
  }

  function clearMarks() {
    /* Unwrap all <mark> elements */
    var marks = lawContent.querySelectorAll('mark');
    marks.forEach(function (mark) {
      var text = document.createTextNode(mark.textContent);
      mark.parentNode.replaceChild(text, mark);
    });
    /* Normalize merged text nodes */
    lawContent.querySelectorAll('.article-content, .article-title-label, #doc-preamble').forEach(function (el) {
      el.normalize();
    });
    allMarks = [];
    currentHighlightIndex = -1;
  }

  function navigateHighlight(direction) {
    if (allMarks.length === 0) return;
    if (currentHighlightIndex >= 0) {
      allMarks[currentHighlightIndex].classList.remove('current');
    }
    currentHighlightIndex = (currentHighlightIndex + direction + allMarks.length) % allMarks.length;
    scrollToMark(currentHighlightIndex);
  }

  function scrollToMark(index) {
    if (allMarks[index]) {
      allMarks[index].classList.add('current');
      allMarks[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function clearSearch() {
    searchInput.value = '';
    searchClear.style.display = 'none';
    searchCount.textContent = '';
    noResults.style.display = 'none';
    clearMarks();
    showAllChapters();
    searchInput.focus();
  }

  function showAllChapters() {
    document.querySelectorAll('.chapter').forEach(function (c) {
      c.style.display = '';
    });
  }

  /* ====================================================
     4. SCROLL TO TOP
     ==================================================== */
  window.addEventListener('scroll', function () {
    btnTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btnTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ====================================================
     5. MOBILE SIDEBAR TOGGLE
     ==================================================== */
  btnMenu.addEventListener('click', function () {
    var isOpen = sidebar.classList.toggle('open');
    overlay.classList.toggle('show', isOpen);
    btnMenu.setAttribute('aria-expanded', String(isOpen));
  });

  overlay.addEventListener('click', closeSidebar);

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
    btnMenu.setAttribute('aria-expanded', 'false');
  }

  /* ====================================================
     6. UTILITIES
     ==================================================== */
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Covers the 28 articles in this draft; extend if future amendments add articles */
  var CHINESE_NUMS = [
    '', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八'
  ];

  function toChineseNum(n) {
    return CHINESE_NUMS[n] || String(n);
  }

}());
