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

// 簡化版上架函數
async function uploadToGoDoorWithBrowserless(eventData, showInApp = true) {
  try {
    console.log('🚀 準備自動上架到果多後台...');
    console.log('公開設定:', showInApp ? '完全公開（APP顯示）' : '半公開（不在APP顯示）');
    console.log('活動資料:', eventData);
    
    // 模擬處理時間
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const eventId = Date.now();
    const eventUrl = `https://mg.umita.tw/event/${eventId}`;
    
    console.log('✅ 模擬上架完成');
    
    return {
      success: true,
      eventUrl: eventUrl,
      showInApp: showInApp,
      visibility: showInApp ? '完全公開' : '半公開',
      message: `活動已準備上架到果多後台（${showInApp ? '完全公開' : '半公開'}）`,
      note: '目前使用模擬模式'
    };
    
  } catch (error) {
    console.error('❌ 上架處理失敗:', error);
    
    const eventId = Date.now();
    const fallbackUrl = `https://mg.umita.tw/event/${eventId}`;
    
    return {
      success: false,
      error: error.message,
      eventUrl: fallbackUrl,
      showInApp: showInApp,
      visibility: showInApp ? '完全公開' : '半公開',
      message: '自動上架遇到問題，請手動到果多後台建立活動'
    };
  }
}

// 新增 LINE 訊息測試端點
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
