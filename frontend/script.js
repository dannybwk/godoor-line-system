// script.js

let selectedEventIds = [];

function loadEvents() {
  fetch(CONFIG.API_BASE + '/getEvents')
    .then((res) => res.json())
    .then((data) => {
      const calendar = document.getElementById('calendar');
      data.forEach((event) => {
        const div = document.createElement('div');
        div.className = 'event';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = event.id;
        checkbox.onchange = (e) => {
          if (e.target.checked) {
            selectedEventIds.push(event.id);
          } else {
            selectedEventIds = selectedEventIds.filter((id) => id !== event.id);
          }
        };

        const info = document.createElement('span');
        info.textContent = `${event.title}｜${event.teacher}｜${event.startTime}`;

        div.appendChild(checkbox);
        div.appendChild(info);
        calendar.appendChild(div);
      });
    });
}

function renderCustomFields(fields) {
  const customFieldsDiv = document.getElementById('custom-fields');
  customFieldsDiv.innerHTML = '';
  fields.forEach((q) => {
    const label = document.createElement('label');
    label.textContent = q.label;
    customFieldsDiv.appendChild(label);

    if (q.type === 'text') {
      const input = document.createElement('input');
      input.name = q.label;
      customFieldsDiv.appendChild(input);
    } else if (q.type === 'radio') {
      q.options.forEach((opt) => {
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = q.label;
        radio.value = opt;
        customFieldsDiv.appendChild(radio);
        customFieldsDiv.appendChild(document.createTextNode(opt));
      });
    }
  });
}

function submitForm() {
  const formData = {
    name: document.getElementById('name').value,
    lineName: document.getElementById('lineName').value,
    lineId: liff.getDecodedIDToken().sub,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    note: document.getElementById('note').value,
    eventIds: selectedEventIds,
    customAnswers: {},
  };

  document.querySelectorAll('#custom-fields input').forEach((el) => {
    if (el.type === 'radio' && !el.checked) return;
    formData.customAnswers[el.name] = el.value;
  });

  fetch(CONFIG.API_BASE + '/submitRegistration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  })
    .then((res) => res.json())
    .then((resp) => {
      alert('報名成功！');
    });
}

document.addEventListener('DOMContentLoaded', async () => {
  await liff.init({ liffId: CONFIG.LIFF_ID });
  if (!liff.isLoggedIn()) liff.login();
  loadEvents();
});
