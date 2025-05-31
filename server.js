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
  token: process.env.BROWSERLESS_TOKEN || 'demo', // 需要註冊取得免費 token
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
    message: 'GoDoor LINE System with Browserless Auto Upload is running!',
    timestamp: new Date().toISOString(),
    config: {
      hasAccessToken: !!config.channelAccessToken,
      hasSecret: !!config.channelSecret,
      hasPrefillUrl: !!process.env.GOOGLE_FORM_PREFILL_URL,
      hasFormUrl: !!process.env.GOOGLE_FORM_URL
    },
    features: {
      autoUpload: true,
      method: 'Browserless Cloud Service',
      browserless: !!browserlessConfig.token
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
                ⚡ 真正自動化，完全免費
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

// 處理表單提交通知（真正自動上架版）
app.post('/webhook/form-submit', async (req, res) => {
  try {
    const formData = req.body;
    console.log('=== 收到表單提交資料 ===');
    console.log('資料:', JSON.stringify(formData, null, 2));
    
    // 解析活動資料
    const eventInfo = parseEventData(formData);
    console.log('解析的活動資訊:', eventInfo);
    
    // 發送初始確認訊息
    if (eventInfo.lineUserId && eventInfo.lineUserId.trim() !== '' && eventInfo.lineUserId !== 'connection_test_123') {
      console.log('準備發送初始確認訊息給:', eventInfo.lineUserId);
      
      await sendLineMessage(eventInfo.lineUserId, {
        type: 'text',
        text: `✅ 您的活動資料已收到！\n\n📅 活動名稱：${eventInfo.name}\n📍 活動地點：${eventInfo.location}\n📊 主辦單位：${eventInfo.organizer}\n⏰ 開始日期：${eventInfo.startDate}\n\n🚀 系統正在自動上架到果多後台，預計需要 2-3 分鐘，完成後會立即提供報名網址！`
      });
    }

    // 檢查是否需要上架到果多
    const shouldUpload = formData['要將活動公開曝光到果多APP上嗎？'] === '要（果多APP和果多LINE上的推薦活動上可以看到此活動）';
    
    if (shouldUpload) {
      console.log('🚀 開始真正自動上架到果多後台...');
      
      // 異步處理自動上架
      setImmediate(async () => {
        try {
          const uploadResult = await uploadToGoDoorWithBrowserless(eventInfo);
          
          if (uploadResult.success && eventInfo.lineUserId) {
            // 發送成功通知
            await sendLineMessage(eventInfo.lineUserId, {
              type: 'text',
              text: `🎉 太棒了！您的活動已成功上架到果多！\n\n📅 活動名稱：${eventInfo.name}\n🌐 報名網址：${uploadResult.eventUrl}\n\n現在大家都可以在果多APP上看到您的活動並報名了！\n\n請將報名網址分享給想參加的朋友：\n${uploadResult.eventUrl}`
            });
          } else if (eventInfo.lineUserId) {
            // 發送失敗通知
            await sendLineMessage(eventInfo.lineUserId, {
              type: 'text',
              text: `❌ 抱歉，自動上架到果多時遇到問題：\n\n${uploadResult.error || '未知錯誤'}\n\n請聯繫管理員協助處理，或稍後重試。您的活動資料已安全保存。`
            });
          }
        } catch (error) {
          console.error('自動上架處理錯誤:', error);
          if (eventInfo.lineUserId) {
            await sendLineMessage(eventInfo.lineUserId, {
              type: 'text',
              text: `❌ 自動上架時發生系統錯誤，請聯繫管理員。您的活動資料已安全保存。`
            });
          }
        }
      });
    } else {
      console.log('⏭️ 使用者選擇不上架到果多APP');
    }
    
    res.json({ 
      success: true, 
      message: '表單處理完成',
      eventName: eventInfo.name,
      hasLineUserId: !!eventInfo.lineUserId,
      willUpload: shouldUpload
    });
    
  } catch (error) {
    console.error('處理表單提交錯誤:', error);
    res.status(500).json({ error: error.message });
  }
});

// 解析活動資料
function parseEventData(formData) {
  const eventName = formData['活動名稱'] || formData['活動標題'] || '未命名活動';
  const eventDate = formData['開始日期'] || formData['活動開始日期'] || '待定';
  const eventLocation = formData['活動地點'] || formData['活動縣市'] || '待定';
  const organizer = formData['主辦單位'] || formData['活動主辦人或單位'] || '未知';
  
  const lineUserId = formData['LINE使用者ID'] || 
                    formData['LINE使用者ID（系統自動填寫，請保留我們才能通知您哦）'] || 
                    formData['LINE使用者ID（系統自動填寫，請保留我們才能通知您哦)'] ||
                    '';

  return {
    name: eventName,
    description: formData['活動描述'] || formData['活動內容或備註（請盡量詳盡）'] || '',
    startDate: eventDate,
    startTime: formData['開始時間'] || formData['活動開始時間'] || '10:00',
    endDate: formData['結束日期'] || formData['活動結束日期'] || eventDate,
    endTime: formData['結束時間'] || formData['活動結束時間'] || '18:00',
    location: eventLocation,
    address: formData['詳細地址'] || formData['地址或地點說明'] || '',
    organizer: organizer,
    maxParticipants: formData['人數上限'] || formData['活動人數上限'] || '50',
    price: formData['活動費用'] || '0',
    category: formData['活動類別'] || formData['活動分類'] || '其他',
    contact: formData['聯絡資訊'] || '',
    phone: formData['聯絡電話'] || '',
    email: formData['聯絡Email'] || '',
    lineUserId: lineUserId,
    requirements: formData['參加條件'] || '',
    notes: formData['備註'] || formData['活動內容或備註（請盡量詳盡）'] || ''
  };
}

// 使用 Browserless 服務自動上架到果多
async function uploadToGoDoorWithBrowserless(eventData) {
  try {
    console.log('🚀 使用 Browserless 服務開始自動上架...');
    
    // 建立 Puppeteer 腳本
    const puppeteerScript = `
      const puppeteer = require('puppeteer');
      
      (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        try {
          // 前往果多後台
          await page.goto('${goDoorConfig.baseUrl}', { waitUntil: 'networkidle2' });
          
          // 檢查是否需要登入
          const needLogin = await page.$('input[type="password"]') !== null;
          
          if (needLogin) {
            // 填入登入資訊
            await page.type('input[type="text"], input[name*="user"]', '${goDoorConfig.username}');
            await page.type('input[type="password"]', '${goDoorConfig.password}');
            
            // 點擊登入
            await page.click('button[type="submit"], input[type="submit"]');
            await page.waitForNavigation();
          }
          
          // 尋找新增活動功能
          const createButtons = await page.$$('a, button');
          for (let button of createButtons) {
            const text = await page.evaluate(el => el.textContent.toLowerCase(), button);
            if (text.includes('活動') && text.includes('新增')) {
              await button.click();
              break;
            }
          }
          
          await page.waitForTimeout(2000);
          
          // 填寫活動表單
          const fields = {
            '活動名稱': '${eventData.name}',
            '活動描述': '${eventData.description}',
            '開始日期': '${eventData.startDate}',
            '開始時間': '${eventData.startTime}',
            '活動地點': '${eventData.location}',
            '主辦單位': '${eventData.organizer}',
            '人數上限': '${eventData.maxParticipants}',
            '活動費用': '${eventData.price}'
          };
          
          for (const [fieldName, value] of Object.entries(fields)) {
            const input = await page.$(\`input[name*="\${fieldName}"], textarea[name*="\${fieldName}"], input[placeholder*="\${fieldName}"]\`);
            if (input) {
              await input.click();
              await input.clear();
              await input.type(value);
            }
          }
          
          // 提交表單
          const submitButton = await page.$('button[type="submit"], input[type="submit"]');
          if (submitButton) {
            await submitButton.click();
            await page.waitForTimeout(3000);
          }
          
          // 取得活動網址
          let eventUrl = page.url();
          if (!eventUrl.includes('/event/')) {
            const eventLinks = await page.$$('a[href*="/event/"]');
            if (eventLinks.length > 0) {
              eventUrl = await page.evaluate(el => el.href, eventLinks[eventLinks.length - 1]);
            }
          }
          
          console.log(JSON.stringify({ success: true, eventUrl: eventUrl }));
          
        } catch (error) {
          console.log(JSON.stringify({ success: false, error: error.message }));
        } finally {
          await browser.close();
        }
      })();
    `;
    
    // 發送到 Browserless
    const response = await axios.post(
      `${browserlessConfig.baseUrl}/function?token=${browserlessConfig.token}`,
      {
        code: puppeteerScript,
        context: {}
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 秒超時
      }
    );
    
    const result = JSON.parse(response.data);
    
    if (result.success) {
      console.log('✅ Browserless 自動上架成功:', result.eventUrl);
      return {
        success: true,
        eventUrl: result.eventUrl,
        message: '活動已成功上架到果多後台'
      };
    } else {
      throw new Error(result.error);
    }
    
  } catch (error) {
    console.error('❌ Browserless 自動上架失敗:', error);
    return {
      success: false,
      error: error.message,
      message: '活動上架失敗'
    };
  }
}

// 手動測試自動上架 API
app.post('/test-upload', async (req, res) => {
  try {
    const testEventData = {
      name: 'Browserless 測試活動',
      description: '這是一個使用 Browserless 服務的測試活動',
      startDate: '2025-06-15',
      startTime: '10:00',
      location: '台北市',
      organizer: '測試主辦',
      maxParticipants: '50',
      price: '0'
    };

    const result = await uploadToGoDoorWithBrowserless(testEventData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 發送 LINE 訊息函數
async function sendLineMessage(userId, message) {
  try {
    if (!config.channelAccessToken) {
      throw new Error('LINE Channel Access Token 未設定');
    }
    
    const cleanUserId = userId.trim();
    
    const requestBody = {
      to: cleanUserId,
      messages: [message]
    };
    
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
    
    console.log('LINE 訊息發送成功:', response.status);
    return true;
    
  } catch (error) {
    console.error('發送 LINE 訊息失敗:', error.response?.data || error.message);
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
          text: `✅ 系統正常運作！\n\n👤 您的 User ID:\n${userId}\n\n🎯 請輸入「建立活動」來開始建立新活動\n\n🚀 雲端自動上架功能已啟用！`
        });
      } else {
        await sendReplyMessage(replyToken, {
          type: 'text',
          text: `👋 您好！歡迎使用 GoDoor 活動小幫手！\n\n🎯 請輸入「建立活動」來開始建立新活動\n🔧 輸入「測試」來檢查系統狀態\n🚀 雲端自動上架功能\n\n您的訊息：${text}`
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
  console.log(`🤖 Test upload: POST /test-upload`);
  console.log(`🌐 Browserless Auto Upload: ENABLED`);
});
