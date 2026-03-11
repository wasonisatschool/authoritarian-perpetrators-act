(function () {
  'use strict';

  /* ===== Mobile Navigation Toggle ===== */
  var navToggle = document.getElementById('nav-toggle');
  var navLinks = document.getElementById('nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
      var expanded = navLinks.classList.contains('open');
      navToggle.setAttribute('aria-expanded', expanded);
    });

    // Close menu when clicking a link
    var links = navLinks.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    }

    // Close menu on outside click
    document.addEventListener('click', function (e) {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ===== Active Navigation Highlight ===== */
  var currentPath = window.location.pathname;
  if (navLinks) {
    var allLinks = navLinks.querySelectorAll('a');
    for (var j = 0; j < allLinks.length; j++) {
      var href = allLinks[j].getAttribute('href');
      if (href && currentPath.indexOf(href) !== -1 && href !== './') {
        allLinks[j].classList.add('active');
      } else if (href === './' && (currentPath.endsWith('/committee/') || currentPath.endsWith('/committee/index.html'))) {
        allLinks[j].classList.add('active');
      }
    }
  }

  /* ===== Dropdown Navigation ===== */
  var dropdowns = document.querySelectorAll('.nav-dropdown');
  for (var d = 0; d < dropdowns.length; d++) {
    (function (dd) {
      var toggle = dd.querySelector('.nav-dropdown-toggle');
      if (toggle) {
        toggle.addEventListener('click', function (e) {
          e.preventDefault();
          // Close other dropdowns
          for (var x = 0; x < dropdowns.length; x++) {
            if (dropdowns[x] !== dd) dropdowns[x].classList.remove('open');
          }
          dd.classList.toggle('open');
        });
      }
    })(dropdowns[d]);
  }

  // Close dropdowns on outside click
  document.addEventListener('click', function (e) {
    var inDropdown = false;
    for (var d2 = 0; d2 < dropdowns.length; d2++) {
      if (dropdowns[d2].contains(e.target)) { inDropdown = true; break; }
    }
    if (!inDropdown) {
      for (var d3 = 0; d3 < dropdowns.length; d3++) dropdowns[d3].classList.remove('open');
    }
  });

  /* ===== Back to Top Button ===== */
  var btnTop = document.getElementById('btn-top');
  if (btnTop) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) {
        btnTop.classList.add('visible');
      } else {
        btnTop.classList.remove('visible');
      }
    });

    btnTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ===== News Loading (for index & news pages) ===== */
  var newsContainer = document.getElementById('news-container');
  var newsDetailContainer = document.getElementById('news-detail');
  var newsFilterContainer = document.querySelector('.news-filter');

  function formatDate(dateStr) {
    var parts = dateStr.split('-');
    return parts[0] + ' 年 ' + parseInt(parts[1], 10) + ' 月 ' + parseInt(parts[2], 10) + ' 日';
  }

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderNewsCards(items, limit) {
    var html = '';
    var count = limit ? Math.min(items.length, limit) : items.length;
    for (var i = 0; i < count; i++) {
      var item = items[i];
      html += '<div class="card">';
      html += '  <div class="card-body">';
      html += '    <div class="card-meta">';
      html += '      <span class="card-tag">' + escapeHTML(item.category) + '</span>';
      html += '      <span>' + escapeHTML(formatDate(item.date)) + '</span>';
      html += '    </div>';
      html += '    <h3>' + escapeHTML(item.title) + '</h3>';
      html += '    <p>' + escapeHTML(item.summary) + '</p>';
      html += '    <a href="news.html?id=' + item.id + '" class="card-link">閱讀全文</a>';
      html += '  </div>';
      html += '</div>';
    }
    return html;
  }

  function renderNewsList(items) {
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      html += '<article class="news-item" data-category="' + escapeHTML(item.category) + '">';
      html += '  <div class="card-meta">';
      html += '    <span class="card-tag">' + escapeHTML(item.category) + '</span>';
      html += '    <span>' + escapeHTML(formatDate(item.date)) + '</span>';
      html += '  </div>';
      html += '  <h3><a href="news.html?id=' + item.id + '">' + escapeHTML(item.title) + '</a></h3>';
      html += '  <p>' + escapeHTML(item.summary) + '</p>';
      html += '</article>';
    }
    return html;
  }

  function renderNewsDetail(item) {
    var html = '';
    html += '<div class="card-meta" style="margin-bottom:20px">';
    html += '  <span class="card-tag">' + escapeHTML(item.category) + '</span>';
    html += '  <span>' + escapeHTML(formatDate(item.date)) + '</span>';
    html += '</div>';
    html += '<h2>' + escapeHTML(item.title) + '</h2>';
    html += '<div class="content" style="margin-top:20px">';
    html += '  <p>' + escapeHTML(item.content) + '</p>';
    html += '</div>';
    html += '<a href="news.html" class="btn btn-sm btn-accent" style="margin-top:24px">← 返回消息列表</a>';
    return html;
  }

  function getUrlParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  if (newsContainer || newsDetailContainer) {
    fetch('data/news.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load news');
        return res.json();
      })
      .then(function (data) {
        var newsId = getUrlParam('id');

        // If viewing a specific news article
        if (newsDetailContainer && newsId) {
          var found = null;
          for (var i = 0; i < data.length; i++) {
            if (String(data[i].id) === newsId) { found = data[i]; break; }
          }
          if (found) {
            newsDetailContainer.innerHTML = renderNewsDetail(found);
            document.title = found.title + ' — 威權時期加害者認定委員會籌備處';
          } else {
            newsDetailContainer.innerHTML = '<p>找不到此則消息。</p><a href="news.html" class="btn btn-sm btn-accent">← 返回消息列表</a>';
          }
          return;
        }

        // News listing page
        if (newsContainer && !newsId) {
          var isHomePage = newsContainer.classList.contains('card-grid');
          if (isHomePage) {
            newsContainer.innerHTML = renderNewsCards(data, 3);
          } else {
            newsContainer.innerHTML = renderNewsList(data);
            // Set up category filters
            if (newsFilterContainer) {
              setupNewsFilters(data);
            }
          }
        }
      })
      .catch(function (err) {
        if (newsContainer) newsContainer.innerHTML = '<p>無法載入最新消息。</p>';
        if (newsDetailContainer) newsDetailContainer.innerHTML = '<p>無法載入消息內容。</p>';
        console.error(err);
      });
  }

  function setupNewsFilters(data) {
    var categories = ['全部'];
    for (var i = 0; i < data.length; i++) {
      if (categories.indexOf(data[i].category) === -1) {
        categories.push(data[i].category);
      }
    }

    var filterHTML = '';
    for (var c = 0; c < categories.length; c++) {
      var activeClass = c === 0 ? ' active' : '';
      filterHTML += '<button class="filter-btn' + activeClass + '" data-filter="' + escapeHTML(categories[c]) + '">' + escapeHTML(categories[c]) + '</button>';
    }
    newsFilterContainer.innerHTML = filterHTML;

    var filterBtns = newsFilterContainer.querySelectorAll('.filter-btn');
    for (var b = 0; b < filterBtns.length; b++) {
      filterBtns[b].addEventListener('click', function () {
        // Update active state
        for (var x = 0; x < filterBtns.length; x++) filterBtns[x].classList.remove('active');
        this.classList.add('active');

        var filter = this.getAttribute('data-filter');
        var items = document.querySelectorAll('.news-item');
        for (var n = 0; n < items.length; n++) {
          if (filter === '全部' || items[n].getAttribute('data-category') === filter) {
            items[n].style.display = '';
          } else {
            items[n].style.display = 'none';
          }
        }
      });
    }
  }

  /* ===== FAQ Accordion ===== */
  var faqContainer = document.getElementById('faq-container');
  if (faqContainer) {
    fetch('data/faq.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load FAQ');
        return res.json();
      })
      .then(function (data) {
        // Group by category
        var categories = {};
        for (var i = 0; i < data.length; i++) {
          var cat = data[i].category;
          if (!categories[cat]) categories[cat] = [];
          categories[cat].push(data[i]);
        }

        var html = '';
        var catKeys = Object.keys(categories);
        for (var c = 0; c < catKeys.length; c++) {
          html += '<h3 class="faq-category-title">' + escapeHTML(catKeys[c]) + '</h3>';
          var items = categories[catKeys[c]];
          for (var j = 0; j < items.length; j++) {
            html += '<div class="faq-item">';
            html += '  <button class="faq-question" aria-expanded="false">';
            html += '    <span>' + escapeHTML(items[j].question) + '</span>';
            html += '    <span class="arrow">▼</span>';
            html += '  </button>';
            html += '  <div class="faq-answer" role="region">';
            html += '    <div class="faq-answer-inner">' + escapeHTML(items[j].answer) + '</div>';
            html += '  </div>';
            html += '</div>';
          }
        }
        faqContainer.innerHTML = html;

        // Accordion behavior
        var questions = faqContainer.querySelectorAll('.faq-question');
        for (var q = 0; q < questions.length; q++) {
          questions[q].addEventListener('click', function () {
            var item = this.parentElement;
            var isOpen = item.classList.contains('open');

            // Close all
            var allItems = faqContainer.querySelectorAll('.faq-item');
            for (var a = 0; a < allItems.length; a++) {
              allItems[a].classList.remove('open');
              allItems[a].querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            }

            // Open clicked if it was closed
            if (!isOpen) {
              item.classList.add('open');
              this.setAttribute('aria-expanded', 'true');
            }
          });
        }
      })
      .catch(function (err) {
        faqContainer.innerHTML = '<p>無法載入常見問答。</p>';
        console.error(err);
      });
  }

  /* ===== Contact Form (demo) ===== */
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var successMsg = document.getElementById('form-success');
      if (successMsg) {
        successMsg.style.display = 'block';
        contactForm.reset();
        setTimeout(function () {
          successMsg.style.display = 'none';
        }, 5000);
      }
    });
  }

  /* ===== Regulations Page ===== */
  var regsContainer = document.getElementById('regulations-container');
  if (regsContainer) {
    fetch('data/regulations.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load regulations');
        return res.json();
      })
      .then(function (data) {
        var statusColors = { '研議中': '#e67e22', '預告中': '#2980b9', '已發布': '#27ae60' };
        var html = '';
        for (var i = 0; i < data.length; i++) {
          var law = data[i];
          html += '<div style="margin-bottom: 48px;">';
          html += '<h2 style="font-size: 1.25rem; margin-bottom: 6px; display: flex; align-items: center; gap: 12px;">';
          html += '<span>📜</span>';
          html += '<a href="' + escapeHTML(law.lawLink) + '" style="color: var(--primary-dark);">' + escapeHTML(law.lawTitle) + '</a>';
          html += '</h2>';
          html += '<p style="color: var(--text-light); font-size: 0.88rem; margin-bottom: 20px; padding-left: 32px;">配套子法共 ' + law.regulations.length + ' 項</p>';
          html += '<div style="display: grid; gap: 16px; padding-left: 0;">';
          for (var j = 0; j < law.regulations.length; j++) {
            var reg = law.regulations[j];
            var color = statusColors[reg.status] || '#8899aa';
            var regId = 'reg-' + i + '-' + j;
            html += '<div style="background: var(--bg-white); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); border-left: 5px solid ' + color + ';">';
            html += '<div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">';
            html += '<h3 style="font-size: 1rem; font-family: \'Noto Sans TC\', sans-serif; color: var(--text);">' + escapeHTML(reg.title) + '</h3>';
            html += '<span style="font-size: 0.78rem; padding: 3px 10px; border-radius: 12px; background: ' + color + '20; color: ' + color + '; border: 1px solid ' + color + '40; white-space: nowrap;">' + escapeHTML(reg.status) + '</span>';
            html += '</div>';
            html += '<p style="color: var(--text-light); font-size: 0.9rem; line-height: 1.8; margin-bottom: 10px;">' + escapeHTML(reg.summary) + '</p>';
            html += '<div style="display: flex; gap: 20px; flex-wrap: wrap; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 12px;">';
            html += '<span>📌 法律依據：' + escapeHTML(reg.basis) + '</span>';
            html += '<span>🏛 發布機關：' + escapeHTML(reg.issuer) + '</span>';
            html += '</div>';
            if (reg.articles && reg.articles.length > 0) {
              html += '<button class="reg-toggle-btn" data-target="' + regId + '" data-count="' + reg.articles.length + '" style="font-size:0.82rem; padding:4px 12px; border-radius:12px; border:1px solid var(--primary); background:transparent; color:var(--primary); cursor:pointer; transition: all 0.2s;">📄 查看條文（共 ' + reg.articles.length + ' 條）</button>';
              html += '<div id="' + regId + '" class="reg-articles" style="display:none; margin-top:16px; border-top:1px solid var(--border-light); padding-top:16px;">';
              for (var k = 0; k < reg.articles.length; k++) {
                var art = reg.articles[k];
                html += '<div style="padding:12px 0; border-bottom:1px solid var(--border-light);">';
                html += '<div style="font-size:0.85rem; font-weight:700; color:var(--primary); margin-bottom:6px;">第' + art.number + '條　' + escapeHTML(art.title) + '</div>';
                html += '<div style="font-size:0.88rem; line-height:1.9; color:var(--text); white-space:pre-wrap;">' + escapeHTML(art.content) + '</div>';
                html += '</div>';
              }
              html += '</div>';
            }
            html += '</div>';
          }
          html += '</div></div>';
        }
        regsContainer.innerHTML = html;

        regsContainer.querySelectorAll('.reg-toggle-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var target = document.getElementById(btn.dataset.target);
            if (!target) return;
            var isOpen = target.style.display !== 'none';
            target.style.display = isOpen ? 'none' : 'block';
            btn.textContent = isOpen
              ? '📄 查看條文（共 ' + btn.dataset.count + ' 條）'
              : '▲ 收起條文';
            btn.style.background = isOpen ? 'transparent' : 'var(--primary-pale)';
          });
        });
      })
      .catch(function (err) {
        regsContainer.innerHTML = '<p>無法載入配套子法資料。</p>';
        console.error(err);
      });
  }

  /* ===== Standards Page ===== */
  var standardsContainer = document.getElementById('standards-container');
  if (standardsContainer) {
    fetch('data/standards.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load standards');
        return res.json();
      })
      .then(function (data) {
        var html = '';
        for (var i = 0; i < data.length; i++) {
          var cat = data[i];
          html += '<div style="margin-bottom: 48px;">';
          html += '<h2 style="font-size: 1.2rem; margin-bottom: 20px; padding-bottom: 8px; border-bottom: 2px solid var(--primary-pale); color: var(--primary);">' + escapeHTML(cat.category) + '</h2>';
          for (var j = 0; j < cat.items.length; j++) {
            var std = cat.items[j];
            html += '<div style="background: var(--bg-white); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); margin-bottom: 16px;">';
            html += '<div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">';
            html += '<h3 style="font-size: 1rem; font-family: \'Noto Sans TC\', sans-serif; color: var(--text);">' + escapeHTML(std.title) + '</h3>';
            html += '<span style="font-size: 0.78rem; padding: 3px 10px; border-radius: 12px; background: #e8f4fd; color: #2980b9; border: 1px solid #bee3f8; white-space: nowrap;">⏱ ' + escapeHTML(std.timing) + '</span>';
            html += '</div>';
            html += '<p style="color: var(--text-light); font-size: 0.9rem; line-height: 1.8; margin-bottom: 12px;">' + escapeHTML(std.description) + '</p>';
            html += '<p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 8px;">📌 法律依據：' + escapeHTML(std.basis) + '</p>';
            html += '<div style="margin-top: 12px;">';
            html += '<p style="font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; color: var(--text);">重點規範項目：</p>';
            html += '<ul style="padding-left: 20px; color: var(--text-light); font-size: 0.88rem; line-height: 2;">';
            for (var k = 0; k < std.keyPoints.length; k++) {
              html += '<li>' + escapeHTML(std.keyPoints[k]) + '</li>';
            }
            html += '</ul></div>';
            html += '</div>';
          }
          html += '</div>';
        }
        standardsContainer.innerHTML = html;
      })
      .catch(function (err) {
        standardsContainer.innerHTML = '<p>無法載入委員會標準資料。</p>';
        console.error(err);
      });
  }

})();
