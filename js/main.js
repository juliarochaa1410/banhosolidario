(function () {
  'use strict';

  // ---- Dados para editar ----
  var CONFIG = {
    pix: {
      key: '30408746000108',
      name: 'BANHO SOLIDARIO ILHEUS',
      city: 'ILHEUS'
    },
    // Enquanto estiver vazio (''), o botão aparece mas não abre nada
    instagram: '', // ex.: 'https://www.instagram.com/banhosolidario'
    whatsapp: '', // só números, com DDI e DDD. ex.: '5573999999999'
    whatsappText: 'Olá! Quero ser voluntário(a) no Banho Solidário.',
    defaultAmount: 25
  };

  var state = { amount: CONFIG.defaultAmount, custom: false };

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  var amountButtons = $$('.amount');
  var otherBox = $('#other');
  var otherInput = $('#other-value');
  var impact = $('#impact');
  var copyCodeBtn = $('#copy-code');
  var copyCodeLabel = $('#copy-code-label');
  var copyKeyBtn = $('#copy-key');
  var qrBox = $('#qr');
  var toast = $('#toast');

  // ---- Valores ----

  function formatBRL(value) {
    if (value % 1 === 0) return 'R$ ' + value.toLocaleString('pt-BR');
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function parseAmount(text) {
    var t = String(text).replace(/[^\d.,]/g, '');
    if (t.indexOf(',') !== -1) t = t.replace(/\./g, '').replace(',', '.');
    var n = Math.round(parseFloat(t) * 100) / 100;
    return isFinite(n) && n > 0 && n <= 1000000 ? n : 0;
  }

  function currentCode() {
    return Pix.payload({
      key: CONFIG.pix.key,
      name: CONFIG.pix.name,
      city: CONFIG.pix.city,
      amount: state.amount
    });
  }

  function render() {
    amountButtons.forEach(function (btn) {
      var isOther = btn.dataset.amount === 'outro';
      var on = isOther ? state.custom : !state.custom && Number(btn.dataset.amount) === state.amount;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    otherBox.hidden = !state.custom;

    if (state.amount > 0) {
      impact.textContent = 'Com ' + formatBRL(state.amount) + ' você ajuda a levar banho quente e kit de higiene a quem está na rua.';
      copyCodeLabel.textContent = 'Copiar Pix de ' + formatBRL(state.amount);
    } else {
      impact.textContent = 'Digite o valor ou deixe em branco para escolher no app do banco.';
      copyCodeLabel.textContent = 'Copiar código Pix';
    }

    renderQr();
  }

  function renderQr() {
    if (!qrBox || typeof qrcode === 'undefined') return;
    if (getComputedStyle(qrBox).display === 'none') return;
    var qr = qrcode(0, 'M');
    qr.addData(currentCode());
    qr.make();
    qrBox.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    var svg = qrBox.querySelector('svg');
    if (svg) {
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'QR Code Pix' + (state.amount > 0 ? ' de ' + formatBRL(state.amount) : ''));
    }
  }

  amountButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.dataset.amount === 'outro') {
        state.custom = true;
        state.amount = parseAmount(otherInput.value);
        render();
        otherInput.focus();
      } else {
        state.custom = false;
        state.amount = Number(btn.dataset.amount);
        render();
      }
    });
  });

  otherInput.addEventListener('input', function () {
    state.amount = parseAmount(otherInput.value);
    render();
  });

  // ---- Copiar ----

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); } catch (e) { /* sem suporte */ }
    document.body.removeChild(area);
  }

  var toastTimer;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 2400);
  }

  var codeTimer;
  copyCodeBtn.addEventListener('click', function () {
    copyText(currentCode()).then(function () {
      copyCodeBtn.classList.add('is-done');
      copyCodeLabel.textContent = 'Código copiado!';
      showToast('Agora é só colar no app do banco');
      clearTimeout(codeTimer);
      codeTimer = setTimeout(function () {
        copyCodeBtn.classList.remove('is-done');
        render();
      }, 2400);
    });
  });

  var keyTimer;
  copyKeyBtn.addEventListener('click', function () {
    copyText(CONFIG.pix.key).then(function () {
      copyKeyBtn.textContent = 'Copiada!';
      showToast('Chave Pix copiada');
      clearTimeout(keyTimer);
      keyTimer = setTimeout(function () { copyKeyBtn.textContent = 'Copiar'; }, 2400);
    });
  });

  // ---- Compartilhar ----

  $$('[data-share]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var url = location.origin + location.pathname;
      var data = {
        title: 'Banho Solidário',
        text: 'Ajude o Banho Solidário a levar banho e dignidade a quem está na rua em Ilhéus.',
        url: url
      };
      if (navigator.share) {
        navigator.share(data).catch(function () {});
      } else {
        copyText(url).then(function () { showToast('Link copiado'); });
      }
    });
  });

  // ---- Links das redes ----
  // Sem endereço configurado o botão aparece, mas não leva a lugar nenhum

  function setLink(a, url) {
    if (url) {
      a.href = url;
      return;
    }
    a.href = '#';
    a.removeAttribute('target');
    a.addEventListener('click', function (e) { e.preventDefault(); });
  }

  $$('[data-link="instagram"]').forEach(function (a) {
    setLink(a, CONFIG.instagram);
  });

  $$('[data-link="whatsapp"]').forEach(function (a) {
    setLink(a, CONFIG.whatsapp ? 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(CONFIG.whatsappText) : '');
  });

  // ---- Animações ----

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canObserve = 'IntersectionObserver' in window;

  // Seções surgem ao rolar
  var reveals = $$('.reveal');
  if (reduceMotion || !canObserve) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  }

  // Números de "O que já fizemos" contam até o valor
  function countUp(el) {
    var target = Number(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    var duration = 1800;
    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 4);
      el.textContent = Math.round(target * eased).toLocaleString('pt-BR') + (t === 1 ? suffix : '');
      if (t < 1) requestAnimationFrame(frame);
      else el.classList.add('is-done');
    }
    requestAnimationFrame(frame);
  }

  var counters = $$('[data-count]');
  if (!reduceMotion && canObserve && counters.length) {
    counters.forEach(function (el) { el.textContent = '0'; });
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countObserver.disconnect();
        counters.forEach(function (el, i) { setTimeout(function () { countUp(el); }, i * 150); });
      });
    }, { threshold: 0.5 });
    countObserver.observe(counters[0].closest('.stats'));
  }

  // QR só aparece no computador; redesenha se a janela mudar de tamanho
  var mq = window.matchMedia('(min-width: 900px)');
  if (mq.addEventListener) mq.addEventListener('change', renderQr);

  render();
})();
