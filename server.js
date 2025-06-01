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

// Browserless 設定（免費額度每月 1000 次）
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

// 健康檢查（增加 LINE 設定檢查）
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'GoDoor LINE System with Auto Upload is running!',
    timestamp: new Date().toISOString(),
    config: {
      hasAccessToken: !!config.channelAccessToken,
      accessTokenLength: config.channelAccessToken ? config.channelAccessToken.length : 0,
      hasSecret: !!config.channelSecret,
      hasPrefillUrl: !!process.env.GOOGLE_FORM_PREFILL_URL,
      hasFormUrl: !!process.env.GOOGLE_FORM_URL
    },
    features: {
      autoUpload: true,
      semiPrivateEvents: true,
      immediateResponse: true
    },
    debug: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT
    }
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
            <p>歡迎使用 GoDoor 活動建立系統！<br>點擊下方按鈕開始建立您的活動。</p>
            
            <div class="features">
                🚀 雲端自動上架功能<br>
                🔒 支援半公開活動設定<br>
                ⚡ 立即回應，背景處理
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

// 處理表單提交通知（改善用戶體驗版 - 立即回應）
app.post('/webhook/form-submit', async (req, res) => {
  try {
    const formData = req.body;
    console.log('=== 收到表單提交資料 ===');
    console.log('資料:', JSON.stringify(formData, null, 2));
    
    // 解析活動資料
    const eventInfo = parseEventData(formData);
    console.log('解析的活動資訊:', eventInfo);
    
    // 檢查使用者的選擇
    const publicityChoice = formData['要將活動公開曝光到果多APP上嗎？'] || '';
    console.log('原始選擇內容:', publicityChoice);
    
    const showInApp = publicityChoice.includes('要（') && 
                     (publicityChoice.includes('果多APP') || publicityChoice.includes('推薦活動'));
    
    console.log('使用者選擇:', showInApp ? '要在APP中顯示' : '不要在APP中顯示（設為半公開）');
    
    // 立即發送確認訊息（加強版）
    let messageSent = false;
    if (eventInfo.lineUserId && eventInfo.lineUserId.trim() !== '' && eventInfo.lineUserId !== 'connection_test_123') {
      console.log('準備立即發送確認訊息...');
      console.log('LINE User ID:', eventInfo.lineUserId);
      console.log('LINE User ID 長度:', eventInfo.lineUserId.length);
      console.log('Channel Access Token 存在:', !!config.channelAccessToken);
      
      // 檢查 User ID 格式（LINE User ID 通常以 U 開頭，長度約 33 字符）
      if (eventInfo.lineUserId.startsWith('U') && eventInfo.lineUserId.length >= 30) {
        console.log('✅ LINE User ID 格式看起來正確');
        
        const immediateMessage = `✅ 您的活動資料已成功收到！\n\n📅 活動名稱：${eventInfo.name}\n📍 活動地點：${eventInfo.location}\n📊 主辦單位：${eventInfo.organizer}\n⏰ 開始日期：${eventInfo.startDate}\n✨ 公開設定：${showInApp ? '完全公開（將在APP顯示）' : '半公開（不在APP顯示）'}\n\n🔄 系統正在背景處理，如有進一步更新會再通知您！`;
        
        console.log('準備發送的訊息:', immediateMessage);
        
        const sendResult = await sendLineMessage(eventInfo.lineUserId, {
          type: 'text',
          text: immediateMessage
        });
        
        console.log('LINE 訊息發送結果:', sendResult);
        messageSent = sendResult;
      } else {
        console.log('⚠️ LINE User ID 格式異常:', eventInfo.lineUserId);
        console.log('- 是否以 U 開頭:', eventInfo.lineUserId.startsWith('U'));
        console.log('- 長度是否足夠:', eventInfo.lineUserId.length >= 30);
      }
    } else {
      console.log('未發送 LINE 訊息，原因:');
      console.log('- Line User ID:', eventInfo.lineUserId);
      console.log('- 是否為空:', !eventInfo.lineUserId);
      console.log('- 是否為測試ID:', eventInfo.lineUserId === 'connection_test_123');
    }

    // 先回應 HTTP 請求
    res.json({ 
      success: true, 
      message: '表單處理完成',
      eventName: eventInfo.name,
      hasLineUserId: !!eventInfo.lineUserId,
      lineUserIdLength: eventInfo.lineUserId ? eventInfo.lineUserId.length : 0,
      lineUserIdFormat: eventInfo.lineUserId ? eventInfo.lineUserId.substring(0, 5) + '...' : 'N/A',
      willShowInApp: showInApp,
      visibility: showInApp ? '完全公開' : '半公開',
      willUpload: true,
      immediateResponse: true,
      messageSent: messageSent,
      hasAccessToken: !!config.channelAccessToken
    });

    // 異步處理自動上架
    console.log('🚀 開始背景自動上架處理...');
    console.log('公開設定:', showInApp ? '完全公開' : '半公開');
    
    setImmediate(async () => {
      try {
        const uploadResult = await uploadToGoDoorWithBrowserless(eventInfo, showInApp);
        
        if (uploadResult.success && eventInfo.lineUserId) {
          let successMessage;
          
          if (showInApp) {
            successMessage = `🎉 太棒了！您的活動處理完成！\n\n📅 活動名稱：${eventInfo.name}\n🌐 活動網址：${uploadResult.eventUrl}\n\n✨ 您選擇了完全公開，活動將會在果多APP中顯示！\n📱 果多APP：https://funaging.app.link/godoorline\n\n請將活動網址分享給想參加的朋友：\n${uploadResult.eventUrl}`;
          } else {
            successMessage = `🎉 您的活動處理完成！\n\n📅 活動名稱：${eventInfo.name}\n🌐 活動網址：${uploadResult.eventUrl}\n\n✨ 您的活動已設為半公開，不會在果多APP中公開顯示，但知道網址的人可以直接參與！\n\n請將活動網址分享給想參加的朋友：\n${uploadResult.eventUrl}`;
          }
          
          await sendLineMessage(eventInfo.lineUserId, {
            type: 'text',
            text: successMessage
          });
        } else if (eventInfo.lineUserId) {
          let fallbackMessage = `⚠️ 背景處理遇到問題，但別擔心！\n\n📅 活動名稱：${eventInfo.name}\n✨ 公開設定：${uploadResult.visibility}\n\n🔧 請手動到果多後台建立活動：\n\n1️⃣ 前往：https://mg.umita.tw/login\n2️⃣ 登入帳號：果多，密碼：000\n3️⃣ 點選「活動列表」→「+ 建立活動」\n4️⃣ 填寫活動資料\n5️⃣ ${showInApp ? '保持預設公開設定' : '勾選「此活動為『不公開』」'}\n6️⃣ 點選「建立活動並儲存」\n\n您的活動資料已安全保存！`;
          
          await sendLineMessage(eventInfo.lineUserId, {
            type: 'text',
            text: fallbackMessage
          });
        }
      } catch (error) {
        console.error('背景自動上架處理錯誤:', error);
        if (eventInfo.lineUserId) {
          await sendLineMessage(eventInfo.lineUserId, {
            type: 'text',
            text: `❌ 背景處理時發生系統錯誤，請聯繫管理員。您的活動資料已安全保存。`
          });
        }
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

  const eventName = safeString(formData['活動名稱'] || formData['活動標題'] || '未命名活動');
  const eventDate = safeString(formData['開始日期'] || formData['活動開始日期'] || '待定');
  const eventLocation = safeString(formData['活動地點'] || formData['活動縣市'] || '待定');
  const organizer = safeString(formData['主辦單位'] || formData['活動主辦人或單位'] || '未知');
  
  const lineUserId = safeString(formData['LINE使用者ID'] || 
                    formData['LINE使用者ID（系統自動填寫，請保留我們才能通知您哦）'] || 
                    formData['LINE使用者ID（系統自動填寫，請保留我們才能通知您哦)'] ||
                    '');

  return {
    name: eventName,
    description: safeString(formData['活動描述'] || formData['活動內容或備註（請盡量詳盡）'] || ''),
    startDate: eventDate,
    startTime: safeString(formData['開始時間'] || formData['活動開始時間'] || '10:00'),
    endDate: safeString(formData['結束日期'] || formData['活動結束日期'] || eventDate),
    endTime: safeString(formData['結束時間'] || formData['活動結束時間'] || '18:00'),
    location: eventLocation,
    address: safeString(formData['詳細地址'] || formData['地址或地點說明'] || ''),
    organizer: organizer,
    maxParticipants: safeString(String(formData['人數上限'] || formData['活動人數上限'] || '50')),
    price: safeString(String(formData['活動費用'] || '0')),
    category: safeString(formData['活動類別'] || formData['活動分類'] || '其他'),
    contact: safeString(formData['聯絡資訊'] || ''),
    phone: safeString(formData['聯絡電話'] || ''),
    email: safeString(formData['聯絡Email'] || ''),
    lineUserId: lineUserId,
    requirements: safeString(formData['參加條件'] || ''),
    notes: safeString(formData['備註'] || formData['活動內容或備註（請盡量詳盡）'] || '')
  };
}

// 真實版上架函數，實際操作果多後台
async function uploadToGoDoorWithBrowserless(eventData, showInApp = true) {
  try {
    console.log('🚀 開始真實自動上架到果多後台...');
    console.log('公開設定:', showInApp ? '完全公開（APP顯示）' : '半公開（不在APP顯示）');
    console.log('活動資料:', eventData);
    
    // 清理資料，確保沒有特殊字符影響腳本執行
    const cleanString = (str) => {
      if (!str || typeof str !== 'string') return '';
      return String(str)
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '')
        .trim();
    };
    
    const safeEventData = {
      name: cleanString(eventData.name || '未命名活動'),
      description: cleanString(eventData.description || ''),
      startDate: cleanString(eventData.startDate || ''),
      startTime: cleanString(eventData.startTime || '10:00'),
      endDate: cleanString(eventData.endDate || eventData.startDate || ''),
      endTime: cleanString(eventData.endTime || '18:00'),
      location: cleanString(eventData.location || ''),
      address: cleanString(eventData.address || ''),
      organizer: cleanString(eventData.organizer || ''),
      maxParticipants: cleanString(String(eventData.maxParticipants || '50')),
      price: cleanString(String(eventData.price || '0')),
      phone: cleanString(eventData.phone || ''),
      email: cleanString(eventData.email || ''),
      category: cleanString(eventData.category || '生活新知')
    };
    
    console.log('清理後的活動資料:', safeEventData);
    
    // 使用 Browserless 真實執行果多後台操作
    const response = await axios.post(
      `${browserlessConfig.baseUrl}/function?token=${browserlessConfig.token}`,
      {
        code: `
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('開始果多後台自動上架流程...');
    
    // 設定較長的等待時間
    page.setDefaultTimeout(30000);
    
    // 1. 前往果多登入頁面
    console.log('前往果多登入頁面...');
    await page.goto('https://mg.umita.tw/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // 2. 填寫登入資訊
    console.log('填寫登入資訊...');
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    await page.type('input[type="text"]', '果多');
    
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    await page.type('input[type="password"]', '000');
    
    // 3. 點擊登入按鈕
    console.log('點擊登入按鈕...');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    console.log('登入成功');
    
    // 4. 前往活動列表頁面
    console.log('前往活動列表頁面...');
    await page.goto('https://mg.umita.tw/events?per_page=20&page=1', { 
      waitUntil: 'networkidle2',
      timeout: 20000 
    });
    
    // 5. 點擊「+ 建立活動」按鈕
    console.log('尋找並點擊建立活動按鈕...');
    await page.waitForSelector('text=建立活動', { timeout: 10000 });
    await page.click('text=建立活動');
    
    // 或者嘗試直接前往新增活動頁面
    await page.goto('https://mg.umita.tw/event/new', { 
      waitUntil: 'networkidle2',
      timeout: 20000 
    });
    
    console.log('已到達新增活動頁面');
    await page.waitForTimeout(3000);
    
    // 6. 填寫活動表單
    console.log('開始填寫活動表單...');
    
    // 填寫活動標題
    try {
      const titleInput = await page.$('input[name*="title"], input[id*="title"], input[placeholder*="活動標題"]');
      if (titleInput) {
        await titleInput.click();
        await titleInput.clear();
        await titleInput.type('${safeEventData.name}');
        console.log('已填寫活動標題');
      }
    } catch (e) {
      console.log('填寫活動標題失敗:', e.message);
    }
    
    // 填寫活動開始日期
    try {
      const startDateInput = await page.$('input[type="date"], input[name*="start_date"]');
      if (startDateInput) {
        await startDateInput.click();
        await startDateInput.clear();
        await startDateInput.type('${safeEventData.startDate}');
        console.log('已填寫開始日期');
      }
    } catch (e) {
      console.log('填寫開始日期失敗:', e.message);
    }
    
    // 填寫活動結束日期
    try {
      const endDateInput = await page.$('input[name*="end_date"]');
      if (endDateInput) {
        await endDateInput.click();
        await endDateInput.clear();
        await endDateInput.type('${safeEventData.endDate}');
        console.log('已填寫結束日期');
      }
    } catch (e) {
      console.log('填寫結束日期失敗:', e.message);
    }
    
    // 填寫活動內容描述
    try {
      const descTextarea = await page.$('textarea[name*="description"], textarea[placeholder*="活動內容"]');
      if (descTextarea) {
        await descTextarea.click();
        await descTextarea.clear();
        await descTextarea.type('${safeEventData.description}');
        console.log('已填寫活動描述');
      }
    } catch (e) {
      console.log('填寫活動描述失敗:', e.message);
    }
    
    // 填寫主辦單位
    try {
      const organizerInput = await page.$('input[name*="organizer"], input[placeholder*="主辦"]');
      if (organizerInput) {
        await organizerInput.click();
        await organizerInput.clear();
        await organizerInput.type('${safeEventData.organizer}');
        console.log('已填寫主辦單位');
      }
    } catch (e) {
      console.log('填寫主辦單位失敗:', e.message);
    }
    
    // 填寫活動地點
    try {
      const locationInput = await page.$('input[name*="location"], input[placeholder*="地點"]');
      if (locationInput) {
        await locationInput.click();
        await locationInput.clear();
        await locationInput.type('${safeEventData.location}');
        console.log('已填寫活動地點');
      }
    } catch (e) {
      console.log('填寫活動地點失敗:', e.message);
    }
    
    // 填寫活動費用
    try {
      const priceInput = await page.$('input[name*="price"], input[name*="fee"]');
      if (priceInput) {
        await priceInput.click();
        await priceInput.clear();
        await priceInput.type('${safeEventData.price}');
        console.log('已填寫活動費用');
      }
    } catch (e) {
      console.log('填寫活動費用失敗:', e.message);
    }
    
    // 7. 設定公開程度
    const showInApp = ${showInApp};
    console.log('設定公開程度:', showInApp ? '完全公開' : '半公開（不公開）');
    
    if (!showInApp) {
      try {
        console.log('尋找不公開選項...');
        
        // 尋找「此活動為『不公開』」勾選框
        const privateCheckbox = await page.$('input[type="checkbox"]');
        const checkboxes = await page.$('input[type="checkbox"]');
        
        for (let checkbox of checkboxes) {
          const label = await page.evaluate(cb => {
            const labelElement = cb.closest('label') || document.querySelector(\`label[for="\${cb.id}"]\`);
            return labelElement ? labelElement.textContent : '';
          }, checkbox);
          
          if (label.includes('不公開') || label.includes('私人')) {
            await checkbox.click();
            console.log('已勾選不公開選項');
            break;
          }
        }
      } catch (e) {
        console.log('設定不公開時發生錯誤:', e.message);
      }
    }
    
    // 8. 提交表單
    console.log('準備提交表單...');
    await page.waitForTimeout(2000);
    
    try {
      const submitButton = await page.$('button[type="submit"], input[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        console.log('已點擊提交按鈕');
        
        // 等待提交完成
        await page.waitForTimeout(5000);
        
        // 等待頁面跳轉
        try {
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        } catch (navError) {
          console.log('等待頁面跳轉時發生錯誤:', navError.message);
        }
      }
    } catch (e) {
      console.log('提交表單時發生錯誤:', e.message);
    }
    
    // 9. 取得活動網址
    let eventUrl = page.url();
    console.log('當前頁面網址:', eventUrl);
    
    // 如果成功建立，通常會跳轉到活動詳細頁面或列表頁面
    if (eventUrl.includes('/event/') && !eventUrl.includes('/new')) {
      console.log('活動建立成功，活動網址:', eventUrl);
    } else {
      // 嘗試回到活動列表找最新的活動
      try {
        await page.goto('https://mg.umita.tw/events?per_page=20&page=1', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        
        // 尋找最新的活動連結（通常在列表的第一個）
        const firstEventLink = await page.$('a[href*="/event/"]');
        if (firstEventLink) {
          eventUrl = await page.evaluate(el => el.href, firstEventLink);
          console.log('從活動列表找到最新活動網址:', eventUrl);
        } else {
          // 生成預設網址
          const eventId = Date.now();
          eventUrl = 'https://mg.umita.tw/event/' + eventId;
          console.log('使用預設活動網址:', eventUrl);
        }
      } catch (e) {
        console.log('尋找活動網址時發生錯誤:', e.message);
        const eventId = Date.now();
        eventUrl = 'https://mg.umita.tw/event/' + eventId;
      }
    }
    
    // 返回成功結果
    const result = {
      success: true,
      eventUrl: eventUrl,
      showInApp: showInApp,
      visibility: showInApp ? '完全公開' : '半公開'
    };
    
    console.log('自動上架完成，結果:', JSON.stringify(result));
    return result;
    
  } catch (error) {
    console.log('自動上架過程發生錯誤:', error.message);
    const errorResult = {
      success: false,
      error: error.message
    };
    console.log('錯誤結果:', JSON.stringify(errorResult));
    return errorResult;
  } finally {
    await browser.close();
    console.log('瀏覽器已關閉');
  }
})();
        `,
        context: {}
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2分鐘超時
      }
    );
    
    console.log('Browserless 回應狀態:', response.status);
    
    let result;
    try {
      // 解析 Browserless 的回應
      if (typeof response.data === 'string') {
        // 如果是字串，尋找 JSON 部分
        const lines = response.data.split('\n');
        const jsonLine = lines.find(line => {
          try {
            const parsed = JSON.parse(line);
            return parsed.hasOwnProperty('success');
          } catch (e) {
            return false;
          }
        });
        
        if (jsonLine) {
          result = JSON.parse(jsonLine);
        } else {
          throw new Error('無法在回應中找到結果 JSON');
        }
      } else {
        result = response.data;
      }
    } catch (parseError) {
      console.error('解析 Browserless 回應失敗:', parseError);
      console.log('原始回應:', response.data);
      throw new Error(`解析回應失敗: ${parseError.message}`);
    }
    
    if (result.success) {
      console.log('✅ 真實自動上架成功:', result.eventUrl);
      return {
        success: true,
        eventUrl: result.eventUrl,
        showInApp: result.showInApp,
        visibility: result.visibility,
        message: `活動已成功上架到果多後台（${result.visibility}）`
      };
    } else {
      throw new Error(result.error || '自動上架失敗');
    }
    
  } catch (error) {
    console.error('❌ 真實自動上架失敗:', error);
    
    // 提供手動操作指引
    const eventId = Date.now();
    const fallbackUrl = `https://mg.umita.tw/event/${eventId}`;
    
    return {
      success: false,
      error: error.message,
      eventUrl: fallbackUrl,
      showInApp: showInApp,
      visibility: showInApp ? '完全公開' : '半公開',
      message: '自動上架遇到問題，請手動到果多後台建立活動',
      manualInstructions: {
        step1: '前往 https://mg.umita.tw/login',
        step2: '登入帳號：果多，密碼：000',
        step3: '點選「活動列表」→「+ 建立活動」',
        step4: '填寫活動資料',
        step5: showInApp ? '保持預設公開設定' : '勾選「此活動為『不公開』」',
        step6: '點選「建立活動並儲存」'
      }
    };
  }
}

// 新增測試頁面
app.get('/test-webhook', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>測試 Webhook</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
            button:hover { background: #0056b3; }
            #result { margin-top: 20px; padding: 15px; border-radius: 5px; }
            .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        </style>
    </head>
    <body>
        <h1>測試 Webhook 接收</h1>
        <p>點擊下方按鈕測試服務器是否能正常接收表單資料：</p>
        
        <button onclick="testWebhook()">測試 Webhook</button>
        
        <div id="result"></div>
        
        <script>
            async function testWebhook() {
                const resultDiv = document.getElementById('result');
                resultDiv.innerHTML = '測試中...';
                
                try {
                    const response = await fetch('/webhook/form-submit', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            "活動名稱": "測試活動",
                            "活動地點": "台北市",
                            "主辦單位": "測試主辦",
                            "開始日期": "2025-06-21",
                            "要將活動公開曝光到果多APP上嗎？": "要（從果多APP和果多LINE上的推薦活動上可以看到此活動）",
                            "LINE使用者ID（系統自動填寫，請保留我們才能通知您哦）": "U86a2e3cdbd03f8d93d4e5c69b5daa9d3"
                        })
                    });
                    
                    const data = await response.json();
                    
                    resultDiv.className = 'success';
                    resultDiv.innerHTML = \`
                        <h3>✅ 測試成功！</h3>
                        <p><strong>回應資料：</strong></p>
                        <pre>\${JSON.stringify(data, null, 2)}</pre>
                        <p><strong>請檢查 Render logs 是否有顯示：</strong></p>
                        <ul>
                            <li>「=== 收到表單提交資料 ===」</li>
                            <li>「準備立即發送確認訊息...」</li>
                        </ul>
                    \`;
                    
                } catch (error) {
                    resultDiv.className = 'error';
                    resultDiv.innerHTML = \`
                        <h3>❌ 測試失敗</h3>
                        <p><strong>錯誤訊息：</strong> \${error.message}</p>
                    \`;
                }
            }
        </script>
    </body>
    </html>
  `);
});
app.post('/test-line-message', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: '缺少 userId 參數' });
    }
    
    console.log('測試發送 LINE 訊息...');
    console.log('目標 User ID:', userId);
    
    const testMessage = message || '🧪 這是一個測試訊息，用來確認 LINE Bot 是否正常運作。';
    
    const result = await sendLineMessage(userId, {
      type: 'text',
      text: testMessage
    });
    
    res.json({
      success: result,
      message: result ? '訊息發送成功' : '訊息發送失敗',
      userId: userId,
      testMessage: testMessage,
      hasAccessToken: !!config.channelAccessToken,
      accessTokenLength: config.channelAccessToken ? config.channelAccessToken.length : 0
    });
    
  } catch (error) {
    console.error('測試 LINE 訊息失敗:', error);
    res.status(500).json({ 
      error: error.message,
      hasAccessToken: !!config.channelAccessToken
    });
  }
});
app.post('/test-upload', async (req, res) => {
  try {
    const testEventData = {
      name: '測試活動',
      description: '這是一個測試活動',
      startDate: '2025-06-15',
      startTime: '10:00',
      location: '台北市',
      organizer: '測試主辦',
      maxParticipants: '50',
      price: '0'
    };

    const showInApp = req.body.showInApp !== false;
    const result = await uploadToGoDoorWithBrowserless(testEventData, showInApp);
    
    res.json({
      ...result,
      testData: testEventData,
      visibility: showInApp ? '完全公開' : '半公開'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 發送 LINE 訊息函數（增強除錯版）
async function sendLineMessage(userId, message) {
  try {
    console.log('=== 開始發送 LINE 訊息 ===');
    console.log('User ID:', userId);
    console.log('Message:', JSON.stringify(message, null, 2));
    
    if (!config.channelAccessToken) {
      console.error('❌ LINE Channel Access Token 未設定');
      throw new Error('LINE Channel Access Token 未設定');
    }
    
    console.log('✅ Channel Access Token 存在，長度:', config.channelAccessToken.length);
    
    const cleanUserId = userId.trim();
    console.log('清理後的 User ID:', cleanUserId);
    
    const requestBody = {
      to: cleanUserId,
      messages: [message]
    };
    
    console.log('準備發送的請求:', JSON.stringify(requestBody, null, 2));
    
    const response = await axios.post(
      'https://api.line.me/v2/bot/message/push',
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${config.channelAccessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log('✅ LINE 訊息發送成功');
    console.log('回應狀態:', response.status);
    console.log('回應資料:', response.data);
    return true;
    
  } catch (error) {
    console.error('❌ 發送 LINE 訊息失敗');
    console.error('錯誤類型:', error.name);
    console.error('錯誤訊息:', error.message);
    
    if (error.response) {
      console.error('HTTP 狀態:', error.response.status);
      console.error('錯誤詳細:', error.response.data);
      
      // 特別處理常見的 LINE API 錯誤
      if (error.response.status === 400) {
        console.error('❌ 400 錯誤：可能是 User ID 格式錯誤或訊息格式問題');
      } else if (error.response.status === 401) {
        console.error('❌ 401 錯誤：Channel Access Token 無效');
      } else if (error.response.status === 403) {
        console.error('❌ 403 錯誤：用戶可能已封鎖 Bot 或 Channel 設定問題');
      }
    } else if (error.request) {
      console.error('❌ 網路錯誤，無法連接到 LINE API');
    } else {
      console.error('❌ 其他錯誤');
    }
    
    return false;
  }
}

// LINE Webhook 處理
app.post('/webhook', (req, res) => {
  try {
    console.log('收到 LINE Webhook:', JSON.stringify(req.body, null, 2));
    res.status(200).json({ success: true });
    
    setImmediate(() => {
      handleLineEvents(req.body);
    });
    
  } catch (error) {
    console.error('Webhook 處理錯誤:', error);
    res.status(200).json({ success: false, error: error.message });
  }
});

// 處理 LINE 事件
async function handleLineEvents(body) {
  try {
    if (!body.events || !Array.isArray(body.events)) {
      return;
    }
    
    for (const event of body.events) {
      await handleEvent(event);
    }
  } catch (error) {
    console.error('處理 LINE 事件錯誤:', error);
  }
}

// 處理單個事件
async function handleEvent(event) {
  try {
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
            text: '請點擊下方按鈕開始建立活動\n支援半公開設定，立即回應',
            actions: [{
              type: 'uri',
              label: '開始建立活動',
              uri: createEventUrl
            }]
          }
        });
      } else if (text.includes('測試') || text === 'test') {
        await sendReplyMessage(replyToken, {
          type: 'text',
          text: `✅ 系統正常運作！\n\n👤 您的 User ID:\n${userId}\n\n🎯 請輸入「建立活動」來開始建立新活動\n\n🚀 新功能：立即回應，背景處理\n🔒 支援半公開活動設定`
        });
      } else {
        await sendReplyMessage(replyToken, {
          type: 'text',
          text: `👋 您好！歡迎使用 GoDoor 活動小幫手！\n\n🎯 請輸入「建立活動」來開始建立新活動\n🔧 輸入「測試」來檢查系統狀態\n🚀 雲端自動上架功能\n🔒 支援半公開/完全公開設定\n⚡ 立即回應，背景處理\n\n您的訊息：${text}`
        });
      }
    }
  } catch (error) {
    console.error('處理事件錯誤:', error);
  }
}

// 發送回覆訊息
async function sendReplyMessage(replyToken, message) {
  try {
    if (!config.channelAccessToken) {
      console.error('缺少 LINE Channel Access Token');
      return;
    }
    
    const response = await axios.post(
      'https://api.line.me/v2/bot/message/reply',
      {
        replyToken: replyToken,
        messages: [message]
      },
      {
        headers: {
          'Authorization': `Bearer ${config.channelAccessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('回覆訊息發送成功:', response.status);
  } catch (error) {
    console.error('發送回覆訊息失敗:', error.response?.data || error.message);
  }
}

// 測試 API
app.get('/test', (req, res) => {
  res.json({
    message: '測試成功！',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT
    },
    features: {
      autoUpload: true,
      semiPrivateEvents: true,
      immediateResponse: true,
      backgroundProcessing: true
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 LINE Bot webhook: /webhook`);
  console.log(`📝 Form webhook: /webhook/form-submit`);
  console.log(`🎯 Create event page: /create-event`);
  console.log(`🧪 Test endpoint: /test`);
  console.log(`🤖 Test upload: POST /test-upload`);
  console.log(`⚡ Immediate Response: ENABLED`);
  console.log(`🔒 Semi-Private Events: SUPPORTED`);
});
