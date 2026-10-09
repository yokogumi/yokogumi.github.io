(function () {
  'use strict';
  var C = window.SITE_CONFIG || {};
  var isTodo = function (v) { return !v || String(v).indexOf('【') !== -1; };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var yen = function (n) { return n.toLocaleString('ja-JP') + '円'; };

  /* GA4（IDが入っているときだけ読み込む） */
  if (/^G-[A-Z0-9]+$/.test(C.GA4_ID || '')) {
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + C.GA4_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', C.GA4_ID);
  }

  /* 申込みフォームのリンク */
  var formReady = !isTodo(C.FORM_URL);
  function wireForm() {
    $$('.js-form').forEach(function (a) {
      if (formReady) { a.href = C.FORM_URL; a.target = '_blank'; a.rel = 'noopener'; }
    });
  }
  wireForm();
  /* 選んだサービスを、フォームの「ご興味のあるサービス」に事前入力して開く */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.js-form');
    if (!a || !formReady || !C.FORM_ENTRY_SERVICE) return;
    var names = $$('.pickrow input:checked').map(function (i) { return i.dataset.name; });
    if (!names.length) names = $$('#sim-list li:not(.empty) span:first-child').map(function (s) { return s.textContent.replace('（月額）', '').trim(); });
    if (!names.length) {
      var card = a.closest('.pcard'), h = card && card.querySelector('h3');
      if (h) names = [h.textContent.trim()];
    }
    a.href = names.length
      ? C.FORM_URL + '?usp=pp_url&' + C.FORM_ENTRY_SERVICE + '=' + encodeURIComponent(names.join('、'))
      : C.FORM_URL;
  }, true);
  var note = $('#form-note');
  if (note && !formReady) { note.hidden = false; }
  var embed = $('#form-embed');
  if (embed && formReady && C.FORM_EMBED_URL) {
    embed.innerHTML = '<iframe src="' + C.FORM_EMBED_URL + '" title="無料相談申込みフォーム" loading="lazy"></iframe>';
    embed.hidden = false;
  }

  /* 残り枠 */
  var slots = $('#slots');
  if (slots) {
    var n = parseInt(C.SLOTS_LEFT, 10);
    slots.innerHTML = isNaN(n) && !C.SLOTS_LEFT
      ? '<span class="todo">【現在の残り枠を村田さんが記入】</span>'
      : '現在の残り枠：' + (isNaN(n) ? C.SLOTS_LEFT : n + '社');
  }

  /* モバイルメニュー */
  var btn = $('.menu-btn'), nav = $('#nav');
  if (btn && nav) {
    var setMenu = function (open) {
      nav.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
      btn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    };
    btn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    nav.addEventListener('click', function (e) { if (e.target === nav) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* フェードイン・カウントアップ */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var count = function (el) {
    var to = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || '0', 10), t0 = null;
    if (reduce) return;
    var step = function (t) {
      t0 = t0 || t;
      var p = Math.min((t - t0) / 1100, 1), v = to * (1 - Math.pow(1 - p, 3));
      el.textContent = v.toLocaleString('ja-JP', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && !reduce) {
    document.documentElement.classList.add('anim');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        $$('[data-count]', e.target).forEach(count);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  }

  /* 「こんな状態ではありませんか？」：困りごとを選ぶ → 内容と金額 → 相談・見積もり */
  var pains = $$('.picklist input');
  var jumpTo = function (el, block) {
    if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: block || 'start' });
  };
  if (pains.length) {
    var MAP = { 'sim-ai': 'p8', 'plan-2': 'p1', 'sim-tool': 'p2', 'sim-hp': 'p3', 'sim-biz': 'p4', 'sim-line': 'p5' };
    var sumEl = $('#pick-summary'), clr = $('#pick-clear'), priceBtn = $('.js-pick-price');
    var refresh = function () {
      var on = pains.filter(function (p) { return p.checked; });
      pains.forEach(function (p) { p.closest('.pickrow').classList.toggle('on', p.checked); });
      var tan = on.filter(function (p) { return p.dataset.kind === 'tan'; });
      var quotes = on.filter(function (p) { return p.dataset.kind === 'quote'; });
      var months = on.filter(function (p) { return p.dataset.kind === 'month'; });
      var html = '';
      if (!on.length) {
        html = '<p class="empty">当てはまるものを選ぶと、ここに料金の目安が出ます。</p>';
      } else {
        html += '<ul class="sum-items">' + on.map(function (p) { return '<li>' + p.dataset.name + '</li>'; }).join('') + '</ul>';
        var t = 0; tan.forEach(function (p) { t += parseInt(p.dataset.amount, 10); });
        var m = 0; months.forEach(function (p) { m = Math.max(m, parseInt(p.dataset.amount, 10)); });
        if (tan.length) html += '<p class="sum-row"><span>単品の合計</span><b class="mono">' + yen(t) + '</b></p>';
        if (months.length) html += '<p class="sum-row"><span>月額</span><b class="mono">月 ' + yen(m) + '</b></p>';
        if (quotes.length) html += '<p class="sum-note">アプリ・ツール開発は、要見積もりです。</p>';
        if (months.length > 1) html += '<p class="sum-note">月額プランは、いちばん大きいもの1つにまとめています。</p>';
      }
      sumEl.innerHTML = html;
      priceBtn.classList.toggle('is-off', !on.length);
      priceBtn.setAttribute('aria-disabled', on.length ? 'false' : 'true');
      if (clr) clr.hidden = !on.length;
    };
    pains.forEach(function (p) { p.addEventListener('change', refresh); });
    if (clr) clr.addEventListener('click', function () { pains.forEach(function (p) { p.checked = false; }); refresh(); });
    /* 「料金の詳細を見る」：選んだものを見積もりに入れて、料金プランへ */
    document.addEventListener('click', function (e) {
      var go = e.target.closest('.js-pick-price');
      if (!go) return;
      e.preventDefault();
      if (go.classList.contains('is-off')) return;
      var v = {}; pains.forEach(function (p) { v[p.value] = p.checked; });
      var plan = v.p1 ? 'plan-2' : null;
      $$('#sim input[type=checkbox]').forEach(function (i) { i.checked = false; });
      if (v.p3) $('#sim-hp').checked = true;
      if (v.p4) $('#sim-biz').checked = true;
      if (v.p5) $('#sim-line').checked = true;
      if (v.p8) $('#sim-ai').checked = true;
      if (v.p2) $('#sim-tool').checked = true;
      if (window.simSetPlan) window.simSetPlan(plan);
      var first = $('#sim input'); if (first) first.dispatchEvent(new Event('change', { bubbles: true }));
      var firstOn = $$('#sim input[type=checkbox]').filter(function (i) { return i.checked; })[0];
      var target = plan ? $('#plans-cards') || $('#plans') : (firstOn ? firstOn.closest('label') : $('#menu'));
      if (target) {
        var y = target.getBoundingClientRect().top + window.pageYOffset - (plan ? 76 : (firstOn ? 220 : 76));
        window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      }
    });
    /* 見積もり側の変更を、困りごとの選択に反映する */
    window.syncPains = function () {
      var act = {};
      var plan = $$('#sim input[name=simplan]').filter(function (r) { return r.checked; })[0];
      if (plan && MAP[plan.dataset.plan]) act[MAP[plan.dataset.plan]] = true;
      $$('#sim input[type=checkbox]').forEach(function (i) { if (i.checked && MAP[i.id]) act[MAP[i.id]] = true; });
      pains.forEach(function (p) { p.checked = !!act[p.value]; });
      refresh();
    };
    refresh();
  }

  /* プランのカードは、選ばれたあとでも、横のカードに選び直せる */
  $$('.pcard').forEach(function (card) {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-pressed', 'false');
    var pick = function () {
      var topBefore = card.getBoundingClientRect().top, on = card.classList.contains('pcard-rec');
      if (window.simSetPlan) window.simSetPlan(on ? '' : card.id);
      else { $$('.pcard').forEach(function (p) { p.classList.remove('pcard-rec'); }); if (!on) card.classList.add('pcard-rec'); }
      /* 上の「選んだ内容」欄の高さが変わっても、押したカードが画面上で動かないようにする */
      var d = card.getBoundingClientRect().top - topBefore;
      if (d) { var de = document.documentElement, sb = de.style.scrollBehavior; de.style.scrollBehavior = 'auto'; window.scrollBy(0, d); de.style.scrollBehavior = sb; }
    };
    card.addEventListener('click', function (e) { if (e.target.closest('a')) return; pick(); });
    card.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('a')) { e.preventDefault(); pick(); } });
  });

  /* ヒーローのラベル → その困りごとを選んだ状態で、困りごとの場所へ */
  $$('.scope a[data-pain]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var r = $('.picklist input[value="' + a.dataset.pain + '"]');
      if (!r) return;
      e.preventDefault();
      r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true }));
      jumpTo($('#check'), 'start');
    });
  });
  document.addEventListener('click', function (e) {
    var gp = e.target.closest('.js-go-plan');
    if (gp) { $$('.pcard').forEach(function (p) { p.classList.remove('pcard-rec'); }); var t = $('#' + gp.dataset.plan); if (t) t.classList.add('pcard-rec'); }
    var gs = e.target.closest('.js-go-sim');
    if (gs && gs.dataset.sim) {
      $$('#sim input[type=checkbox]').forEach(function (i) { i.checked = false; });
      var it = $('#' + gs.dataset.sim); if (it) it.checked = true;
      var first = $('#sim input'); if (first) first.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  /* 料金シミュレーター（契約・決済ではありません）：単発＋月額プラン */
  var items = $$('#sim input[type=checkbox]');
  var simPlans = $$('#sim input[name=simplan]');
  var list = $('#sim-list'), total = $('#sim-total'), bundle = $('#sim-bundle');
  var monthRow = $('#sim-month-row'), monthEl = $('#sim-month');
  if (items.length && list && total) {
    var calc = function () {
      var min = 0, max = 0, open = false, html = '', on = items.filter(function (i) { return i.checked; });
      var plan = simPlans.filter(function (r) { return r.checked; })[0];
      if (plan) html += '<li><span>' + plan.dataset.label + '（月額）</span><span>' + yen(parseInt(plan.dataset.month, 10)) + ' / 月</span></li>';
      on.forEach(function (i) {
        if (i.dataset.quote) { html += '<li><span>' + i.dataset.label + '</span><span>要見積もり</span></li>'; return; }
        var a = parseInt(i.dataset.min, 10), b = parseInt(i.dataset.max || i.dataset.min, 10);
        min += a; max += b;
        var isOpen = !!i.dataset.open; if (isOpen) open = true;
        html += '<li><span>' + i.dataset.label + '</span><span>' + (isOpen ? yen(a) + '〜' : (a === b ? yen(a) : yen(a) + '〜' + yen(b))) + '</span></li>';
      });
      list.innerHTML = html || '<li class="empty">項目を選ぶと、ここに表示されます。</li>';
      var q = on.some(function (i) { return i.dataset.quote; }), priced = on.some(function (i) { return !i.dataset.quote; });
      total.textContent = !on.length ? '0円' : (priced ? (open ? yen(min) + '〜' : (min === max ? yen(min) : yen(min) + '〜' + yen(max))) + (q ? '＋要見積もり' : '') : '要見積もり');
      if (monthRow) { monthRow.hidden = !plan; if (plan) monthEl.textContent = '月 ' + yen(parseInt(plan.dataset.month, 10)); }
      if (bundle) {
        var ids = ['hp', 'gbp', 'ig'];
        bundle.hidden = !ids.every(function (id) { return $('#sim-' + id).checked; });
      }
      $$('.pcard').forEach(function (p) { p.classList.toggle('pcard-rec', !!plan && p.id === plan.dataset.plan); p.setAttribute('aria-pressed', (!!plan && p.id === plan.dataset.plan) ? 'true' : 'false'); });
      if (window.syncPains) window.syncPains();
    };
    items.forEach(function (i) { i.addEventListener('change', calc); });
    simPlans.forEach(function (r) {
      r.addEventListener('change', calc);
      r.addEventListener('click', function () {
        var was = r.dataset.was === '1';
        simPlans.forEach(function (x) { x.dataset.was = '0'; });
        if (was) { setTimeout(function () { r.checked = false; calc(); }, 0); } else { r.dataset.was = '1'; }
      });
    });
    var reset = $('#sim-reset');
    if (reset) reset.addEventListener('click', function () { items.forEach(function (i) { i.checked = false; }); simPlans.forEach(function (r) { r.checked = false; r.dataset.was = '0'; }); calc(); });
    window.simSetPlan = function (id) {
      simPlans.forEach(function (r) { r.checked = (r.dataset.plan === id); r.dataset.was = r.checked ? '1' : '0'; });
      calc();
    };
    calc();
  }

  /* 固定CTA（スマホ）：ヒーローと申込みセクションでは隠す */
  var bar = $('.cta-bar');
  if (bar && 'IntersectionObserver' in window) {
    var hidden = { hero: true, contact: false };
    var sync = function () { bar.classList.toggle('show', !hidden.hero && !hidden.contact); };
    [['#top', 'hero'], ['#contact', 'contact']].forEach(function (p) {
      var el = $(p[0]); if (!el) return;
      new IntersectionObserver(function (es) { hidden[p[1]] = es[0].isIntersecting; sync(); }).observe(el);
    });
  }
})();
