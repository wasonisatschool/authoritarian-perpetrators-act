/* ===================================================
   修正草案閱覽介面 — amendment.js
   =================================================== */

(function () {
  'use strict';

  /* ---------- State ---------- */
  var amendmentData = null;

  /* ---------- DOM refs ---------- */
  var lawContent  = document.getElementById('law-content');
  var tocList     = document.getElementById('toc-list');
  var btnTop      = document.getElementById('btn-top');
  var btnMenu     = document.getElementById('btn-menu');
  var sidebar     = document.getElementById('sidebar');
  var overlay     = document.getElementById('sidebar-overlay');
  var noResults   = document.getElementById('no-results');

  /* ---------- Hide unused search elements ---------- */
  var searchWrapper = document.getElementById('search-wrapper');
  var searchCount   = document.getElementById('search-count');
  if (searchWrapper) searchWrapper.style.display = 'none';
  if (searchCount)   searchCount.style.display   = 'none';

  /* ====================================================
     1. FETCH & RENDER
     ==================================================== */
  var dataFile = document.documentElement.dataset.amendmentFile;

  fetch(dataFile)
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      amendmentData = data;
      renderDocument(data);
      buildTOC(data);
      initIntersectionObserver();
    })
    .catch(function (err) {
      lawContent.innerHTML =
        '<p style="color:#c0392b;padding:20px">載入資料失敗：' + escapeHTML(err.message) + '</p>';
    });

  /* ---- Render full document ---- */
  function renderDocument(data) {
    var backLink = document.documentElement.dataset.backLink || '../index.html';
    var backLabel = document.documentElement.dataset.backLabel || '返回主頁';

    var actionMap = {
      '修正': { cls: 'amend',  label: '修正' },
      '增訂': { cls: 'add',    label: '新增' },
      '刪除': { cls: 'delete', label: '刪除' }
    };

    var html = '';

    /* Back nav */
    html += '<div class="back-nav">'
      + '<a href="' + escapeAttr(backLink) + '">← ' + escapeHTML(backLabel) + '</a>'
      + '</div>';

    /* Amendment meta header */
    html += '<div class="amendment-meta">'
      + '<span class="law-badge">修正草案</span>'
      + '<h1>' + escapeHTML(data.title) + '</h1>'
      + '<p class="summary-text">' + escapeHTML(data.summary) + '</p>'
      + '<a href="https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=' + escapeAttr(data.targetLawPcode) + '" '
      + 'class="target-link" target="_blank" rel="noopener noreferrer">'
      + '查看《' + escapeHTML(data.targetLaw) + '》現行全文 →</a>'
      + '</div>';

    /* Legend */
    html += '<div class="amendment-legend">'
      + '<strong style="color:var(--text-light);font-size:0.82rem;margin-right:4px;">圖例：</strong>'
      + '<span class="legend-item"><span class="action-badge amend">修正</span>條文修改</span>'
      + '<span class="legend-item"><span class="action-badge add">新增</span>新增條文</span>'
      + '<span class="legend-item"><span class="action-badge delete">刪除</span>刪除條文</span>'
      + '</div>';

    /* Articles */
    data.articles.forEach(function (art) {
      var ai = actionMap[art.action] || { cls: 'amend', label: art.action };
      var sectionId = 'article-' + art.number;

      html += '<section class="amendment-article" id="' + sectionId + '">';

      /* Article header */
      html += '<div class="amendment-article-header">'
        + '<span class="art-num">第 ' + escapeHTML(String(art.number)) + ' 條</span>'
        + '<span class="art-title">（' + escapeHTML(art.title) + '）</span>'
        + '<span class="action-badge ' + ai.cls + '">' + ai.label + '</span>'
        + '</div>';

      /* Comparison table */
      html += '<table class="comparison-table">'
        + '<thead><tr>'
        + '<th class="col-proposed">修正條文</th>'
        + '<th class="col-current">現行條文</th>'
        + '<th class="col-reason">修正說明</th>'
        + '</tr></thead>'
        + '<tbody><tr>'
        + '<td class="col-proposed"><div class="text-content">' + escapeHTML(art.proposed) + '</div></td>'
        + '<td class="col-current"><div class="text-content">' + escapeHTML(art.current) + '</div></td>'
        + '<td class="col-reason"><div class="text-content">' + escapeHTML(art.reason) + '</div></td>'
        + '</tr></tbody>'
        + '</table>';

      html += '</section>';
    });

    lawContent.innerHTML = html;
    if (noResults) noResults.style.display = 'none';
  }

  /* ---- Build sidebar TOC ---- */
  function buildTOC(data) {
    var actionMap = {
      '修正': 'amend',
      '增訂': 'add',
      '刪除': 'delete'
    };

    var html = '';
    data.articles.forEach(function (art) {
      var cls = actionMap[art.action] || 'amend';
      html += '<li>'
        + '<a href="#article-' + art.number + '" data-art="' + art.number + '">'
        + '<span class="toc-num">' + art.number + '</span>'
        + '第 ' + escapeHTML(String(art.number)) + ' 條'
        + '<span class="toc-action ' + cls + '">' + escapeHTML(art.action) + '</span>'
        + '</a></li>';
    });
    tocList.innerHTML = html;

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
    var articles = document.querySelectorAll('.amendment-article');
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var num = entry.target.id.replace('article-', '');
            setActiveTOC(num);
          }
        });
      },
      { rootMargin: '-60px 0px -50% 0px', threshold: 0 }
    );
    articles.forEach(function (a) { observer.observe(a); });
  }

  function setActiveTOC(artNum) {
    tocList.querySelectorAll('a').forEach(function (a) {
      a.classList.toggle('active', a.dataset.art === String(artNum));
    });
  }

  /* ====================================================
     3. SCROLL TO TOP
     ==================================================== */
  window.addEventListener('scroll', function () {
    btnTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btnTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ====================================================
     4. MOBILE SIDEBAR TOGGLE
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
     5. UTILITIES
     ==================================================== */
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;');
  }

}());
