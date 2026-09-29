const STORAGE_KEY = 'next-class-reminders-v1';

const $ = (selector) => document.querySelector(selector);
const dateOnly = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const dateKey = (date) => {
  const d = dateOnly(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const fromKey = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (date, days) => { const next = new Date(date); next.setDate(next.getDate() + days); return next; };
const prettyDate = (date, options = { month: 'short', day: 'numeric' }) => date.toLocaleDateString(undefined, options);
const longDate = (date) => date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

let reminders = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
const today = dateOnly(new Date());

function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders)); }

function renderNote(note, variant = 'last-week') {
  const course = note.course ? `<span class="course-name">${escapeHtml(note.course)}</span>` : '<span class="course-name">Class reminder</span>';
  if (variant === 'upcoming') {
    return `<article class="upcoming-item"><button class="delete-button" type="button" data-delete="${note.id}" aria-label="Delete reminder">×</button><div class="upcoming-date">${prettyDate(fromKey(note.classDate), { weekday: 'short', month: 'short', day: 'numeric' })}</div>${course}<p class="note-text">${escapeHtml(note.text)}</p></article>`;
  }
  return `<article class="note-card"><div class="note-card-top">${course}<span class="note-meta">saved ${prettyDate(new Date(note.createdAt), { month: 'short', day: 'numeric' })}</span></div><p class="note-text">${escapeHtml(note.text)}</p></article>`;
}

function escapeHtml(value) { return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }

function render() {
  const lastWeekKey = dateKey(addDays(today, -7));
  const lastWeek = reminders.filter((note) => note.classDate === lastWeekKey);
  const upcoming = reminders.filter((note) => note.classDate >= dateKey(today)).sort((a, b) => a.classDate.localeCompare(b.classDate));
  $('#todayLabel').textContent = longDate(today);
  $('#lastWeekLabel').textContent = prettyDate(fromKey(lastWeekKey), { month: 'short', day: 'numeric' });
  $('#lastWeekNotes').innerHTML = lastWeek.length ? lastWeek.map((note) => renderNote(note)).join('') : `<div class="empty-state"><div><strong>No notes from last week.</strong>Your future self will thank you for leaving one today.</div></div>`;
  $('#upcomingCount').textContent = `${upcoming.length} ${upcoming.length === 1 ? 'note' : 'notes'}`;
  $('#upcomingNotes').innerHTML = upcoming.length ? upcoming.map((note) => renderNote(note, 'upcoming')).join('') : '<p class="no-upcoming">Nothing scheduled yet. Add your first reminder above.</p>';
  document.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => {
    reminders = reminders.filter((note) => note.id !== button.dataset.delete);
    persist(); render();
  }));
}

$('#classDate').value = dateKey(addDays(today, 7));
$('#noteForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  reminders.push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, course: form.get('course').trim(), classDate: form.get('classDate'), text: form.get('note').trim(), createdAt: new Date().toISOString() });
  persist(); render(); event.currentTarget.reset(); $('#classDate').value = dateKey(addDays(today, 7));
  $('#saveConfirmation').textContent = 'Reminder saved for your future self ✓';
  setTimeout(() => { $('#saveConfirmation').textContent = ''; }, 3500);
});

render();
