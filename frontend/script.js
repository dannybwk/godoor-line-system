// script.js

const API_BASE = 'https://script.google.com/macros/s/AKfycbwzd92TWf8P7jh--pkeeTc7SorLsHppVOpwisTZTShCmQ3slVtTamZquHldG4VH0Y-LVA/exec';

async function fetchEvents() {
  try {
    const response = await fetch(`${API_BASE}`);
    const result = await response.json();
    const data = result.events || [];

    renderCalendar(data);
    renderEventList(data);
  } catch (error) {
    console.error('無法讀取活動資料', error);
  }
}

function renderCalendar(events) {
  const calendarDiv = document.getElementById('calendar');
  calendarDiv.innerHTML = '';

  const groupedByDate = {};
  events.forEach(event => {
    const date = event['活動日期'];
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push(event);
  });

  for (const date in groupedByDate) {
    const dayBlock = document.createElement('div');
    dayBlock.style.border = '1px solid #ccc';
    dayBlock.style.padding = '12px';
    dayBlock.style.marginBottom = '8px';
    dayBlock.style.backgroundColor = '#fff';

    const title = document.createElement('h3');
    title.textContent = `📅 ${date}`;
    dayBlock.appendChild(title);

    groupedByDate[date].forEach(event => {
      const info = document.createElement('div');
      const id = event['活動ID'];
      const title = (event['活動標題'] || '').slice(0, 8);
      const teacher = (event['講師'] || '').slice(0, 5);
      info.textContent = `#${id}｜${title}｜${teacher}`;
      dayBlock.appendChild(info);
    });

    calendarDiv.appendChild(dayBlock);
  }
}

function renderEventList(events) {
  const listDiv = document.getElementById('courseList');
  listDiv.innerHTML = '';

  events.forEach(event => {
    const block = document.createElement('div');
    block.style.borderBottom = '1px solid #ddd';
    block.style.padding = '8px 0';

    const id = event['活動ID'];
    const title = event['活動標題'];
    const teacher = event['講師'];
    const desc = (event['活動內容或備註'] || '').slice(0, 30);

    block.innerHTML = `<strong>#${id}｜${title}｜${teacher}</strong><br/><small>${desc}</small>`;
    listDiv.appendChild(block);
  });
}

document.addEventListener('DOMContentLoaded', fetchEvents);
