/* ===========================
   Миссионерский колледж «Маранафа»
   script.js
=========================== */

const TOKEN_KEY = 'asdrd_admin_token';

// ── Мобильное меню ────────────────────────────────────────
const burger    = document.getElementById('burger');
const mobileNav = document.getElementById('mobileNav');
const mobileLinks = document.querySelectorAll('.mobile-link');

burger.addEventListener('click', () => {
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
const submitBtn     = form ? form.querySelector('button[type="submit"]') : null;
const successBanner = document.getElementById('successBanner');
const closeBanner   = document.getElementById('closeBanner');

function validateField(field) {
  const value = field.value.trim();
  let valid = true;

  if (!value) {
    valid = false;
  } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    valid = false;
  } else if (field.type === 'number') {
    const num = parseInt(value, 10);
    const min = parseInt(field.min, 10);
    const max = parseInt(field.max, 10);
    if (isNaN(num) || num < min || num > max) valid = false;
  }

  field.classList.toggle('error', !valid);
  return valid;
}

if (form) {
  form.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('blur',  () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('error')) validateField(field);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fields = form.querySelectorAll('input[required], textarea[required]');
    let allValid = true;
    fields.forEach(field => { if (!validateField(field)) allValid = false; });

    if (!allValid) {
      const firstError = form.querySelector('.error');
      if (firstError) {
        const top = firstError.getBoundingClientRect().top + window.pageYOffset - HEADER_HEIGHT - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      }
      return;
    }

    const formData = {
      name:       form.name.value.trim(),
      age:        parseInt(form.age.value.trim(), 10),
      city:       form.city.value.trim(),
      email:      form.email.value.trim(),
      motivation: form.motivation.value.trim(),
    };

    console.log('📤 Отправляем заявку:', formData);
    setLoading(true);

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
        form.querySelectorAll('.error').forEach(f => f.classList.remove('error'));
        showSuccessBanner();
        setTimeout(() => alert('✦ Заявка отправлена!\n\nМы свяжемся с тобой в ближайшее время.'), 200);
      } else {
        const messages = result.errors ? result.errors.join('\n') : result.message || 'Ошибка';
        alert('Ошибка:\n' + messages);
      }

    } catch (err) {
      console.error('🔌 Сетевая ошибка:', err.message);
      alert('Не удалось отправить заявку. Попробуй через Google Form.');
    } finally {
      setLoading(false);
    }
  });
}

function setLoading(isLoading) {
  if (!submitBtn) return;
  submitBtn.disabled    = isLoading;
  submitBtn.textContent = isLoading ? 'Отправляем...' : 'Отправить заявку →';
  submitBtn.style.opacity = isLoading ? '0.7' : '1';
}

// ── Success Banner ────────────────────────────────────────
let bannerTimer = null;

function showSuccessBanner() {
  successBanner.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(hideSuccessBanner, 5000);
}

function hideSuccessBanner() {
  successBanner.classList.remove('show');
  clearTimeout(bannerTimer);
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
        link.style.color = isActive ? 'var(--gold-light)' : '';
      });
    }
  });
}, { rootMargin: '-' + HEADER_HEIGHT + 'px 0px -60% 0px' });

sections.forEach(s => observer.observe(s));

// ── Анимация появления элементов ─────────────────────────
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

document.querySelectorAll('.pillar, .opp__item, .subject, .session__card, .req').forEach(el => {
  el.style.opacity    = '0';
  el.style.transform  = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  animObserver.observe(el);
});
