/* ===========================
   Миссионерский колледж «Маранафа»
   script.js
=========================== */

// ── Мобильное меню (overlay, не сдвигает контент) ─────────
const burger    = document.getElementById('burger');
const mobileNav = document.getElementById('mobileNav');
const mobileLinks = document.querySelectorAll('.mobile-link');

burger.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = mobileNav.classList.toggle('open');
  burger.setAttribute('aria-expanded', isOpen);
});

mobileLinks.forEach(link => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
  });
});

document.addEventListener('click', (e) => {
  if (!mobileNav.contains(e.target) && !burger.contains(e.target)) {
    mobileNav.classList.remove('open');
  }
});

// ── Показ поля "Другое" под радио ───────────────────────
function initOtherFields() {
  // church_member → other input
  document.querySelectorAll('input[name="church_member"]').forEach(r => {
    r.addEventListener('change', () => {
      const el = document.getElementById('church_member_other_input');
      if (el) el.classList.toggle('visible', r.value === 'other' && r.checked);
    });
  });
  // health → other input
  document.querySelectorAll('input[name="health"]').forEach(r => {
    r.addEventListener('change', () => {
      const el = document.getElementById('health_other_input');
      if (el) el.classList.toggle('visible', r.value === 'other' && r.checked);
    });
  });
}
initOtherFields();

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

// ── Форма заявки ─────────────────────────────────────────
const form          = document.getElementById('applicationForm');
const successBanner = document.getElementById('successBanner');
const closeBanner   = document.getElementById('closeBanner');

// Показать/скрыть ошибку поля
function setError(fieldId, show) {
  const errEl = document.getElementById('err-' + fieldId);
  if (!errEl) return;
  errEl.classList.toggle('visible', show);
}

// Валидация текстового/email/tel поля
function validateInput(field) {
  const value = field.value.trim();
  let valid = !!value;

  if (valid && field.type === 'email') {
    valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  if (valid && field.id === 'motivation' && value.length < 10) {
    valid = false;
  }
  if (valid && field.type === 'date') {
    valid = !!value;
  }

  field.classList.toggle('has-error', !valid);
  setError(field.id, !valid);
  return valid;
}

// Валидация группы радио
function validateRadioGroup(name) {
  const radios  = form.querySelectorAll(`input[name="${name}"]`);
  const checked = [...radios].some(r => r.checked);
  setError(name, !checked);
  return checked;
}

// Валидация группы чекбоксов (хотя бы один)
function validateCheckGroup(name) {
  const boxes   = form.querySelectorAll(`input[name="${name}"]`);
  const checked = [...boxes].some(b => b.checked);
  setError(name, !checked);
  return checked;
}

if (form) {
  // Живая валидация при blur
  form.querySelectorAll('.form__input[required]').forEach(field => {
    field.addEventListener('blur',  () => validateInput(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('has-error')) validateInput(field);
    });
  });

  // Живая валидация радио
  ['marital', 'church_member', 'prev_school', 'health'].forEach(name => {
    form.querySelectorAll(`input[name="${name}"]`).forEach(r => {
      r.addEventListener('change', () => validateRadioGroup(name));
    });
  });

  // Живая валидация чекбоксов
  form.querySelectorAll('input[name="ministry"]').forEach(cb => {
    cb.addEventListener('change', () => validateCheckGroup('ministry'));
  });

  // Сброс
  form.addEventListener('reset', () => {
    form.querySelectorAll('.form__input').forEach(f => f.classList.remove('has-error'));
    form.querySelectorAll('.form__err').forEach(e => e.classList.remove('visible'));
  });

  // Отправка
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let allValid = true;

    // Текстовые поля
    form.querySelectorAll('.form__input[required]').forEach(field => {
      if (!validateInput(field)) allValid = false;
    });

    // Радио-группы
    ['marital', 'church_member', 'prev_school', 'health'].forEach(name => {
      if (!validateRadioGroup(name)) allValid = false;
    });

    // Чекбоксы
    if (!validateCheckGroup('ministry')) allValid = false;

    if (!allValid) {
      const firstErr = form.querySelector('.has-error, .form__err.visible');
      if (firstErr) {
        const top = firstErr.getBoundingClientRect().top + window.pageYOffset - HEADER_HEIGHT - 20;
        window.scrollTo({ top, behavior: 'smooth' });
      }
      return;
    }

    // Собираем данные
    const getRadioVal = (name) => {
      const r = form.querySelector(`input[name="${name}"]:checked`);
      return r ? r.value : '';
    };

    const getChecked = (name) => {
      return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(c => c.value);
    };

    const formData = {
      name:               form.name.value.trim(),
      birthdate:          form.birthdate.value,
      city:               form.city.value.trim(),
      email:              form.email.value.trim(),
      phone:              form.phone.value.trim(),
      marital:            getRadioVal('marital'),
      languages:          form.languages.value.trim(),
      church_member:      getRadioVal('church_member'),
      church_member_other: form.church_member_other?.value.trim() || '',
      prev_school:        getRadioVal('prev_school'),
      ministry:           getChecked('ministry').join(', '),
      ministry_other:     form.ministry_other?.value.trim() || '',
      health:             getRadioVal('health'),
      health_other:       form.health_other?.value.trim() || '',
      motivation:         form.motivation.value.trim(),
      // age не нужен отдельно — вычисляем из даты
      age: form.birthdate.value
        ? new Date().getFullYear() - new Date(form.birthdate.value).getFullYear()
        : 0,
    };

    console.log('📤 Отправляем заявку:', formData);

    const submitBtn = form.querySelector('.btn--primary');
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Отправляем...';

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
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const msg = result.errors ? result.errors.join('\n') : result.message || 'Ошибка';
        alert('Ошибка:\n' + msg);
      }

    } catch (err) {
      console.error('🔌 Ошибка:', err.message);
      alert('Не удалось отправить. Попробуйте через Google Forms.');
    } finally {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Отправить заявку';
    }
  });
}

// ── Success Banner ────────────────────────────────────────
let bannerTimer = null;

function showSuccessBanner() {
  if (!successBanner) return;
  successBanner.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => successBanner.classList.remove('show'), 6000);
}

if (closeBanner) {
  closeBanner.addEventListener('click', () => {
    successBanner.classList.remove('show');
  });
}

// ── Активная навигация ────────────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.header__nav a[href^="#"]');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        const isActive = link.getAttribute('href') === '#' + id;
        link.style.color      = isActive ? 'var(--accent)' : '';
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

document.querySelectorAll('.pillar, .subject, .session__card, .req, .form__field').forEach(el => {
  el.style.opacity    = '0';
  el.style.transform  = 'translateY(16px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  animObserver.observe(el);
});
