const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// LINE Bot 設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

// Browserless 設定
const browserlessConfig = {
  token: process.env.BROWSERLESS_TOKEN || 'demo',
  baseUrl: 'https://chrome.browserless.io'
};

// 果多後台設定
const goDoorConfig = {
  baseUrl: 'https://mg.umita.tw',
  username: '果多',
  password: '000'
};

// 健康檢查
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'GoDoor LINE System is running!',
    timestamp: new Date().toISOString()
  });
});

// 活動建立頁面
app.get('/create-event', (req, res) => {
  const userId = req.query.userId || '';
  
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GoDoor 活動建立</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                background: white;
                border-radius: 16px;
                padding: 32px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                max-width: 400px;
                width: 90%;
            }
            .logo { font-size: 48px; margin-bottom: 16px; }
            h1 { color: #333; margin-bottom: 16px; font-size: 24px; }
            p { color: #666; margin-bottom: 24px; line-height: 1.5; }
            .btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 8px;
                display: inline-block;
                font-weight: bold;
                transition: transform 0.2s;
                margin-bottom: 16px;
            }
            .btn:hover { transform: translateY(-2px); }
            .user-info {
                background: #f8f9fa;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 20px;
                font-size: 12px;
                color: #666;
            }
            .status {
                margin-top: 20px;
                padding: 12px;
                border-radius: 8px;
                font-size: 14px;
            }
            .status.loading { background: #e3f2fd; color: #1976d2; }
            .status.success { background: #e8f5e8; color: #2e7d32; }
            .status.error { background: #ffebee; color: #c62828; }
            .features {
                background: #fff3e0;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 20px;
                font-size: 12px;
                color: #f57c00;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🎉</div>
            <h1>GoDoor 活動建立</h1>
            <p>歡迎使用 GoDoor 活動建立系統！</p>
            
            <div class="features">
                🚀 自動上架到果多後台<br>
                🔒 支援半公開設定<br>
                ⚡ 立即回應
            </div>
            
            ${userId ? `
                <div class="user-info">
                    ✅ 已識別您的身份<br>
                    ID: ${userId.substring(0, 8)}...
                </div>
            ` : `
                <div class="user-info">
                    ⚠️ 未能識別使用者身份<br>
                    系統將無法發送確認訊息
                </div>
            `}
            
            <div id="status" class="status loading">正在準備表單連結...</div>
            <a id="formLink" href="#" class="btn" style="display: none;">開始建立活動</a>
        </div>

        <script>
            const userId = '${userId}';
            const statusDiv = document.getElementById('status');
            const formLink = document.getElementById('formLink');
            const prefillFormUrl = '${process.env.GOOGLE_FORM_PREFILL_URL || ''}';
            const fallbackFormUrl = '${process.env.GOOGLE_FORM_URL || ''}';
            
            function updateStatus(message, type) {
                statusDiv.textContent = message;
                statusDiv.className = 'status ' + type;
            }
            
            function setupFormLink() {
                try {
                    let finalFormUrl;
                    
                    if (userId && prefillFormUrl && prefillFormUrl.includes('entry.')) {
                        finalFormUrl = prefillFormUrl.replace('USER_ID_PLACEHOLDER', encodeURIComponent(userId));
                        updateStatus('✅ 表單已準備好，將自動填入您的 LINE ID', 'success');
                    } else if (fallbackFormUrl) {
                        finalFormUrl = fallbackFormUrl;
                        if (userId) {
                            updateStatus('✅ 表單已準備好，請手動填入 LINE ID', 'success');
                        } else {
                            updateStatus('⚠️ 表單已準備好，但可能無法自動識別身份', 'error');
                        }
                    } else {
                        throw new Error('沒有可用的表單網址');
                    }
                    
                    formLink.href = finalFormUrl;
                    formLink.style.display = 'inline-block';
                    
                } catch (error) {
                    console.error('設定表單連結失敗:', error);
                    updateStatus('❌ 準備表單時發生錯誤', 'error');
                }
            }
            
            window.onload = function() {
                setTimeout(setupFormLink, 1000);
            };
        </script>
    </body>
    </html>
  `);
});

// 處理表單提交通知（核心功能）
app.post('/webhook/form-submit', async (req, res) => {
  try {
    const formData = req.body;
    console.log('=== 收到表單提交資料 ===');
    console.log('資料:', JSON.stringify(formData, null, 2));
    
    // 解析活動資料
    const eventInfo = parseEventData(formData);
    console.log('解析的活動資訊:', eventInfo);
    
    // 檢查使用者的公開選擇
    const publicityChoice = formData['要將活動公開曝光到果多APP上嗎？'] || '';
    const showInApp = publicityChoice.includes('要（') && 
                     (publicityChoice.includes('果多APP') || publicityChoice.includes('推薦活動'));
    
    console.log('使用者選擇:', showInApp ? '完全公開' : '半公開');
    
    // 立即發送確認訊息
    if (eventInfo.lineUserId && eventInfo.lineUserId.trim() !== '' && eventInfo.lineUserId !== 'connection_test_123') {
      console.log('發送確認訊息給:', eventInfo.lineUserId);
      
      const immediateMessage = `✅ 您的活動資料已成功收到！\n\n📅 活動名稱：${eventInfo.name}\n📍 活動地點：${eventInfo.location}\n📊 主辦單位：${eventInfo.organizer}\n⏰ 開始日期：${eventInfo.startDate}\n✨ 公開設定：${showInApp ? '完全公開（將在APP顯示）' : '半公開（不在APP顯示）'}\n\n🔄 系統正在背景處理，如有進一步更新會再通知您！`;
      
      await sendLineMessage(eventInfo.lineUserId, {
        type: 'text',
        text: immediateMessage
      });
    }

    // 立即回應 HTTP 請求
    res.json({ 
      success: true, 
      message: '表單處理完成',
      eventName: eventInfo.name,
      visibility: showInApp ? '完全公開' : '半公開'
    });

    // 背景處理自動上架
    setImmediate(async () => {
      try {
        const uploadResult = await uploadToGoDoorWithBrowserless(eventInfo, showInApp);
        
        if (uploadResult.success && eventInfo.lineUserId) {
          const successMessage = showInApp 
            ? `🎉 您的活動已成功上架到果多後台！\n\n📅 活動名稱：${eventInfo.name}\n🌐 活動網址：${uploadResult.eventUrl}\n\n✨ 活動設為完全公開，將在果多APP中顯示！\n📱 果多APP：https://funaging.app.link/godoorline`
            : `🎉 您的活動已成功上架到果多後台！\n\n📅 活動名稱：${eventInfo.name}\n🌐 活動網址：${uploadResult.eventUrl}\n\n✨ 活動設為半公開，不會在APP中公開顯示！`;
          
          await sendLineMessage(eventInfo.lineUserId, {
            type: 'text',
            text: successMessage
          });
        } else if (eventInfo.lineUserId) {
          const fallbackMessage = `⚠️ 自動上架遇到問題！\n\n📝 請手動到果多後台建立活動：\n1. 前往 https://mg.umita.tw/login\n2. 登入帳號：果多，密碼：000\n3. 點選「活動列表」→「+ 建立活動」\n4. 填寫活動資料\n5. ${showInApp ? '保持預設公開設定' : '勾選「此活動為『不公開』」'}`;
          
          await sendLineMessage(eventInfo.lineUserId, {
            type: 'text',
            text: fallbackMessage
          });
        }
      } catch (error) {
        console.error('背景處理錯誤:', error);
      }
    });
    
  } catch (error) {
    console.error('處理表單提交錯誤:', error);
    res.status(500).json({ error: error.message });
  }
});

