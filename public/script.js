/* ===========================
   МИССИОНЕРСКАЯ ШКОЛА АСДРД
   script.js — обновлённая версия с fetch API
=========================== */

// ── Мобильное меню (бургер) ──────────────────────────────
const burger    = document.getElementById('burger');
const mobileNav = document.getElementById('mobileNav');
const mobileLinks = document.querySelectorAll('.mobile-link');

burger.addEventListener('click', () => {
  const isOpen = mobileNav.classList.toggle('open');
  burger.setAttribute('aria-expanded', isOpen);
  burger.classList.toggle('active', isOpen);
});

mobileLinks.forEach(link => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    burger.setAttribute('aria-expanded', false);
    burger.classList.remove('active');
  });
});

document.addEventListener('click', (e) => {
  if (!mobileNav.contains(e.target) && !burger.contains(e.target)) {
    mobileNav.classList.remove('open');
    burger.classList.remove('active');
  }
});


// ── Плавный скролл к якорям ──────────────────────────────
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
const submitBtn     = form.querySelector('button[type="submit"]');
const successBanner = document.getElementById('successBanner');
const closeBanner   = document.getElementById('closeBanner');

// Валидация отдельного поля
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

// Подсветка ошибок при потере фокуса
form.querySelectorAll('input, textarea').forEach(field => {
  field.addEventListener('blur',  () => validateField(field));
  field.addEventListener('input', () => {
    if (field.classList.contains('error')) validateField(field);
  });
});

// ── Отправка формы через fetch ────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault(); // Отменяем стандартное поведение браузера

  // Клиентская валидация перед отправкой
  const fields = form.querySelectorAll('input[required], textarea[required]');
  let allValid = true;

  fields.forEach(field => {
    if (!validateField(field)) allValid = false;
  });

  if (!allValid) {
    const firstError = form.querySelector('.error');
    if (firstError) {
      const top = firstError.getBoundingClientRect().top + window.pageYOffset - HEADER_HEIGHT - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    return;
  }

  // Собираем данные из полей формы
  const formData = {
    name:       form.name.value.trim(),
    age:        parseInt(form.age.value.trim(), 10),
    city:       form.city.value.trim(),
    email:      form.email.value.trim(),
    motivation: form.motivation.value.trim(),
  };

  console.log('📤 Отправляем заявку на сервер:', formData);

  // Блокируем кнопку на время запроса
  setLoading(true);

  try {
    // ── fetch: POST-запрос на backend ────────────────────
    const response = await fetch('/api/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    // Парсим JSON-ответ от сервера
    const result = await response.json();

    console.log('📥 Ответ сервера:', result);

    if (response.ok && result.success) {
      console.log('✅ Заявка сохранена с ID:', result.id);

      form.reset();
      form.querySelectorAll('.error').forEach(f => f.classList.remove('error'));

      showSuccessBanner();

      setTimeout(() => alert('✅ Заявка отправлена!\n\nМы свяжемся с вами в течение 3 рабочих дней.'), 200);

    } else {
      const messages = result.errors
        ? result.errors.join('\n')
        : result.message || 'Неизвестная ошибка';

      console.warn('⚠️  Ошибка от сервера:', messages);
      alert('❌ Ошибка:\n' + messages);
    }

  } catch (networkError) {
    console.error('🔌 Сетевая ошибка:', networkError.message);
    alert('❌ Не удалось отправить заявку.\nПроверьте подключение или попробуйте позже.');

  } finally {
    setLoading(false);
  }
});


// ── Состояние загрузки кнопки ─────────────────────────────
function setLoading(isLoading) {
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

closeBanner.addEventListener('click', hideSuccessBanner);


// ── Активная навигация при скролле ───────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.header__nav a[href^="#"]');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        const isActive    = link.getAttribute('href') === '#' + id;
        link.style.color      = isActive ? 'var(--clr-accent)' : '';
        link.style.fontWeight = isActive ? '700' : '';
      });
    }
  });
}, { rootMargin: '-' + HEADER_HEIGHT + 'px 0px -60% 0px' });

sections.forEach(section => observer.observe(section));


// ── Анимация появления карточек ──────────────────────────
const animObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
      }, i * 80);
      animObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.card, .pillar, .req').forEach(el => {
  el.style.opacity    = '0';
  el.style.transform  = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  animObserver.observe(el);
});
