/* ─────────────────────────────────────────────────────────────────────────────
   TaskBoard — Frontend Application Logic
   Week 4: Layered Architecture Lab
   Based on Week 3 real codebase — adapted for layered API responses
───────────────────────────────────────────────────────────────────────────── */

'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  tasks:          [],
  filterStatus:   '',
  filterPriority: '',
  searchQuery:    '',
  viewMode:       'board',
  pendingDeleteId: null,
};

// ── API helpers ───────────────────────────────────────────────────────────────
const API = {
  base: '/api',
  async request(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res  = await fetch(this.base + path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },
  getTasks(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('GET', `/tasks${qs ? '?' + qs : ''}`);
  },
  createTask(task)    { return this.request('POST',   '/tasks',                 task); },
  updateTask(id, task){ return this.request('PUT',    `/tasks/${id}`,           task); },
  nextStatus(id)      { return this.request('PATCH',  `/tasks/${id}/next-status`);    },
  deleteTask(id)      { return this.request('DELETE', `/tasks/${id}`);                },
  getStats()          { return this.request('GET',    '/tasks/stats');                },
};

// ── DOM refs ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const dom = {
  statTotal: $('statTotal'), statTodo: $('statTodo'), statWip: $('statWip'), statDone: $('statDone'),
  searchInput: $('searchInput'), filterStatus: $('filterStatus'), filterPriority: $('filterPriority'),
  viewBoard: $('viewBoard'), viewList: $('viewList'),
  boardView: $('boardView'), listView: $('listView'), emptyState: $('emptyState'),
  taskTableBody: $('taskTableBody'),
  tasksTodo: $('tasks-todo'), tasksInprogress: $('tasks-inprogress'), tasksDone: $('tasks-done'),
  countTodo: $('count-todo'), countInprogress: $('count-inprogress'), countDone: $('count-done'),
  modalBackdrop: $('modalBackdrop'), modal: $('modal'), modalTitle: $('modalTitle'),
  modalClose: $('modalClose'), taskId: $('taskId'), taskTitle: $('taskTitle'),
  taskDesc: $('taskDescription'), taskStatus: $('taskStatus'), taskPriority: $('taskPriority'),
  formError: $('formError'), btnSave: $('btnSave'), btnCancel: $('btnCancel'),
  confirmBackdrop: $('confirmBackdrop'), confirmTaskName: $('confirmTaskName'),
  confirmDelete: $('confirmDelete'), confirmCancel: $('confirmCancel'),
  btnNewTask: $('btnNewTask'), toastContainer: $('toastContainer'),
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
  dom.toastContainer.appendChild(el);
  setTimeout(() => {
    el.classList.add('fade-out');
    el.addEventListener('animationend', () => el.remove());
  }, 3000);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}
