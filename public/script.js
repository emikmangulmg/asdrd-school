/* ===========================
   Миссионерский колледж «Маранафа»
   script.js
=========================== */

// ── Мобильное меню (overlay) ──────────────────────────────
const burger    = document.getElementById('burger');
const mobileNav = document.getElementById('mobileNav');
const mobileLinks = document.querySelectorAll('.mobile-link');

burger.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = mobileNav.classList.toggle('open');
  burger.setAttribute('aria-expanded', isOpen);
  // Анимация линий бургера
  burger.classList.toggle('is-active', isOpen);
});

// Закрыть при клике на ссылку
mobileLinks.forEach(link => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    burger.classList.remove('is-active');
  });
});

// Закрыть при клике вне меню
document.addEventListener('click', (e) => {
  if (!mobileNav.contains(e.target) && !burger.contains(e.target)) {
    mobileNav.classList.remove('open');
    burger.classList.remove('is-active');
  }
});

// ── Плавный скролл с offset ───────────────────────────────
const HEADER_HEIGHT = 68;

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.pageYOffset - HEADER_HEIGHT;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ── Форма заявки (Google Forms стиль) ────────────────────
const form          = document.getElementById('applicationForm');
const successBanner = document.getElementById('successBanner');
const closeBanner   = document.getElementById('closeBanner');

// Проверка поля + показ/скрытие ошибки
function validateField(field) {
  const value     = field.value.trim();
  const errEl     = document.getElementById('err-' + field.id);
  let   valid     = true;

  if (!value) {
    valid = false;
  } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    valid = false;
  } else if (field.type === 'number') {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < parseInt(field.min, 10) || num > parseInt(field.max, 10)) {
      valid = false;
    }
  } else if (field.tagName === 'TEXTAREA' && value.length < 10) {
    valid = false;
  }

  // Google Forms стиль: красная нижняя линия + сообщение
  if (valid) {
    field.classList.remove('has-error');
    if (errEl) errEl.classList.remove('visible');
  } else {
    field.classList.add('has-error');
    if (errEl) errEl.classList.add('visible');
  }

  return valid;
}

if (form) {
  // Валидация в реальном времени
  form.querySelectorAll('.gform-input').forEach(field => {
    field.addEventListener('blur',  () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('has-error')) validateField(field);
    });
  });

  // Сброс формы (кнопка "Очистить")
  form.addEventListener('reset', () => {
    form.querySelectorAll('.gform-input').forEach(f => {
      f.classList.remove('has-error');
    });
    form.querySelectorAll('.gform-err').forEach(e => {
      e.classList.remove('visible');
    });
  });

  // Отправка
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Валидируем все поля
    const fields = form.querySelectorAll('.gform-input[required]');
    let allValid = true;
    fields.forEach(field => { if (!validateField(field)) allValid = false; });

    if (!allValid) {
      // Скроллим к первой ошибке
      const firstError = form.querySelector('.has-error');
      if (firstError) {
        const top = firstError.getBoundingClientRect().top + window.pageYOffset - HEADER_HEIGHT - 20;
        window.scrollTo({ top, behavior: 'smooth' });
      }
      return;
    }

    const submitBtn = form.querySelector('.gform-submit');
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Отправляем...';

    const formData = {
      name:       form.name.value.trim(),
      age:        parseInt(form.age.value.trim(), 10),
      city:       form.city.value.trim(),
      email:      form.email.value.trim(),
      motivation: form.motivation.value.trim(),
    };

    console.log('📤 Отправляем заявку:', formData);

    try {
      const response = await fetch('/api/apply', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData),
      });

      const result = await response.json();
      console.log('📥 Ответ:', result);

      if (response.ok && result.success) {
        form.reset();
        showSuccessBanner();
      } else {
        const messages = result.errors ? result.errors.join('\n') : result.message || 'Ошибка';
        alert('Ошибка:\n' + messages);
      }

    } catch (err) {
      console.error('🔌 Ошибка:', err.message);
      alert('Не удалось отправить. Попробуйте через Google Forms.');
    } finally {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Отправить';
    }
  });
}

// ── Success Banner ────────────────────────────────────────
let bannerTimer = null;

function showSuccessBanner() {
  if (!successBanner) return;
  successBanner.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(hideSuccessBanner, 5000);
}

function hideSuccessBanner() {
  if (!successBanner) return;
  successBanner.classList.remove('show');
}

if (closeBanner) closeBanner.addEventListener('click', hideSuccessBanner);

// ── Активная навигация ────────────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.header__nav a[href^="#"]');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        const isActive = link.getAttribute('href') === '#' + id;
        link.style.color = isActive ? 'var(--accent)' : '';
        link.style.fontWeight = isActive ? '600' : '';
      });
    }
  });
}, { rootMargin: '-' + HEADER_HEIGHT + 'px 0px -60% 0px' });

sections.forEach(s => observer.observe(s));

// ── Анимация появления ────────────────────────────────────
const animObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
      }, i * 70);
      animObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.pillar, .opp__item, .subject, .session__card, .req, .gform-card').forEach(el => {
  el.style.opacity    = '0';
  el.style.transform  = 'translateY(18px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  animObserver.observe(el);
});
