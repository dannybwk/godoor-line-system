// script.js

let allEvents = [];
let userProfile = {};

async function init() {
  await liff.init({ liffId: LIFF_ID });
  if (!liff.isLoggedIn()) liff.login();
  else {
    const profile = await liff.getProfile();
    userProfile = {
      name: profile.displayName,
      lineId: liff.getContext()?.userId || profile.userId,
    };
    document.querySelector('input[name="LINE的名字"]').value = userProfile.name;
    loadEvents();
  }
}

async function loadEvents() {
  const res = await fetch(`${API_BASE}/getEvents`);
  const events = await res.json();
  allEvents = events;
  renderCalendar(events);
  renderCourseList(events);
}

function renderCalendar(events) {
  const calendarEl = document.getElementById('calendar');
  calendarEl.innerHTML = '';

  const daysInMonth = 31;
  for (let i = 1; i <= daysInMonth; i++) {
    const dayBox = document.createElement('div');
    dayBox.className = 'calendar-day';
    dayBox.innerHTML = `<span>${i}</span>`;

    events.filter(e => parseInt(e.活動開始日期.slice(6, 8)) === i)
      .forEach(e => {
        const label = `${e.活動ID} ${e.活動標題.slice(0, 8)} ${e.活動主持人或單位.slice(0, 5)}`;
        const div = document.createElement('div');
        div.className = 'calendar-event';
        div.textContent = label;
        dayBox.appendChild(div);
      });

    calendarEl.appendChild(dayBox);
  }
}

function renderCourseList(events) {
  const listEl = document.getElementById('courseList');
  listEl.innerHTML = '';

  events.forEach(event => {
    const label = `${event.活動ID} ${event.活動標題} ${event.活動主持人或單位}`;
    const extra = event.活動內容或備註?.slice(0, 30) || '';
    const item = document.createElement('div');
    item.className = 'course-item';
    item.innerHTML = `
      <label>
        <input type="checkbox" name="selectedEvents" value="${event.活動ID}" />
        <strong>${label}</strong> - ${extra}
      </label>
    `;
    listEl.appendChild(item);
  });
}

// 表單送出邏輯
const form = document.getElementById('registrationForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const selected = [...formData.getAll('selectedEvents')];
  const payloads = selected.map(eventId => {
    const data = {
      姓名: formData.get('姓名'),
      LINE的名字: formData.get('LINE的名字'),
      LINE_ID: userProfile.lineId,
      電子郵件: formData.get('電子郵件'),
      手機號碼: formData.get('手機號碼'),
      備註: formData.get('備註'),
      活動ID: eventId,
    };
    return data;
  });

  for (let data of payloads) {
    await fetch(`${API_BASE}/submitRegistration`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  alert('報名成功！');
  location.reload();
});

window.onload = init;
