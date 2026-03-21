/* ============================================================
   admin.js — Обновлённая версия с JWT авторизацией
   Миссионерская школа АСДРД v3.0
============================================================ */

// ── Ключ хранения токена в localStorage ──────────────────
const TOKEN_KEY = 'asdrd_admin_token';

// ── Элементы страницы ─────────────────────────────────────
const loginScreen      = document.getElementById('loginScreen');
const adminPanel       = document.getElementById('adminPanel');
const loginError       = document.getElementById('loginError');
const loginBtn         = document.getElementById('loginBtn');
const applicationsBody = document.getElementById('applicationsBody');
const stateLoading     = document.getElementById('stateLoading');
const stateEmpty       = document.getElementById('stateEmpty');
const tableWrap        = document.getElementById('tableWrap');
const statTotal        = document.getElementById('statTotal');
const statAccepted     = document.getElementById('statAccepted');
const statNew          = document.getElementById('statNew');

// ── Инициализация ─────────────────────────────────────────
// При загрузке страницы проверяем — есть ли токен в localStorage
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    console.log('🔑 Токен найден в localStorage — проверяем...');
    // Пробуем загрузить заявки — если токен истёк, придёт 401
    showAdminPanel();
  } else {
    console.log('ℹ️  Токена нет — показываем форму входа');
  }
});

// Enter в полях формы
document.getElementById('passwordInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') login();
});
document.getElementById('loginInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') login();
});

// ── Вспомогательная функция: получить токен ──────────────
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// ── Вспомогательная функция: заголовки с токеном ─────────
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + getToken(),
    // ↑ Именно так передаём токен — сервер проверяет этот заголовок
  };
}

// ── login() ───────────────────────────────────────────────
async function login() {
  const login    = document.getElementById('loginInput').value.trim();
  const password = document.getElementById('passwordInput').value;

  if (!login || !password) {
    showLoginError('Введите логин и пароль');
    return;
  }

  loginBtn.disabled    = true;
  loginBtn.textContent = 'Входим...';
  loginError.style.display = 'none';

  console.log('📤 Отправляем данные входа...');

  try {
    const res = await fetch('/api/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ login, password }),
    });

    const data = await res.json();
    console.log('📥 Ответ сервера:', data);

    if (res.ok && data.success) {
      // Сохраняем JWT токен в localStorage
      localStorage.setItem(TOKEN_KEY, data.token);
      console.log('✅ Токен сохранён в localStorage');
      showAdminPanel();
    } else {
      showLoginError(data.message || 'Неверный логин или пароль');
    }

  } catch (err) {
    console.error('🔌 Сетевая ошибка:', err.message);
    showLoginError('Не удалось подключиться к серверу');
  } finally {
    loginBtn.disabled    = false;
    loginBtn.textContent = 'Войти';
  }
}

// ── logout() ──────────────────────────────────────────────
function logout() {
  // Удаляем токен из localStorage
  localStorage.removeItem(TOKEN_KEY);
  console.log('👋 Токен удалён, выход выполнен');

  adminPanel.style.display  = 'none';
  loginScreen.style.display = 'flex';
  document.getElementById('loginInput').value    = '';
  document.getElementById('passwordInput').value = '';
}

// ── showAdminPanel() ──────────────────────────────────────
function showAdminPanel() {
  loginScreen.style.display = 'none';
  adminPanel.style.display  = 'block';
  loadApplications();
}

// ── loadApplications() ────────────────────────────────────
async function loadApplications() {
  console.log('📋 Загружаем заявки...');

  stateLoading.style.display = 'block';
  stateEmpty.style.display   = 'none';
  tableWrap.style.display    = 'none';

  try {
    const res = await fetch('/api/applications', {
      headers: authHeaders(), // передаём JWT в заголовке
    });

    // Если токен истёк — выходим
    if (res.status === 401) {
      console.warn('🔒 Токен недействителен — выход');
      showToast('Сессия истекла, войдите снова', 'error');
      logout();
      return;
    }

    const data = await res.json();
    console.log(`✅ Загружено заявок: ${data.count}`);

    stateLoading.style.display = 'none';

    if (!data.data || data.data.length === 0) {
      stateEmpty.style.display = 'block';
      updateStats([]);
      return;
    }

    renderTable(data.data);
    updateStats(data.data);
    tableWrap.style.display = 'block';

  } catch (err) {
    console.error('❌ Ошибка загрузки:', err.message);
    stateLoading.style.display = 'none';
    stateEmpty.style.display   = 'block';
    showToast('Ошибка загрузки заявок', 'error');
  }
}

