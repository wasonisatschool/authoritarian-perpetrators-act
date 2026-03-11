/* ===================================================
   委員會主管法規修正草案閱讀器 — amendment-reader.js
   =================================================== */
(function () {
  'use strict';

  var lawContent = document.getElementById('law-content');
  var tocList    = document.getElementById('toc-list');
  var readerSidebar = document.getElementById('reader-sidebar');
  var readerOverlay = document.getElementById('reader-overlay');
  var readerMenuBtn = document.getElementById('reader-menu-btn');

  var dataFile  = window._amendmentDataFile;
  var backLink  = window._amendmentBackLink || 'legal.html';
  var backLabel = window._amendmentBackLabel || '法規文件';

  if (!dataFile) return;

  fetch(dataFile)
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      renderDocument(data, backLink, backLabel);
      buildTOC(data);
    })
    .catch(function (err) {
      lawContent.innerHTML = '<p style="color:#c0392b;padding:20px">載入資料失敗：' + escapeHTML(err.message) + '</p>';
    });

  function renderDocument(data, backLink, backLabel) {
    var actionMap = {
      '修正': { cls: 'amend', label: '修正' },
      '增訂': { cls: 'add',   label: '新增' },
      '刪除': { cls: 'delete',label: '刪除' }
    };

    var html = '<div class="amendment-meta">'
      + '<span class="law-badge">修正草案</span>'
      + '<h1>' + escapeHTML(data.title) + '</h1>'
      + '<p class="summary-text">' + escapeHTML(data.summary) + '</p>'
      + '<a href="https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=' + escapeAttr(data.targetLawPcode) + '" class="target-link" target="_blank" rel="noopener noreferrer">查看《' + escapeHTML(data.targetLaw) + '》現行全文 →</a>'
      + '</div>';

    html += '<div class="amendment-legend">'
      + '<strong style="color:var(--text-light);font-size:0.82rem;margin-right:4px;">圖例：</strong>'
      + '<span class="legend-item"><span class="action-badge amend">修正</span>條文修改</span>'
      + '<span class="legend-item"><span class="action-badge add">新增</span>新增條文</span>'
      + '<span class="legend-item"><span class="action-badge delete">刪除</span>刪除條文</span>'
      + '</div>';

    data.articles.forEach(function (art) {
      var ai = actionMap[art.action] || { cls: 'amend', label: art.action };
      html += '<section class="amendment-article" id="article-' + art.number + '">';
      html += '<div class="amendment-article-header">'
        + '<span class="art-num">第 ' + art.number + ' 條</span>'
        + '<span class="art-title">（' + escapeHTML(art.title) + '）</span>'
        + '<span class="action-badge ' + ai.cls + '">' + ai.label + '</span>'
        + '</div>';
      html += '<table class="comparison-table">'
        + '<thead><tr>'
        + '<th class="col-proposed">修正條文</th>'
        + '<th class="col-current">現行條文</th>'
        + '<th class="col-reason">修正說明</th>'
        + '</tr></thead><tbody><tr>'
        + '<td class="col-proposed"><div class="text-content">' + escapeHTML(art.proposed) + '</div></td>'
        + '<td class="col-current"><div class="text-content">' + escapeHTML(art.current) + '</div></td>'
        + '<td class="col-reason"><div class="text-content">' + escapeHTML(art.reason) + '</div></td>'
        + '</tr></tbody></table>';
      html += '</section>';
    });

    lawContent.innerHTML = html;
  }

  function buildTOC(data) {
    var actionMap = { '修正': 'amend', '增訂': 'add', '刪除': 'delete' };
    var html = '';
    data.articles.forEach(function (art) {
      var cls = actionMap[art.action] || 'amend';
      html += '<li><a href="#article-' + art.number + '">'
        + '第 ' + art.number + ' 條'
        + '<span class="toc-action ' + cls + '">' + escapeHTML(art.action) + '</span>'
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

  if (readerMenuBtn) {
    readerMenuBtn.addEventListener('click', function () {
      var isOpen = readerSidebar.classList.toggle('open');
      if (readerOverlay) readerOverlay.classList.toggle('show', isOpen);
      readerMenuBtn.setAttribute('aria-expanded', String(isOpen));
    });
  }

  if (readerOverlay) readerOverlay.addEventListener('click', closeSidebar);

  function closeSidebar() {
    if (readerSidebar) readerSidebar.classList.remove('open');
    if (readerOverlay) readerOverlay.classList.remove('show');
    if (readerMenuBtn) readerMenuBtn.setAttribute('aria-expanded', 'false');
  }

  function escapeHTML(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
}());
