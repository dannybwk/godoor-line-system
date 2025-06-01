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

// 活動建立頁面 - 新的美觀表單
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
            }
            .container {
                background: white;
                border-radius: 16px;
                padding: 32px;
                max-width: 600px;
                margin: 0 auto;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .logo { 
                font-size: 48px; 
                margin-bottom: 16px; 
                text-align: center; 
            }
            h1 { 
                color: #333; 
                margin-bottom: 16px; 
                text-align: center; 
                font-size: 28px;
            }
            .subtitle {
                text-align: center;
                color: #666;
                margin-bottom: 30px;
                font-size: 16px;
                line-height: 1.5;
            }
            .features {
                background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
                padding: 20px;
                border-radius: 12px;
                margin-bottom: 30px;
                text-align: center;
            }
            .features h3 {
                margin: 0 0 15px 0;
                color: #333;
                font-size: 18px;
            }
            .features-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }
            .feature-item {
                background: white;
                padding: 15px;
                border-radius: 8px;
                font-size: 14px;
                color: #555;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .form-container {
                display: grid;
                gap: 20px;
            }
            .form-group {
                display: grid;
                gap: 8px;
            }
            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            @media (max-width: 600px) {
                .form-row {
                    grid-template-columns: 1fr;
                }
            }
            label {
                font-weight: bold;
                color: #333;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            .required {
                color: #e74c3c;
                font-size: 12px;
            }
            input, select, textarea {
                width: 100%;
                padding: 14px;
                border: 2px solid #e9ecef;
                border-radius: 8px;
                font-size: 14px;
                box-sizing: border-box;
                transition: border-color 0.3s ease;
            }
            input:focus, select:focus, textarea:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            textarea {
                resize: vertical;
                min-height: 100px;
            }
            .btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 16px 32px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 20px;
            }
            .btn:hover { 
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
            }
            .btn:disabled { 
                opacity: 0.6; 
                cursor: not-allowed; 
                transform: none;
                box-shadow: none;
            }
            .status {
                margin-top: 20px;
                padding: 15px;
                border-radius: 8px;
                font-size: 14px;
                display: none;
                text-align: center;
            }
            .status.loading { 
                background: #e3f2fd; 
                color: #1976d2; 
                display: block; 
            }
            .status.success { 
                background: #e8f5e8; 
                color: #2e7d32; 
                display: block; 
            }
            .status.error { 
                background: #ffebee; 
                color: #c62828; 
                display: block; 
            }
            .user-info {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 25px;
                font-size: 13px;
                color: #666;
                text-align: center;
            }
            .privacy-section {
                background: #fff3e0;
                padding: 20px;
                border-radius: 12px;
                margin: 20px 0;
            }
            .privacy-section h4 {
                margin: 0 0 15px 0;
                color: #f57c00;
                font-size: 16px;
            }
            .radio-group {
                display: grid;
                gap: 12px;
            }
            .radio-option {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                padding: 12px;
                border: 2px solid #e9ecef;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .radio-option:hover {
                border-color: #667eea;
                background: #f8f9ff;
            }
            .radio-option.selected {
                border-color: #667eea;
                background: #f0f4ff;
            }
            .radio-option input[type="radio"] {
                width: auto;
                margin: 0;
            }
            .radio-label {
                flex: 1;
            }
            .radio-title {
                font-weight: bold;
                color: #333;
                margin-bottom: 4px;
            }
            .radio-desc {
                font-size: 12px;
                color: #666;
                line-height: 1.4;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🎉</div>
            <h1>GoDoor 活動建立</h1>
            <p class="subtitle">歡迎使用 GoDoor 活動建立系統！<br>填寫以下資訊，我們將自動為您處理活動上架。</p>
            
            <div class="features">
                <h3>✨ 服務特色</h3>
                <div class="features-grid">
                    <div class="feature-item">
                        🚀 自動上架到果多後台
                    </div>
                    <div class="feature-item">
                        🔒 支援隱私設定選擇
                    </div>
                    <div class="feature-item">
                        ⚡ 立即LINE通知結果
                    </div>
                    <div class="feature-item">
                        📱 整合果多APP推廣
                    </div>
                </div>
            </div>
            
            ${userId ? `
                <div class="user-info">
                    ✅ 已識別您的身份，系統將自動發送處理結果通知<br>
                    LINE ID: ${userId.substring(0, 8)}...
                </div>
            ` : `
                <div class="user-info">
                    ⚠️ 未能識別使用者身份，系統將無法發送確認訊息<br>
                    建議從LINE點擊連結進入本頁面
                </div>
            `}
            
            <form id="eventForm" class="form-container">
                <div class="form-group">
                    <label>活動名稱 <span class="required">*</span></label>
                    <input type="text" name="activityName" required placeholder="請輸入活動名稱">
                </div>
                
                <div class="form-group">
                    <label>活動描述 <span class="required">*</span></label>
                    <textarea name="description" required placeholder="請詳細描述活動內容、注意事項等資訊"></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>開始日期 <span class="required">*</span></label>
                        <input type="date" name="startDate" required>
                    </div>
                    <div class="form-group">
                        <label>開始時間 <span class="required">*</span></label>
                        <input type="time" name="startTime" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>結束日期</label>
                        <input type="date" name="endDate">
                    </div>
                    <div class="form-group">
                        <label>結束時間</label>
                        <input type="time" name="endTime" value="18:00">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>活動地點 <span class="required">*</span></label>
                    <input type="text" name="location" required placeholder="縣市區域或詳細地址">
                </div>
                
                <div class="form-group">
                    <label>詳細地址</label>
                    <input type="text" name="address" placeholder="完整地址或地點說明（選填）">
                </div>
                
                <div class="form-group">
                    <label>主辦單位 <span class="required">*</span></label>
                    <input type="text" name="organizer" required placeholder="個人姓名或機構名稱">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>人數上限</label>
                        <input type="number" name="maxParticipants" value="30" min="1" placeholder="活動人數限制">
                    </div>
                    <div class="form-group">
                        <label>活動費用 (元)</label>
                        <input type="number" name="price" value="0" min="0" placeholder="0 表示免費">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>聯絡電話</label>
                        <input type="tel" name="phone" placeholder="聯絡電話（選填）">
                    </div>
                    <div class="form-group">
                        <label>聯絡Email</label>
                        <input type="email" name="email" placeholder="聯絡信箱（選填）">
                    </div>
                </div>
                
                <div class="privacy-section">
                    <h4>🔒 隱私設定</h4>
                    <p style="margin: 0 0 15px 0; font-size: 14px; color: #666;">選擇您希望的活動曝光程度：</p>
                    <div class="radio-group">
                        <label class="radio-option" onclick="selectRadio('public')">
                            <input type="radio" name="publicity" value="public" id="public">
                            <div class="radio-label">
                                <div class="radio-title">🌐 完全公開（推薦）</div>
                                <div class="radio-desc">活動將在果多APP中顯示，讓更多人看到您的活動</div>
                            </div>
                        </label>
                        <label class="radio-option" onclick="selectRadio('private')">
                            <input type="radio" name="publicity" value="private" id="private">
                            <div class="radio-label">
                                <div class="radio-title">🔒 半公開</div>
                                <div class="radio-desc">活動不會在APP中公開顯示，僅限知道連結的人查看</div>
                            </div>
                        </label>
                    </div>
                </div>
                
                <input type="hidden" name="lineUserId" value="${userId}">
                
                <button type="submit" class="btn" id="submitBtn">
                    🚀 建立活動
                </button>
            </form>
            
            <div id="status" class="status"></div>
        </div>

        <script>
            // 設定預設日期時間
            window.onload = function() {
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                
                document.querySelector('input[name="startDate"]').value = tomorrow.toISOString().split('T')[0];
                document.querySelector('input[name="startTime"]').value = '14:00';
                
                // 設定結束日期為開始日期
                document.querySelector('input[name="endDate"]').value = tomorrow.toISOString().split('T')[0];
                
                // 預設選擇公開
                document.getElementById('public').checked = true;
                selectRadio('public');
            };
            
            // 處理單選按鈕選擇
            function selectRadio(option) {
                document.querySelectorAll('.radio-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                document.querySelector(\`#\${option}\`).closest('.radio-option').classList.add('selected');
                document.querySelector(\`#\${option}\`).checked = true;
            }
            
            // 同步開始和結束日期
            document.querySelector('input[name="startDate"]').addEventListener('change', function() {
                const endDateInput = document.querySelector('input[name="endDate"]');
                if (!endDateInput.value || endDateInput.value < this.value) {
                    endDateInput.value = this.value;
                }
            });
            
            // 表單提交處理
            document.getElementById('eventForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const submitBtn = document.getElementById('submitBtn');
                const status = document.getElementById('status');
                
                // 顯示載入狀態
                submitBtn.disabled = true;
                submitBtn.textContent = '⏳ 建立中...';
                status.className = 'status loading';
                status.textContent = '正在建立活動，請稍候...';
                
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
            ? `🎉 您的活動資料已處理完成！\n\n📅 活動名稱：${eventInfo.name}\n🌐 活動網址：${uploadResult.eventUrl}\n\n✨ 活動設為完全公開\n📝 備註：${uploadResult.note || ''}\n\n📱 您也可以直接使用果多APP管理活動：\nhttps://funaging.app.link/godoorline`
            : `🎉 您的活動資料已處理完成！\n\n📅 活動名稱：${eventInfo.name}\n🌐 活動網址：${uploadResult.eventUrl}\n\n✨ 活動設為半公開\n📝 備註：${uploadResult.note || ''}\n\n📱 您也可以直接使用果多APP管理活動：\nhttps://funaging.app.link/godoorline`;
          
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

// 模擬自動上架到果多後台（暫時停用 Browserless）
async function uploadToGoDoorWithBrowserless(eventData, showInApp = true) {
  try {
    console.log('🚀 開始模擬自動上架到果多後台...');
    
    // 暫時停用 Browserless API 呼叫，改為模擬成功
    console.log('活動資料已準備:', {
      name: eventData.name,
      organizer: eventData.organizer,
      location: eventData.location,
      startDate: eventData.startDate,
      showInApp: showInApp
    });
    
    // 模擬處理時間
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 生成模擬的活動網址
    const eventId = Date.now();
    const eventUrl = `https://mg.umita.tw/event/${eventId}`;
    
    console.log('✅ 模擬上架完成！活動網址:', eventUrl);
    
    return {
      success: true,
      eventUrl: eventUrl,
      showInApp: showInApp,
      visibility: showInApp ? '完全公開' : '半公開',
      note: '系統已收到您的活動資料，正在處理中'
    };
    
  } catch (error) {
    console.error('模擬上架失敗:', error);
    return { 
      success: false, 
      error: error.message,
      message: '模擬上架失敗'
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
}); eventData = {
                        '活動名稱': data.activityName,
                        '活動內容或備註（請盡量詳盡）': data.description,
                        '活動開始日期': data.startDate,
                        '活動開始時間': data.startTime,
                        '活動結束日期': data.endDate || data.startDate,
                        '活動結束時間': data.endTime || '18:00',
                        '活動地點': data.location,
                        '詳細地址': data.address || '',
                        '活動主辦人或單位': data.organizer,
                        '活動人數上限': data.maxParticipants || '30',
                        '活動費用': data.price || '0',
                        '聯絡電話': data.phone || '',
                        '聯絡Email': data.email || '',
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
                        status.textContent = \`✅ 活動「\${result.eventName}」建立成功！(\${result.visibility}) 系統已開始處理，您將透過LINE收到處理結果通知。\`;
                        submitBtn.textContent = '✅ 建立完成';
                        
                        // 5秒後重置表單
                        setTimeout(() => {
                            window.location.reload();
                        }, 5000);
                    } else {
                        throw new Error(result.message || '建立失敗');
                    }
                    
                } catch (error) {
                    console.error('建立活動失敗:', error);
                    status.className = 'status error';
                    status.textContent = '❌ 建立失敗: ' + error.message;
                    submitBtn.disabled = false;
                    submitBtn.textContent = '🚀 建立活動';
                }
            });
        </script>
    </body>
    </html>
  `);
});

// 測試用快速建立活動頁面（可選保留）
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
                    const