// ── renderTable() ─────────────────────────────────────────
function renderTable(applications) {
  applicationsBody.innerHTML = '';

  applications.forEach((app, index) => {
    const tr  = document.createElement('tr');
    tr.id = `row-${app.id}`;

    const date = new Date(app.created_at).toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

    const statusMap = {
      new:      { label: 'Новая',     cls: 'status-new' },
      accepted: { label: 'Принята',   cls: 'status-accepted' },
      rejected: { label: 'Отклонена', cls: 'status-rejected' },
    };
    const status = statusMap[app.status] || statusMap['new'];

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td class="td-name">${escapeHtml(app.name)}</td>
      <td>${app.age}</td>
      <td>${escapeHtml(app.city)}</td>
      <td>${escapeHtml(app.email)}</td>
      <td class="td-motivation" title="${escapeHtml(app.motivation)}">${escapeHtml(app.motivation)}</td>
      <td class="td-date">${date}</td>
      <td><span class="status-badge ${status.cls}" id="status-${app.id}">${status.label}</span></td>
      <td>
        <div class="actions">
          <button class="btn btn-accept" onclick="changeStatus(${app.id}, 'accepted')">✓</button>
          <button class="btn btn-reject" onclick="changeStatus(${app.id}, 'rejected')">✗</button>
          <button class="btn btn-delete" onclick="deleteApplication(${app.id})">🗑</button>
        </div>
      </td>
    `;

    applicationsBody.appendChild(tr);
  });
}

// ── updateStats() ─────────────────────────────────────────
function updateStats(applications) {
  statTotal.textContent    = applications.length;
  statAccepted.textContent = applications.filter(a => a.status === 'accepted').length;
  statNew.textContent      = applications.filter(a => a.status === 'new').length;
}

// ── deleteApplication() ───────────────────────────────────
async function deleteApplication(id) {
  if (!confirm('Удалить эту заявку? Действие необратимо.')) return;

  console.log(`🗑️  Удаляем заявку ID: ${id}`);

  try {
    const res = await fetch(`/api/applications/${id}`, {
      method:  'DELETE',
      headers: authHeaders(), // JWT в заголовке
    });

    if (res.status === 401) { logout(); return; }

    const data = await res.json();

    if (res.ok && data.success) {
      // Убираем строку из таблицы с анимацией
      const row = document.getElementById(`row-${id}`);
      if (row) {
        row.style.transition = 'opacity 0.3s, transform 0.3s';
        row.style.opacity    = '0';
        row.style.transform  = 'translateX(-20px)';
        setTimeout(() => {
          row.remove();
          if (applicationsBody.children.length === 0) {
            tableWrap.style.display  = 'none';
            stateEmpty.style.display = 'block';
          }
          loadApplications(); // обновляем статистику
        }, 300);
      }
      showToast('Заявка удалена', 'success');
    } else {
      showToast(data.message || 'Ошибка удаления', 'error');
    }

  } catch (err) {
    console.error('❌ Ошибка удаления:', err.message);
    showToast('Ошибка сети', 'error');
  }
}

// ── changeStatus() ────────────────────────────────────────
async function changeStatus(id, status) {
  console.log(`📝 Меняем статус ID ${id} → ${status}`);

  try {
    const res = await fetch(`/api/applications/${id}`, {
      method:  'PUT',
      headers: authHeaders(), // JWT в заголовке
      body:    JSON.stringify({ status }),
    });

    if (res.status === 401) { logout(); return; }

    const data = await res.json();

    if (res.ok && data.success) {
      // Обновляем бейдж без перезагрузки
      const badge = document.getElementById(`status-${id}`);
      if (badge) {
        const map = {
          new:      { label: 'Новая',     cls: 'status-new' },
          accepted: { label: 'Принята',   cls: 'status-accepted' },
          rejected: { label: 'Отклонена', cls: 'status-rejected' },
        };
        badge.textContent = map[status].label;
        badge.className   = `status-badge ${map[status].cls}`;
      }
      const labels = { accepted: 'принята ✓', rejected: 'отклонена ✗', new: 'сброшена' };
      showToast(`Заявка ${labels[status]}`, 'success');
      loadApplications();
    } else {
      showToast(data.message || 'Ошибка обновления', 'error');
    }

  } catch (err) {
    console.error('❌ Ошибка смены статуса:', err.message);
    showToast('Ошибка сети', 'error');
  }
}

// ── Вспомогательные функции ───────────────────────────────
function showLoginError(msg) {
  loginError.textContent   = msg;
  loginError.style.display = 'block';
}

let toastTimer = null;
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const icons = { success: '✅', error: '❌' };
  toast.textContent = `${icons[type]} ${message}`;
  toast.className   = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