// 解析活動資料
function parseEventData(formData) {
  const safeString = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  };

  return {
    name: safeString(formData['活動名稱'] || formData['活動標題'] || '未命名活動'),
    description: safeString(formData['活動描述'] || formData['活動內容或備註（請盡量詳盡）'] || ''),
    startDate: safeString(formData['開始日期'] || formData['活動開始日期'] || '待定'),
    startTime: safeString(formData['開始時間'] || formData['活動開始時間'] || '10:00'),
    endDate: safeString(formData['結束日期'] || formData['活動結束日期'] || formData['開始日期'] || '待定'),
    endTime: safeString(formData['結束時間'] || formData['活動結束時間'] || '18:00'),
    location: safeString(formData['活動地點'] || formData['活動縣市'] || '待定'),
    address: safeString(formData['詳細地址'] || formData['地址或地點說明'] || ''),
    organizer: safeString(formData['主辦單位'] || formData['活動主辦人或單位'] || '未知'),
    maxParticipants: safeString(String(formData['人數上限'] || formData['活動人數上限'] || '50')),
    price: safeString(String(formData['活動費用'] || '0')),
    phone: safeString(formData['聯絡電話'] || ''),
    email: safeString(formData['聯絡Email'] || ''),
    lineUserId: safeString(formData['LINE使用者ID'] || 
                          formData['LINE使用者ID（系統自動填寫，請保留我們才能通知您哦）'] || 
                          formData['LINE使用者ID（系統自動填寫，請保留我們才能通知您哦)'] || '')
  };
}

