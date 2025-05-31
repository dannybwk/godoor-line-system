const express = require('express');
const cors = require('cors');
const line = require('@line/bot-sdk');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(express.json());

// LINE Bot 設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.Client(config);

// Google Sheets 設定
let sheets;
if (process.env.GOOGLE_CREDENTIALS) {
  const googleAuth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  sheets = google.sheets({ version: 'v4', auth: googleAuth });
}

// 健康檢查
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'GoDoor LINE System is running!',
    timestamp: new Date().toISOString(),
    services: {
      line: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
      google: !!process.env.GOOGLE_CREDENTIALS,
      sheets: !!sheets
    }
  });
});

// 處理表單提交通知
app.post('/webhook/form-submit', async (req, res) => {
  try {
    const formData = req.body;
    console.log('收到表單提交:', formData);
    
    // 如果有 LINE 使用者 ID，發送確認訊息
    if (formData.lineUserId && client) {
      const confirmMessage = {
        type: 'text',
        text: `✅ 您的活動「${formData.eventName || '未命名活動'}」資料已收到！\n\n系統正在處理中，稍後會提供活動報名網址給您。`
      };
      
      try {
        await client.pushMessage(formData.lineUserId, confirmMessage);
        console.log('確認訊息已發送');
      } catch (lineError) {
        console.error('發送 LINE 訊息失敗:', lineError);
      }
    }
    
    res.json({ success: true, message: '表單處理完成' });
  } catch (error) {
    console.error('處理表單提交錯誤:', error);
    res.status(500).json({ error: error.message });
  }
});

// 簡單的活動建立頁面（不使用 LIFF）
app.get('/create-event', (req, res) => {
  const formUrl = process.env.GOOGLE_FORM_URL || 'https://forms.google.com/';
  
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GoDoor 活動建立</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
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
            }
            .logo {
                font-size: 48px;
                margin-bottom: 16px;
            }
            h1 {
                color: #333;
                margin-bottom: 16px;
            }
            p {
                color: #666;
                margin-bottom: 24px;
                line-height: 1.5;
            }
            .btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 8px;
                display: inline-block;
                font-weight: bold;
                transition: transform 0.2s;
            }
            .btn:hover {
                transform: translateY(-2px);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🎉</div>
            <h1>GoDoor 活動建立</h1>
            <p>歡迎使用 GoDoor 活動建立系統！<br>點擊下方按鈕開始建立您的活動。</p>
            <a href="${formUrl}" class="btn" target="_blank">開始建立活動</a>
        </div>
    </body>
    </html>
  `);
});

// LINE Webhook
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error('Webhook 錯誤:', err);
      res.status(500).end();
    });
});

// 處理 LINE 事件
async function handleEvent(event) {
  console.log('收到 LINE 事件:', event);
  
  if (event.type === 'message' && event.message.type === 'text') {
    const text = event.message.text;
    const userId = event.source.userId;
    
    if (text.includes('建立活動') || text.includes('新增活動')) {
      const replyMessage = {
        type: 'template',
        altText: '建立活動',
        template: {
          type: 'buttons',
          title: '🎉 建立新活動',
          text: '請點擊下方按鈕開始建立活動',
          actions: [{
            type: 'uri',
            label: '開始建立活動',
            uri: `https://${process.env.RAILWAY_STATIC_URL || 'your-app.railway.app'}/create-event`
          }]
        }
      };
      
      return client.replyMessage(event.replyToken, replyMessage);
    }
    
    if (text.includes('測試') || text === 'test') {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: `✅ 系統正常運作！\n您的 User ID: ${userId}\n\n請輸入「建立活動」來開始建立新活動。`
      });
    }
    
    // 預設回應
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `👋 您好！歡迎使用 GoDoor 活動小幫手！\n\n🎯 請輸入「建立活動」來開始建立新活動\n🔧 輸入「測試」來檢查系統狀態\n\n您的訊息：${text}`
    });
  }
  
  return Promise.resolve(null);
}

// 手動觸發活動檢查的 API
app.post('/api/check-events', async (req, res) => {
  try {
    if (!sheets) {
      throw new Error('Google Sheets 未設定');
    }
    
    // 讀取 Google Sheets 資料
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: '2025活動!A:Z'
    });
    
    const rows = response.data.values;
    console.log('Google Sheets 資料:', rows);
    
    res.json({ 
      success: true, 
      message: '檢查完成',
      rowCount: rows ? rows.length : 0,
      data: rows ? rows.slice(0, 3) : [] // 只顯示前3行作為範例
    });
    
  } catch (error) {
    console.error('檢查活動錯誤:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 LINE Bot webhook: /webhook`);
  console.log(`📝 Form webhook: /webhook/form-submit`);
  console.log(`🎯 Create event page: /create-event`);
});
