const defaultState = { goalName: 'New video game', goal: 50, saved: 21, deadline: '', spendable: 14, streak: 4, history: [
  { name: 'Weekly allowance', detail: 'Today · earned', amount: 6, icon: '🪙', type: 'earned' },
  { name: 'Snack at school', detail: 'Yesterday · spent', amount: -2, icon: '🍪', type: 'spent' },
  { name: 'Chore money', detail: 'Oct 18 · earned', amount: 8, icon: '🧹', type: 'earned' },
  { name: 'Birthday money', detail: 'Oct 12 · earned', amount: 9, icon: '🎁', type: 'earned' }
]};
let state = JSON.parse(localStorage.getItem('save-sprout-state') || 'null') || defaultState;
const $ = selector => document.querySelector(selector);
const money = amount => `$${Math.abs(amount).toFixed(2)}`;
const save = () => localStorage.setItem('save-sprout-state', JSON.stringify(state));

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
  const percent = Math.min(100, Math.round((state.saved / state.goal) * 100));
  const remaining = Math.max(0, state.goal - state.saved);
  const level = percent >= 90 ? 4 : percent >= 65 ? 3 : percent >= 30 ? 2 : 1;
  $('#goal-name').textContent = state.goalName; $('#goal-amount').textContent = money(state.goal).replace('.00','');
  $('#saved-amount').textContent = money(state.saved).replace('.00',''); $('#goal-percent').textContent = `${percent}%`;
  $('#goal-bar').style.width = `${percent}%`; $('#goal-remaining').textContent = remaining ? `${money(remaining).replace('.00','')} left to grow` : 'Goal reached! Time to celebrate!';
  $('#goal-deadline').textContent = daysUntil(state.deadline); $('#total-saved').textContent = money(state.saved);
  $('#spendable').textContent = money(state.spendable); $('#pet-level').textContent = level; $('#streak-count').textContent = state.streak;
  const nextUnlock = level >= 4 ? ['Sparkle crown', 'You unlocked everything!'] : level === 3 ? ['Rainbow hat', `${money(Math.max(0, state.goal * .9 - state.saved)).replace('.00','')} more to unlock`] : level === 2 ? ['Flower crown', `${money(Math.max(0, state.goal * .65 - state.saved)).replace('.00','')} more to unlock`] : ['Leafy bow', `${money(Math.max(0, state.goal * .3 - state.saved)).replace('.00','')} more to unlock`];
  $('#next-unlock').textContent = nextUnlock[0]; $('#unlock-subtitle').textContent = nextUnlock[1];
  $('#pet-message').textContent = percent >= 90 ? 'Sprig is ready to celebrate!' : percent >= 65 ? 'Sprig found a rainbow!' : percent >= 30 ? 'Sprig is growing strong!' : 'Sprig is feeling sunny!';
  $('#pet-accessory').textContent = level >= 4 ? '👑' : level === 3 ? '🌈' : level === 2 ? '✿' : '🍃';
  renderHistory(); save();
}
render();

const backdrop = $('#modal-backdrop');
function openModal(which) {
  backdrop.hidden = false; backdrop.dataset.mode = which;
  $('#money-form').hidden = which !== 'money'; $('#goal-form').hidden = which !== 'goal';
  $('#modal-emoji').textContent = which === 'goal' ? '🌱' : '🪙'; $('#modal-title').textContent = which === 'goal' ? 'Plant a new goal' : 'Log some money';
  $('#modal-copy').textContent = which === 'goal' ? 'What would make you do a happy dance?' : 'Tell us about your latest money move.';
  (which === 'goal' ? $('#new-goal-name') : $('#item-name')).focus();
}
document.querySelectorAll('[data-modal]').forEach(button => button.addEventListener('click', () => openModal(button.dataset.modal)));
$('.modal-close').addEventListener('click', () => backdrop.hidden = true); backdrop.addEventListener('click', event => { if (event.target === backdrop) backdrop.hidden = true; });
$('#money-form').addEventListener('submit', event => { event.preventDefault(); const amount = Number($('#item-amount').value); const earned = $('#item-type').value === 'earned'; if (!amount) return; state.history.unshift({ name: $('#item-name').value.trim() || (earned ? 'Money earned' : 'Money spent'), detail: 'Just now · ' + (earned ? 'earned' : 'spent'), amount: earned ? amount : -amount, icon: earned ? '🪙' : '🍪', type: earned ? 'earned' : 'spent' }); if (earned) { state.saved += amount; state.spendable += amount; state.streak += 1; } else state.spendable = Math.max(0, state.spendable - amount); render(); event.target.reset(); backdrop.hidden = true; });
$('#goal-form').addEventListener('submit', event => { event.preventDefault(); state.goalName = $('#new-goal-name').value.trim() || 'My new goal'; state.goal = Number($('#new-goal-amount').value) || 50; state.deadline = $('#new-goal-date').value; state.saved = 0; render(); event.target.reset(); backdrop.hidden = true; });
$('#filter-button').addEventListener('click', () => { $('#filter-button').textContent = $('#filter-button').textContent.startsWith('All') ? 'This month⌄' : 'All time⌄'; });
