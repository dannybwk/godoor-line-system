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

// 健康檢查
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'GoDoor LINE System is running!',
    timestamp: new Date().toISOString(),
    config: {
      hasAccessToken: !!config.channelAccessToken,
      hasSecret: !!config.channelSecret,
      hasPrefillUrl: !!process.env.GOOGLE_FORM_PREFILL_URL,
      hasFormUrl: !!process.env.GOOGLE_FORM_URL
    }
  });
});

// 活動建立頁面 - 支援使用者 ID 預填
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
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🎉</div>
            <h1>GoDoor 活動建立</h1>
            <p>歡迎使用 GoDoor 活動建立系統！<br>點擊下方按鈕開始建立您的活動。</p>
            
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

// 處理表單提交通知（修復版）
app.post('/webhook/form-submit', async (req, res) => {
  try {
    const formData = req.body;
    console.log('=== 收到表單提交資料 ===');
    console.log('資料:', JSON.stringify(formData, null, 2));
    
    // 修復欄位名稱匹配問題
    const eventName = formData['活動名稱'] || formData['活動標題'] || '未命名活動';
    const eventDate = formData['開始日期'] || formData['活動開始日期'] || '待定';
    const eventLocation = formData['活動地點'] || formData['活動縣市'] || '待定';
    const organizer = formData['主辦單位'] || formData['活動主辦人或單位'] || '未知';
    
    // 修復 LINE 使用者 ID 欄位名稱
    const lineUserId = formData['LINE使用者ID'] || 
                      formData['LINE使用者ID（系統自動填寫，請保留我們才能通知您哦）'] || 
                      formData['LINE使用者ID（系統自動填寫，請保留我們才能通知您哦)'] ||
                      '';
    
    console.log('解析結果:');
    console.log('活動名稱:', eventName);
    console.log('活動日期:', eventDate);
    console.log('活動地點:', eventLocation);
    console.log('主辦單位:', organizer);
    console.log('LINE使用者ID:', lineUserId);
    console.log('LINE使用者ID長度:', lineUserId ? lineUserId.length : 0);
    
    // 檢查並發送確認訊息
    if (lineUserId && lineUserId.trim() !== '' && lineUserId !== 'connection_test_123') {
      console.log('準備發送 LINE 訊息給:', lineUserId);
      
      const success = await sendLineMessage(lineUserId, {
        type: 'text',
        text: `✅ 您的活動資料已收到！\n\n📅 活動名稱：${eventName}\n📍 活動地點：${eventLocation}\n📊 主辦單位：${organizer}\n⏰ 開始日期：${eventDate}\n\n系統正在處理中，稍後會提供活動報名網址給您。感謝您的耐心等候！`
      });
      
      if (success) {
        console.log('✅ 確認訊息發送成功');
      } else {
        console.log('❌ 確認訊息發送失敗');
      }
    } else {
      console.log('⚠️ 沒有有效的 LINE 使用者 ID，無法發送確認訊息');
      console.log('原始 LINE ID 值:', JSON.stringify(lineUserId));
    }
    
    res.json({ 
      success: true, 
      message: '表單處理完成',
      eventName: eventName,
      hasLineUserId: !!(lineUserId && lineUserId.trim() !== ''),
      lineUserIdFound: lineUserId || 'not found'
    });
    
  } catch (error) {
    console.error('處理表單提交錯誤:', error);
    res.status(500).json({ error: error.message });
  }
});

// 修復版發送 LINE 訊息函數
async function sendLineMessage(userId, message) {
  try {
    console.log('發送 LINE 訊息函數被調用');
    console.log('目標使用者 ID:', userId);
    console.log('使用者 ID 類型:', typeof userId);
    console.log('使用者 ID 長度:', userId ? userId.length : 0);
    
    if (!config.channelAccessToken) {
      throw new Error('LINE Channel Access Token 未設定');
    }
    
    // 驗證使用者 ID 格式
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('無效的使用者 ID: ' + JSON.stringify(userId));
    }
    
    // 清理使用者 ID（移除可能的空白字符）
    const cleanUserId = userId.trim();
    
    // 檢查 LINE User ID 格式（通常以 U 開頭，33個字符）
    if (!cleanUserId.startsWith('U') || cleanUserId.length !== 33) {
      console.log('⚠️ 使用者 ID 格式可能不正確:', cleanUserId);
      console.log('長度:', cleanUserId.length, '預期: 33');
    }
    
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
        }
      }
    );
    
    console.log('LINE API 回應狀態:', response.status);
    console.log('LINE API 回應資料:', response.data);
    return true;
    
  } catch (error) {
    console.error('發送 LINE 訊息失敗:');
    console.error('錯誤類型:', error.name);
    console.error('錯誤訊息:', error.message);
    
    if (error.response) {
      console.error('HTTP 狀態碼:', error.response.status);
      console.error('回應資料:', error.response.data);
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
      console.log('沒有事件需要處理');
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
    console.log('處理事件:', event);
    
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
            text: '請點擊下方按鈕開始建立活動',
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
          text: `✅ 系統正常運作！\n\n👤 您的 User ID:\n${userId}\n\n🎯 請輸入「建立活動」來開始建立新活動\n\n💡 提示：建立活動時會自動填入您的 LINE ID，完成後會收到確認訊息！`
        });
      } else {
        await sendReplyMessage(replyToken, {
          type: 'text',
          text: `👋 您好！歡迎使用 GoDoor 活動小幫手！\n\n🎯 請輸入「建立活動」來開始建立新活動\n🔧 輸入「測試」來檢查系統狀態\n\n您的訊息：${text}`
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
});