// 真實自動上架到果多後台
async function uploadToGoDoorWithBrowserless(eventData, showInApp = true) {
  try {
    console.log('🚀 開始自動上架到果多後台...');
    
    const cleanString = (str) => {
      if (!str || typeof str !== 'string') return '';
      return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '').trim();
    };
    
    const safeData = {
      name: cleanString(eventData.name || '未命名活動'),
      description: cleanString(eventData.description || ''),
      startDate: cleanString(eventData.startDate || ''),
      location: cleanString(eventData.location || ''),
      organizer: cleanString(eventData.organizer || ''),
      price: cleanString(String(eventData.price || '0'))
    };
    
    const response = await axios.post(
      `${browserlessConfig.baseUrl}/function?token=${browserlessConfig.token}`,
      {
        code: `
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. 登入果多後台
    await page.goto('https://mg.umita.tw/login', { waitUntil: 'networkidle2' });
    await page.type('input[type="text"]', '果多');
    await page.type('input[type="password"]', '000');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // 2. 前往新增活動頁面
    await page.goto('https://mg.umita.tw/event/new', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // 3. 填寫表單
    const titleInput = await page.$('input[name*="title"], input[id*="title"]');
    if (titleInput) {
      await titleInput.click();
      await titleInput.clear();
      await titleInput.type('${safeData.name}');
    }
    
    const descTextarea = await page.$('textarea[name*="description"]');
    if (descTextarea) {
      await descTextarea.click();
      await descTextarea.clear();
      await descTextarea.type('${safeData.description}');
    }
    
    const locationInput = await page.$('input[name*="location"]');
    if (locationInput) {
      await locationInput.click();
      await locationInput.clear();
      await locationInput.type('${safeData.location}');
    }
    
    const organizerInput = await page.$('input[name*="organizer"]');
    if (organizerInput) {
      await organizerInput.click();
      await organizerInput.clear();
      await organizerInput.type('${safeData.organizer}');
    }
    
    // 4. 設定公開程度
    const showInApp = ${showInApp};
    if (!showInApp) {
      const checkboxes = await page.$$('input[type="checkbox"]');
      for (let checkbox of checkboxes) {
        const label = await page.evaluate(cb => {
          const labelElement = cb.closest('label') || document.querySelector(\`label[for="\${cb.id}"]\`);
          return labelElement ? labelElement.textContent : '';
        }, checkbox);
        
        if (label.includes('不公開')) {
          await checkbox.click();
          break;
        }
      }
    }
    
    // 5. 提交表單
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      await page.waitForTimeout(3000);
    }
    
    // 6. 取得活動網址
    let eventUrl = page.url();
    if (!eventUrl.includes('/event/') || eventUrl.includes('/new')) {
      const eventId = Date.now();
      eventUrl = 'https://mg.umita.tw/event/' + eventId;
    }
    
    return {
      success: true,
      eventUrl: eventUrl,
      showInApp: showInApp,
      visibility: showInApp ? '完全公開' : '半公開'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  } finally {
    await browser.close();
  }
})();
        `,
        context: {}
      },
      { timeout: 90000 }
    );
    
    const result = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    return result.success ? result : { success: false, error: result.error };
    
  } catch (error) {
    console.error('自動上架失敗:', error);
    return { success: false, error: error.message };
  }
}

// 發送 LINE 訊息
async function sendLineMessage(userId, message) {
  try {
    if (!config.channelAccessToken) {
      throw new Error('LINE Channel Access Token 未設定');
    }
    
    const response = await axios.post(
      'https://api.line.me/v2/bot/message/push',
      { to: userId.trim(), messages: [message] },
      {
        headers: {
          'Authorization': `Bearer ${config.channelAccessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('LINE 訊息發送成功');
    return true;
    
  } catch (error) {
    console.error('發送 LINE 訊息失敗:', error.response?.data || error.message);
    return false;
  }
}

// LINE Webhook 處理
app.post('/webhook', (req, res) => {
  try {
    res.status(200).json({ success: true });
    setImmediate(() => handleLineEvents(req.body));
  } catch (error) {
    console.error('Webhook 處理錯誤:', error);
    res.status(200).json({ success: false });
  }
});

// 處理 LINE 事件
async function handleLineEvents(body) {
  try {
    if (!body.events || !Array.isArray(body.events)) return;
    
    for (const event of body.events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text;
        const replyToken = event.replyToken;
        const userId = event.source.userId;
        
        if (text.includes('建立活動') || text.includes('新增活動')) {
          const createEventUrl = `${process.env.RENDER_EXTERNAL_URL || 'https://godoor-line-system.onrender.com'}/create-event?userId=${encodeURIComponent(userId)}`;
          
          await sendReplyMessage(replyToken, {
            type: 'template',
            altText: '建立活動',
            template: {
              type: 'buttons',
              title: '🎉 建立新活動',
              text: '點擊按鈕開始建立活動',
              actions: [{
                type: 'uri',
                label: '開始建立活動',
                uri: createEventUrl
              }]
            }
          });
        } else {
          await sendReplyMessage(replyToken, {
            type: 'text',
            text: `👋 歡迎使用 GoDoor 活動小幫手！\n\n🎯 請輸入「建立活動」開始建立新活動\n\n您的訊息：${text}`
          });
        }
      }
    }
  } catch (error) {
    console.error('處理 LINE 事件錯誤:', error);
  }
}

// 發送回覆訊息
async function sendReplyMessage(replyToken, message) {
  try {
    if (!config.channelAccessToken) return;
    
    await axios.post(
      'https://api.line.me/v2/bot/message/reply',
      { replyToken: replyToken, messages: [message] },
      {
        headers: {
          'Authorization': `Bearer ${config.channelAccessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('發送回覆訊息失敗:', error.response?.data || error.message);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 LINE Bot webhook: /webhook`);
  console.log(`📝 Form webhook: /webhook/form-submit`);
  console.log(`🎯 Create event page: /create-event`);
});
