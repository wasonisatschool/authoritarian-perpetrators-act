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

})();
