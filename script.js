const defaultState = {
  goalName: 'New video game', goal: 50, saved: 21, deadline: '', spendable: 14, streak: 4,
  history: [
    { name: 'Weekly allowance', detail: 'Today · earned', amount: 6, icon: '🪙', type: 'earned' },
    { name: 'Snack at school', detail: 'Yesterday · spent', amount: -2, icon: '🍪', type: 'spent' },
    { name: 'Chore money', detail: 'Oct 18 · earned', amount: 8, icon: '🧹', type: 'earned' },
    { name: 'Birthday money', detail: 'Oct 12 · earned', amount: 9, icon: '🎁', type: 'earned' }
  ]
};

const $ = selector => document.querySelector(selector);
const money = amount => `$${(Math.abs(toCents(amount)) / 100).toFixed(2)}`;
const toCents = amount => Math.round(Number(amount) * 100);
const fromCents = cents => cents / 100;
const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem('save-sprout-state') || 'null');
    if (!stored || typeof stored !== 'object') return { ...defaultState, history: [...defaultState.history] };
    return { ...defaultState, ...stored, history: Array.isArray(stored.history) ? stored.history : [...defaultState.history] };
  } catch {
    return { ...defaultState, history: [...defaultState.history] };
  }
}

let state = loadState();
const save = () => localStorage.setItem('save-sprout-state', JSON.stringify(state));

// Read money as integer cents so $0.10 + $0.20 is always exactly $0.30.
function parseMoneyCents(rawValue) {
  const value = String(rawValue ?? '').trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const cents = Number(whole) * 100 + Number((fraction + '00').slice(0, 2));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

function daysUntil(dateString) {
  if (!dateString) return 'Choose a date and keep going!';
  const target = new Date(`${dateString}T12:00:00`); const now = new Date();
  const days = Math.max(0, Math.ceil((target - now) / 86400000));
  return days === 0 ? 'Today is the big day!' : `Due in ${days} days · Keep going!`;
}

function renderHistory() {
  $('#history-list').innerHTML = state.history.map(item => `<div class="history-row"><div class="history-symbol ${item.type}">${item.icon}</div><div class="history-text"><b>${item.name}</b><span>${item.detail}</span></div><span class="history-amount ${item.type}-text">${item.amount > 0 ? '+' : '−'}${money(item.amount)}</span></div>`).join('');
}

function render() {
  const goalCents = toCents(state.goal); const savedCents = toCents(state.saved);
  const percent = goalCents > 0 ? Math.min(100, Math.round((savedCents / goalCents) * 100)) : 0;
  const remainingCents = Math.max(0, goalCents - savedCents);
  const level = percent >= 90 ? 4 : percent >= 65 ? 3 : percent >= 30 ? 2 : 1;
  $('#goal-name').textContent = state.goalName; $('#goal-amount').textContent = money(state.goal).replace('.00', '');
  $('#saved-amount').textContent = money(state.saved).replace('.00', ''); $('#goal-percent').textContent = `${percent}%`;
  $('#goal-bar').style.width = `${percent}%`; $('#goal-remaining').textContent = remainingCents ? `${money(fromCents(remainingCents)).replace('.00', '')} left to grow` : 'Goal reached! Time to celebrate!';
  $('#goal-deadline').textContent = daysUntil(state.deadline); $('#total-saved').textContent = money(state.saved);
  $('#spendable').textContent = money(state.spendable); $('#pet-level').textContent = level; $('#streak-count').textContent = state.streak;
  const nextUnlock = level >= 4 ? ['Sparkle crown', 'You unlocked everything!'] : level === 3 ? ['Rainbow hat', `${money(fromCents(Math.max(0, Math.round(goalCents * .9) - savedCents))).replace('.00', '')} more to unlock`] : level === 2 ? ['Flower crown', `${money(fromCents(Math.max(0, Math.round(goalCents * .65) - savedCents))).replace('.00', '')} more to unlock`] : ['Leafy bow', `${money(fromCents(Math.max(0, Math.round(goalCents * .3) - savedCents))).replace('.00', '')} more to unlock`];
  $('#next-unlock').textContent = nextUnlock[0]; $('#unlock-subtitle').textContent = nextUnlock[1];
  $('#pet-message').textContent = percent >= 90 ? 'Sprig is ready to celebrate!' : percent >= 65 ? 'Sprig found a rainbow!' : percent >= 30 ? 'Sprig is growing strong!' : 'Sprig is feeling sunny!';
  $('#pet-accessory').textContent = level >= 4 ? '👑' : level === 3 ? '🌈' : level === 2 ? '✿' : '🍃';
  renderHistory(); save();
}

render();
const backdrop = $('#modal-backdrop');
const deadlineInput = $('#new-goal-date');

function openModal(which) {
  backdrop.hidden = false; backdrop.dataset.mode = which;
  $('#money-form').hidden = which !== 'money'; $('#goal-form').hidden = which !== 'goal';
  $('#modal-emoji').textContent = which === 'goal' ? '🌱' : '🪙'; $('#modal-title').textContent = which === 'goal' ? 'Plant a new goal' : 'Log some money';
  $('#modal-copy').textContent = which === 'goal' ? 'What would make you do a happy dance?' : 'Tell us about your latest money move.';
  deadlineInput.min = todayISO();
  (which === 'goal' ? $('#new-goal-name') : $('#item-name')).focus();
}

function reject(field, message) {
  field.setCustomValidity(message); field.reportValidity();
  setTimeout(() => field.setCustomValidity(''), 100);
}

document.querySelectorAll('[data-modal]').forEach(button => button.addEventListener('click', () => openModal(button.dataset.modal)));
$('.modal-close').addEventListener('click', () => { backdrop.hidden = true; });
backdrop.addEventListener('click', event => { if (event.target === backdrop) backdrop.hidden = true; });

$('#money-form').addEventListener('submit', event => {
  event.preventDefault();
  const amountCents = parseMoneyCents($('#item-amount').value);
  const amountField = $('#item-amount');
  if (amountCents === null) return reject(amountField, 'Enter a positive amount using up to two decimal places.');
  const earned = $('#item-type').value === 'earned';
  const amount = fromCents(amountCents);
  state.history.unshift({ name: $('#item-name').value.trim() || (earned ? 'Money earned' : 'Money spent'), detail: 'Just now · ' + (earned ? 'earned' : 'spent'), amount: earned ? amount : -amount, icon: earned ? '🪙' : '🍪', type: earned ? 'earned' : 'spent' });
  if (earned) { state.saved = fromCents(toCents(state.saved) + amountCents); state.spendable = fromCents(toCents(state.spendable) + amountCents); state.streak += 1; }
  else state.spendable = fromCents(Math.max(0, toCents(state.spendable) - amountCents));
  render(); event.target.reset(); backdrop.hidden = true;
});

$('#goal-form').addEventListener('submit', event => {
  event.preventDefault();
  const amountCents = parseMoneyCents($('#new-goal-amount').value); const amountField = $('#new-goal-amount');
  if (amountCents === null) return reject(amountField, 'Enter a goal amount greater than zero.');
  const deadline = $('#new-goal-date').value;
  if (deadline && deadline < todayISO()) return reject(deadlineInput, 'Choose today or a future date.');
  state.goalName = $('#new-goal-name').value.trim() || 'My new goal'; state.goal = fromCents(amountCents); state.deadline = deadline; state.saved = 0;
  render(); event.target.reset(); backdrop.hidden = true;
});

$('#filter-button').addEventListener('click', () => { $('#filter-button').textContent = $('#filter-button').textContent.startsWith('All') ? 'This month⌄' : 'All time⌄'; });
