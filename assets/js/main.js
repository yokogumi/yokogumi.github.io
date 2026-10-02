(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // スクロール表示
  var targets = document.querySelectorAll('.sec .wrap > *, .hero__text > *, .hero__fig');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    targets.forEach(function (t) { t.classList.add('rv'); io.observe(t); });
  }

  // スマホメニュー
  var mb = document.getElementById('menuBtn'), mn = document.getElementById('mnav');
  if (mb && mn) {
    var setMenu = function (open) {
      mn.hidden = !open;
      mb.setAttribute('aria-expanded', open ? 'true' : 'false');
      mb.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    };
    mb.addEventListener('click', function () { setMenu(mn.hidden); });
    mn.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  // 04 数字のカウントアップ（1回だけ）
  var big = document.getElementById('bigNum');
  if (big && !reduce && 'IntersectionObserver' in window) {
    var to = parseFloat(big.dataset.to), done = false;
    var io2 = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting || done) return;
      done = true; io2.disconnect();
      var t0 = performance.now(), dur = 1200;
      (function step(now) {
        var p = Math.min((now - t0) / dur, 1), v = (to * (1 - Math.pow(1 - p, 3))).toFixed(1);
        big.firstChild.nodeValue = '約' + v;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: 0.5 });
    io2.observe(big);
  }

  // 06 見積もり合計
  var calc = document.getElementById('calc');
  if (calc) {
    var yen = function (n) { return '¥' + n.toLocaleString('ja-JP'); };
    var update = function () {
      var min = 0, max = 0, month = 0, quote = [];
      calc.querySelectorAll('input:checked').forEach(function (c) {
        if (c.dataset.quote) quote.push(c.closest('label').querySelector('.n').firstChild.nodeValue);
        else if (c.dataset.month) month += +c.dataset.month;
        else { min += +c.dataset.min; max += +c.dataset.max; }
      });
      document.getElementById('total').textContent = min === max ? yen(min) : yen(min) + ' 〜 ' + yen(max);
      var th = document.getElementById('totalH');
      if (th) {
        var on = function (k) { var e = calc.querySelector('[data-key="' + k + '"]'); return e && e.checked; };
        th.textContent = (!on('hp') && (on('gbp') || on('line') || on('yoyaku') || on('card'))) ? '行き先のホームページは、お持ちですか？' : '';
      }
      var tq = document.getElementById('totalQ'); if (tq) tq.textContent = quote.length ? '＋ ' + quote.join('、') + '：別途お見積り' : '';
      document.getElementById('totalM').textContent = month ? '＋ 月額 ' + yen(month) : '';
    };
    calc.addEventListener('change', update);
    update();
  }

  // 08 フォーム（暫定：メールアプリを開く）
  var form = document.getElementById('form');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = form.elements;
      if (!f.name.value.trim() || !f.email.value.trim()) { alert('お名前とメールアドレスをご記入ください。'); return; }
      var rows = [['お名前', f.name.value], ['ご連絡先', f.email.value], ['業種・ジャンル', f.genre.value],
        ['開業予定時期・開業日', f.when.value], ['現在の状況', f.status.value], ['相談したいこと', f.body.value],
        ['相談の形式', f.style.value], ['希望エリア', f.area.value], ['現在のお仕事', f.job.value], ['知ったきっかけ', f.how.value]];
      var body = rows.map(function (r) { return '■' + r[0] + '\n' + r[1]; }).join('\n\n');
      location.href = 'mailto:yokogumi.info@gmail.com?subject=' + encodeURIComponent('【無料相談】' + f.name.value) + '&body=' + encodeURIComponent(body);
    });
  }
})();