function nextStatusLabel(current) {
  return { TODO: '→ In Progress', IN_PROGRESS: '→ Done' }[current] || null;
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderStats() {
  API.getStats().then(res => {
    const s = res.data; // Week 4: { total, byStatus, byPriority }
    dom.statTotal.querySelector('b').textContent = s.total;
    dom.statTodo.textContent = s.byStatus.TODO;
    dom.statWip.textContent  = s.byStatus.IN_PROGRESS;
    dom.statDone.textContent = s.byStatus.DONE;
  }).catch(() => {});
}

function buildCard(task) {
  const nextLabel = nextStatusLabel(task.status);
  const card = document.createElement('div');
  card.className = `task-card status-${task.status}`;
  card.dataset.id = task.id;
  card.innerHTML = `
    <div class="card-top">
      <span class="card-title">${escHtml(task.title)}</span>
      <span class="priority-badge priority-${task.priority}">${task.priority}</span>
    </div>
    ${task.description ? `<p class="card-desc">${escHtml(task.description)}</p>` : ''}
    <div class="card-footer">
      <span class="card-date">${formatDate(task.created_at)}</span>
      <div class="card-actions">
        ${nextLabel ? `<button class="card-btn next" data-action="next" data-id="${task.id}">${nextLabel}</button>` : ''}
        <button class="card-btn edit"   data-action="edit"   data-id="${task.id}">Edit</button>
        <button class="card-btn delete" data-action="delete" data-id="${task.id}" data-title="${escHtml(task.title)}">Del</button>
      </div>
    </div>`;
  return card;
}

function buildTableRow(task) {
  const nextLabel = nextStatusLabel(task.status);
  const tr = document.createElement('tr');
  tr.dataset.id = task.id;
  tr.innerHTML = `
    <td style="font-family:var(--font-display);font-weight:600">${escHtml(task.title)}</td>
    <td style="color:var(--text-2);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(task.description || '—')}</td>
    <td><span class="priority-badge priority-${task.priority}">${task.priority}</span></td>
    <td><span class="status-badge status-${task.status}">${task.status.replace('_',' ')}</span></td>
    <td style="color:var(--text-3)">${formatDate(task.created_at)}</td>
    <td>
      <div class="table-actions">
        ${nextLabel ? `<button class="card-btn next" data-action="next" data-id="${task.id}">${nextLabel}</button>` : ''}
        <button class="card-btn edit"   data-action="edit"   data-id="${task.id}">Edit</button>
        <button class="card-btn delete" data-action="delete" data-id="${task.id}" data-title="${escHtml(task.title)}">Del</button>
      </div>
    </td>`;
  return tr;
}

function renderBoard(tasks) {
  const groups = { TODO: [], IN_PROGRESS: [], DONE: [] };
  tasks.forEach(t => (groups[t.status] || groups.TODO).push(t));
  dom.tasksTodo.innerHTML = dom.tasksInprogress.innerHTML = dom.tasksDone.innerHTML = '';
  groups.TODO.forEach(t        => dom.tasksTodo.appendChild(buildCard(t)));
  groups.IN_PROGRESS.forEach(t => dom.tasksInprogress.appendChild(buildCard(t)));
  groups.DONE.forEach(t        => dom.tasksDone.appendChild(buildCard(t)));
  dom.countTodo.textContent       = groups.TODO.length;
  dom.countInprogress.textContent = groups.IN_PROGRESS.length;
  dom.countDone.textContent       = groups.DONE.length;
}

function renderList(tasks) {
  dom.taskTableBody.innerHTML = '';
  tasks.forEach(t => dom.taskTableBody.appendChild(buildTableRow(t)));
}

function renderTasks() {
  const tasks = getFilteredTasks();
  const empty = tasks.length === 0;
  if (state.viewMode === 'board') {
    dom.boardView.classList.toggle('hidden', empty);
    dom.listView.classList.add('hidden');
    dom.emptyState.classList.toggle('hidden', !empty);
    if (!empty) renderBoard(tasks);
  } else {
    dom.listView.classList.toggle('hidden', empty);
    dom.boardView.classList.add('hidden');
    dom.emptyState.classList.toggle('hidden', !empty);
    if (!empty) renderList(tasks);
  }
}

function getFilteredTasks() {
  const q = state.searchQuery.toLowerCase();
  return state.tasks.filter(t => {
    if (state.filterStatus   && t.status   !== state.filterStatus)   return false;
    if (state.filterPriority && t.priority !== state.filterPriority) return false;
    if (q && !t.title.toLowerCase().includes(q) && !(t.description || '').toLowerCase().includes(q)) return false;
    return true;
  });
}

// ── Data loading ──────────────────────────────────────────────────────────────
async function loadTasks() {
  try {
    const res   = await API.getTasks();
    state.tasks = res.data; // Week 4 layered: { success, data: Task[], count }
    renderTasks();
    renderStats();
  } catch (err) {
    toast(`Failed to load tasks: ${err.message}`, 'error');
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function openModal(task = null) {
  dom.formError.classList.add('hidden');
  dom.formError.textContent = '';
  if (task) {
    dom.modalTitle.textContent = 'Edit Task';
    dom.taskId.value = task.id; dom.taskTitle.value = task.title;
    dom.taskDesc.value = task.description || '';
    dom.taskStatus.value = task.status; dom.taskPriority.value = task.priority;
  } else {
    dom.modalTitle.textContent = 'New Task';
    dom.taskId.value = dom.taskTitle.value = dom.taskDesc.value = '';
    dom.taskStatus.value = 'TODO'; dom.taskPriority.value = 'MEDIUM';
  }
  dom.modalBackdrop.classList.remove('hidden');
  setTimeout(() => dom.taskTitle.focus(), 80);
}
function closeModal() { dom.modalBackdrop.classList.add('hidden'); }

async function saveTask() {
  const title = dom.taskTitle.value.trim();
  const id    = dom.taskId.value;
  if (!title) {
    dom.formError.textContent = 'Title is required.';
    dom.formError.classList.remove('hidden');
    dom.taskTitle.focus();
    return;
  }
  dom.btnSave.disabled = true;
  dom.btnSave.textContent = 'Saving…';
  try {
    const payload = {
      title, description: dom.taskDesc.value.trim(),
      status: dom.taskStatus.value, priority: dom.taskPriority.value,
    };
    if (id) {
      const res = await API.updateTask(id, payload);
      state.tasks = state.tasks.map(t => t.id == id ? res.data : t);
      toast('Task updated', 'success');
    } else {
      const res = await API.createTask(payload);
      state.tasks.unshift(res.data);
      toast('Task created', 'success');
    }
    closeModal(); renderTasks(); renderStats();
  } catch (err) {
    dom.formError.textContent = err.message;
    dom.formError.classList.remove('hidden');
  } finally {
    dom.btnSave.disabled = false;
    dom.btnSave.textContent = 'Save Task';
  }
}

// ── Confirm delete ────────────────────────────────────────────────────────────
function openConfirm(id, title) {
  state.pendingDeleteId = id;
  dom.confirmTaskName.textContent = `"${title}"`;
  dom.confirmBackdrop.classList.remove('hidden');
}
function closeConfirm() {
  dom.confirmBackdrop.classList.add('hidden');
  state.pendingDeleteId = null;
}
async function doDelete() {
  const id = state.pendingDeleteId;
  if (!id) return;
  try {
    await API.deleteTask(id);
    state.tasks = state.tasks.filter(t => t.id != id);
    closeConfirm(); renderTasks(); renderStats();
    toast('Task deleted', 'success');
  } catch (err) {
    toast(`Delete failed: ${err.message}`, 'error');
    closeConfirm();
  }
}

// ── Status advance (Week 4: PATCH /next-status) ───────────────────────────────
async function advanceStatus(id) {
  try {
    const res = await API.nextStatus(id); // returns { success, data: Task }
    state.tasks = state.tasks.map(t => t.id == id ? res.data : t);
    renderTasks(); renderStats();
    toast(`Moved to ${res.data.status.replace('_', ' ')}`, 'success');
  } catch (err) {
    toast(`Failed: ${err.message}`, 'error');
  }
}

// ── Event wiring ──────────────────────────────────────────────────────────────
function bindEvents() {
  dom.btnNewTask.addEventListener('click', () => openModal());
  dom.modalClose.addEventListener('click', closeModal);
  dom.btnCancel.addEventListener('click', closeModal);
  dom.modalBackdrop.addEventListener('click', e => { if (e.target === dom.modalBackdrop) closeModal(); });
  dom.btnSave.addEventListener('click', saveTask);
  dom.taskTitle.addEventListener('keydown', e => { if (e.key === 'Enter') saveTask(); });
  dom.confirmCancel.addEventListener('click', closeConfirm);
  dom.confirmDelete.addEventListener('click', doDelete);
  dom.confirmBackdrop.addEventListener('click', e => { if (e.target === dom.confirmBackdrop) closeConfirm(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeConfirm(); } });

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id, title } = btn.dataset;
    if (action === 'edit')   { const task = state.tasks.find(t => t.id == id); if (task) openModal(task); }
    if (action === 'delete') { openConfirm(id, title); }
    if (action === 'next')   { await advanceStatus(id); }
  });

  let searchDebounce;
  dom.searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => { state.searchQuery = dom.searchInput.value.trim(); renderTasks(); }, 200);
  });

  dom.filterStatus.querySelectorAll('.seg').forEach(btn => {
    btn.addEventListener('click', () => {
      dom.filterStatus.querySelectorAll('.seg').forEach(b => b.classList.remove('active'));
      btn.classList.add('active'); state.filterStatus = btn.dataset.value; renderTasks();
    });
  });
  dom.filterPriority.querySelectorAll('.seg').forEach(btn => {
    btn.addEventListener('click', () => {
      dom.filterPriority.querySelectorAll('.seg').forEach(b => b.classList.remove('active'));
      btn.classList.add('active'); state.filterPriority = btn.dataset.value; renderTasks();
    });
  });
  dom.viewBoard.addEventListener('click', () => {
    state.viewMode = 'board';
    dom.viewBoard.classList.add('active'); dom.viewList.classList.remove('active'); renderTasks();
  });
  dom.viewList.addEventListener('click', () => {
    state.viewMode = 'list';
    dom.viewList.classList.add('active'); dom.viewBoard.classList.remove('active'); renderTasks();
  });
}

// ── Sanitize ──────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ── Dark Mode Toggle ──────────────────────────────────────────────────────────
(function initTheme() {
  const btn = document.getElementById('btnTheme');
  if (!btn) return;
  const applyTheme = (dark) => {
    document.body.classList.toggle('dark', dark);
    btn.textContent = dark ? '☀️' : '🌙';
    btn.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
  };
  const saved = localStorage.getItem('theme');
  applyTheme(saved === 'dark');
  btn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    applyTheme(!isDark);
  });
})();

// ── Init ──────────────────────────────────────────────────────────────────────
(async function init() {
  bindEvents();
  await loadTasks();
  console.log('✅ TaskBoard Week 4 (Layered) initialized');
})();
