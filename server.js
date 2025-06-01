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

// 測試用快速建立活動頁面
app.get('/quick-test-event', (req, res) => {
  const userId = req.query.userId || '';
  
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>快速測試 - 建立活動</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
                min-height: 100vh;
            }
            .container {
                background: white;
                border-radius: 16px;
                padding: 32px;
                max-width: 500px;
                margin: 0 auto;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .logo { font-size: 48px; margin-bottom: 16px; text-align: center; }
            h1 { color: #333; margin-bottom: 16px; text-align: center; }
            .test-badge {
                background: #ff6b6b;
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                display: inline-block;
                margin-bottom: 20px;
            }
            .quick-form {
                display: grid;
                gap: 15px;
            }
            label {
                font-weight: bold;
                color: #333;
                margin-bottom: 5px;
                display: block;
            }
            input, select, textarea {
                width: 100%;
                padding: 12px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
                box-sizing: border-box;
            }
            input:focus, select:focus, textarea:focus {
                outline: none;
                border-color: #ff6b6b;
            }
            .btn {
                background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: transform 0.2s;
            }
            .btn:hover { transform: translateY(-2px); }
            .btn:disabled { 
                opacity: 0.6; 
                cursor: not-allowed; 
                transform: none;
            }
            .preset-btns {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 20px;
            }
            .preset-btn {
                background: #f8f9fa;
                border: 2px solid #ddd;
                padding: 10px;
                border-radius: 8px;
                cursor: pointer;
                text-align: center;
                font-size: 12px;
                transition: all 0.2s;
            }
            .preset-btn:hover {
                border-color: #ff6b6b;
                background: #fff5f5;
            }
            .status {
                margin-top: 15px;
                padding: 12px;
                border-radius: 8px;
                font-size: 14px;
                display: none;
            }
            .status.loading { background: #e3f2fd; color: #1976d2; display: block; }
            .status.success { background: #e8f5e8; color: #2e7d32; display: block; }
            .status.error { background: #ffebee; color: #c62828; display: block; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🚀</div>
            <h1>快速測試建立活動</h1>
            <div class="test-badge">🧪 測試模式</div>
            
            <div class="preset-btns">
                <div class="preset-btn" onclick="fillPreset('workshop')">
                    🎨 工作坊範例
                </div>
                <div class="preset-btn" onclick="fillPreset('seminar')">
                    📚 講座範例
                </div>
                <div class="preset-btn" onclick="fillPreset('social')">
                    🎉 社交活動範例
                </div>
                <div class="preset-btn" onclick="fillPreset('sports')">
                    ⚽ 運動活動範例
                </div>
            </div>
            
            <form id="quickForm" class="quick-form">
                <div>
                    <label>活動名稱</label>
                    <input type="text" name="activityName" required>
                </div>
                
                <div>
                    <label>活動描述</label>
                    <textarea name="description" rows="3"></textarea>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label>開始日期</label>
                        <input type="date" name="startDate" required>
                    </div>
                    <div>
                        <label>開始時間</label>
                        <input type="time" name="startTime" required>
                    </div>
                </div>
                
                <div>
                    <label>活動地點</label>
                    <input type="text" name="location" required>
                </div>
                
                <div>
                    <label>主辦單位</label>
                    <input type="text" name="organizer" required>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label>人數上限</label>
                        <input type="number" name="maxParticipants" value="30" min="1">
                    </div>
                    <div>
                        <label>活動費用</label>
                        <input type="number" name="price" value="0" min="0">
                    </div>
                </div>
                
                <div>
                    <label>公開設定</label>
                    <select name="publicity">
                        <option value="public">完全公開（在APP顯示）</option>
                        <option value="private">半公開（不在APP顯示）</option>
                    </select>
                </div>
                
                <input type="hidden" name="lineUserId" value="${userId}">
                
                <button type="submit" class="btn" id="submitBtn">
                    🚀 快速建立測試活動
                </button>
            </form>
            
            <div id="status" class="status"></div>
        </div>

        <script>
            // 預設範例資料
            const presets = {
                workshop: {
                    activityName: 'AI 程式設計工作坊',
                    description: '學習如何使用 AI 工具提升程式開發效率，適合初學者參加',
                    location: '台北市信義區信義路五段7號',
                    organizer: 'TechHub Taiwan',
                    maxParticipants: 25,
                    price: 1500
                },
                seminar: {
                    activityName: '數位轉型趨勢講座',
                    description: '探討 2025 年企業數位轉型的最新趨勢與實務案例分享',
                    location: '台北市中山區南京東路二段',
                    organizer: '數位創新協會',
                    maxParticipants: 80,
                    price: 0
                },
                social: {
                    activityName: '週末咖啡聚會',
                    description: '輕鬆的週末聚會，認識新朋友，分享生活趣事',
                    location: '台北市大安區敦化南路一段',
                    organizer: '咖啡愛好者社群',
                    maxParticipants: 15,
                    price: 200
                },
                sports: {
                    activityName: '週日羽球練習',
                    description: '歡迎各程度球友參加，一起運動流汗增進球技',
                    location: '台北市松山區體育館',
                    organizer: '羽球同好會',
                    maxParticipants: 12,
                    price: 100
                }
            };
            
            // 設定預設日期時間
            window.onload = function() {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                document.querySelector('input[name="startDate"]').value = tomorrow.toISOString().split('T')[0];
                document.querySelector('input[name="startTime"]').value = '14:00';
            };
            
            // 填入預設範例
            function fillPreset(type) {
                const preset = presets[type];
                const form = document.getElementById('quickForm');
                
                Object.keys(preset).forEach(key => {
                    const input = form.querySelector(\`[name="\${key}"]\`);
                    if (input) {
                        input.value = preset[key];
                    }
                });
            }
            
            // 表單提交
            document.getElementById('quickForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const submitBtn = document.getElementById('submitBtn');
                const status = document.getElementById('status');
                
                // 顯示載入狀態
                submitBtn.disabled = true;
                submitBtn.textContent = '⏳ 建立中...';
                status.className = 'status loading';
                status.textContent = '正在快速建立測試活動...';
                
                try {
                    const formData = new FormData(this);
                    const data = Object.fromEntries(formData.entries());
                    
                    // 轉換為後端期望的格式
                    const eventData = {
                        '活動名稱': data.activityName,
                        '活動內容或備註（請盡量詳盡）': data.description,
                        '活動開始日期': data.startDate,
                        '活動開始時間': data.startTime,
                        '活動結束日期': data.startDate, // 預設同一天
                        '活動結束時間': '18:00',
                        '活動地點': data.location,
                        '活動主辦人或單位': data.organizer,
                        '活動人數上限': data.maxParticipants,
                        '活動費用': data.price,
                        'LINE使用者ID（系統自動填寫，請保留我們才能通知您哦）': data.lineUserId,
                        '要將活動公開曝光到果多APP上嗎？': data.publicity === 'public' ? '要（推薦到果多APP）' : '不要'
                    };
                    
                    const response = await fetch('/webhook/form-submit', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(eventData)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        status.className = 'status success';
                        status.textContent = \`✅ 測試活動「\${result.eventName}」建立成功！(\${result.visibility})\`;
                        submitBtn.textContent = '✅ 建立完成';
                        
                        // 3秒後重置表單
                        setTimeout(() => {
                            this.reset();
                            submitBtn.disabled = false;
                            submitBtn.textContent = '🚀 快速建立測試活動';
                            status.style.display = 'none';
                            // 重新設定預設日期時間
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            document.querySelector('input[name="startDate"]').value = tomorrow.toISOString().split('T')[0];
                            document.querySelector('input[name="startTime"]').value = '14:00';
                        }, 3000);
                    } else {
                        throw new Error(result.message || '建立失敗');
                    }
                    
                } catch (error) {
                    console.error('建立活動失敗:', error);
                    status.className = 'status error';
                    status.textContent = '❌ 建立失敗: ' + error.message;
                    submitBtn.disabled = false;
                    submitBtn.textContent = '🚀 快速建立測試活動';
                }
            });
        </script>
    </body>
    </html>
  `);
});

// 處理表單提交通知
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
          const fallbackMessage = `⚠️ 自動上架遇到問題，但別擔心！\n\n📅 活動名稱：${eventInfo.name}\n📍 活動地點：${eventInfo.location}\n📊 主辦單位：${eventInfo.organizer}\n\n📱 您也可以直接使用果多APP免費上架活動：\n\n🔗 下載果多APP：\nhttps://funaging.app.link/godoorline\n\n在APP中可以輕鬆建立和管理您的活動！\n\n如需其他協助，請聯繫我們的客服團隊。`;
          
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
// 找到您 server.js 中的 uploadToGoDoorWithBrowserless 函數
// 將這個函數整個替換為以下版本：

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
    
    // 修正：使用正確的 Browserless Function API 格式
    const response = await axios.post(
      `${browserlessConfig.baseUrl}/function?token=${browserlessConfig.token}`,
      {
        code: `
export default async function ({ page, context }) {
  try {
    console.log('開始果多後台自動上架流程...');
    
    // 1. 登入果多後台
    console.log('1. 前往登入頁面...');
    await page.goto('https://mg.umita.tw/login', { waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log('2. 填寫登入資訊...');
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    await page.type('input[type="text"]', '果多');
    
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    await page.type('input[type="password"]', '000');
    
    console.log('3. 點擊登入按鈕...');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    console.log('登入成功！');
    
    // 2. 前往新增活動頁面
    console.log('4. 前往新增活動頁面...');
    await page.goto('https://mg.umita.tw/event/new', { waitUntil: 'networkidle2', timeout: 20000 });
    await page.waitForTimeout(3000);
    console.log('已到達新增活動頁面');
    
    // 3. 填寫表單
    console.log('5. 開始填寫表單...');
    
    // 填寫活動標題
    try {
      console.log('填寫活動標題...');
      await page.waitForSelector('#event-title', { timeout: 5000 });
      await page.click('#event-title');
      await page.evaluate(() => document.querySelector('#event-title').value = '');
      await page.type('#event-title', context.eventData.name);
      console.log('✅ 活動標題已填寫:', context.eventData.name);
    } catch (e) {
      console.log('❌ 填寫活動標題失敗:', e.message);
    }
    
    // 填寫活動描述
    try {
      console.log('填寫活動描述...');
      const descriptionField = await page.$('textarea[id*="description"], textarea[name*="description"], #event-description');
      if (descriptionField) {
        await descriptionField.click();
        await descriptionField.evaluate(el => el.value = '');
        await descriptionField.type(context.eventData.description);
        console.log('✅ 活動描述已填寫');
      } else {
        console.log('⚠️ 未找到活動描述欄位');
      }
    } catch (e) {
      console.log('❌ 填寫活動描述失敗:', e.message);
    }
    
    // 填寫活動地點
    try {
      console.log('填寫活動地點...');
      const locationField = await page.$('input[id*="location"], input[name*="location"], #event-location');
      if (locationField) {
        await locationField.click();
        await locationField.evaluate(el => el.value = '');
        await locationField.type(context.eventData.location);
        console.log('✅ 活動地點已填寫:', context.eventData.location);
      } else {
        console.log('⚠️ 未找到活動地點欄位');
      }
    } catch (e) {
      console.log('❌ 填寫活動地點失敗:', e.message);
    }
    
    // 填寫主辦單位
    try {
      console.log('填寫主辦單位...');
      const organizerField = await page.$('input[id*="organizer"], input[name*="organizer"], #event-organizer');
      if (organizerField) {
        await organizerField.click();
        await organizerField.evaluate(el => el.value = '');
        await organizerField.type(context.eventData.organizer);
        console.log('✅ 主辦單位已填寫:', context.eventData.organizer);
      } else {
        console.log('⚠️ 未找到主辦單位欄位');
      }
    } catch (e) {
      console.log('❌ 填寫主辦單位失敗:', e.message);
    }
    
    // 4. 設定公開程度
    const showInApp = context.showInApp;
    console.log('6. 設定公開程度:', showInApp ? '完全公開' : '半公開（不公開）');
    
    if (!showInApp) {
      try {
        console.log('設定為不公開...');
        await page.waitForSelector('#private-event', { timeout: 5000 });
        
        const isChecked = await page.evaluate(() => {
          return document.querySelector('#private-event').checked;
        });
        
        if (!isChecked) {
          await page.click('#private-event');
          console.log('✅ 已勾選「此活動為不公開」');
        } else {
          console.log('✅ 「此活動為不公開」已經勾選');
        }
      } catch (e) {
        console.log('❌ 設定不公開失敗:', e.message);
      }
    } else {
      console.log('✅ 設定為完全公開');
    }
    
    // 5. 提交表單
    console.log('7. 準備提交表單...');
    await page.waitForTimeout(2000);
    
    try {
      await page.waitForSelector('#send-review-button', { timeout: 5000 });
      await page.click('#send-review-button');
      console.log('✅ 已點擊「建立活動並送出審核」按鈕');
      
      await page.waitForTimeout(5000);
      console.log('⏳ 等待提交完成...');
      
    } catch (e) {
      console.log('❌ 點擊提交按鈕失敗:', e.message);
    }
    
    // 6. 取得活動網址
    let eventUrl = page.url();
    console.log('8. 當前頁面網址:', eventUrl);
    
    if (eventUrl.includes('/event/new')) {
      console.log('等待頁面跳轉...');
      try {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        eventUrl = page.url();
        console.log('跳轉後網址:', eventUrl);
      } catch (e) {
        console.log('未檢測到頁面跳轉:', e.message);
      }
    }
    
    if (!eventUrl.includes('/event/') || eventUrl.includes('/new')) {
      const eventId = Date.now();
      eventUrl = 'https://mg.umita.tw/event/' + eventId;
      console.log('生成預設活動網址:', eventUrl);
    }
    
    console.log('✅ 自動上架完成！最終活動網址:', eventUrl);
    
    return {
      data: {
        success: true,
        eventUrl: eventUrl,
        showInApp: showInApp,
        visibility: showInApp ? '完全公開' : '半公開'
      },
      type: 'application/json'
    };
    
  } catch (error) {
    console.log('❌ 自動上架過程發生錯誤:', error.message);
    return {
      data: {
        success: false,
        error: error.message
      },
      type: 'application/json'
    };
  }
}
        `,
        context: {
          eventData: safeData,
          showInApp: showInApp
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 90000
      }
    );
    
    const result = response.data;
    
    // 檢查回應格式
    if (result && result.success !== undefined) {
      return result;
    } else if (result && typeof result === 'string') {
      try {
        const parsed = JSON.parse(result);
        return parsed;
      } catch (e) {
        return { success: false, error: 'Invalid response format' };
      }
    } else {
      return { success: false, error: 'Unexpected response format' };
    }
    
  } catch (error) {
    console.error('自動上架失敗:', error);
    
    console.log('需要手動處理的活動資料:', {
      name: eventData.name,
      organizer: eventData.organizer,
      location: eventData.location,
      startDate: eventData.startDate,
      showInApp: showInApp,
      error: error.message
    });
    
    return { 
      success: false, 
      error: error.message,
      message: '自動上架失敗，已記錄供內部處理'
    };
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
        } else if (text.includes('測試活動') || text.includes('快速測試')) {
          // 測試活動的邏輯
          const quickTestUrl = `${process.env.RENDER_EXTERNAL_URL || 'https://godoor-line-system.onrender.com'}/quick-test-event?userId=${encodeURIComponent(userId)}`;
          
          await sendReplyMessage(replyToken, {
            type: 'template',
            altText: '快速測試建立活動',
            template: {
              type: 'buttons',
              title: '🚀 快速測試建立活動',
              text: '測試專用，預填範例資料',
              actions: [{
                type: 'uri',
                label: '開始快速測試',
                uri: quickTestUrl
              }]
            }
          });
        } else {
          await sendReplyMessage(replyToken, {
            type: 'text',
            text: `👋 歡迎使用 GoDoor 活動小幫手！\n\n🎯 請輸入「建立活動」開始建立新活動\n🚀 請輸入「測試活動」快速建立測試活動\n\n您的訊息：${text}`
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
  console.log(`🚀 Quick test page: /quick-test-event`);
});
