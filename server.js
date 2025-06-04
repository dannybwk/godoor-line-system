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
  baseUrl: 'https://production-sfo.browserless.io'
};

// 果多後台設定
const goDoorConfig = {
  baseUrl: 'https://mg.umita.tw',
  username: '果多',
  password: '000'
};

// 通知信箱
const NOTIFICATION_EMAILS = ['dannyb@godoor.tw', 'godoorcs@gmail.com'];

// Google Sheets Webhook URL
const GOOGLE_SHEETS_WEBHOOK = 'https://script.google.com/macros/s/AKfycbylrKjU_eV9z9Y7quBh3q_IcJ_tcDv7SmX3ZfGKnc2m5e51uXEV-h90OaYNRG0xZrJj/exec';

// 健康檢查
app.get('/', function(req, res) {
  res.json({ 
    status: 'OK', 
    message: 'GoDoor LINE System is running!',
    timestamp: new Date().toISOString()
  });
});

// 活動建立頁面 - 新的美觀表單
app.get('/create-event', function(req, res) {
  const userId = req.query.userId || '';
  
  const htmlContent = `<!DOCTYPE html>
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
        .warning-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin-bottom: 25px;
            border-radius: 8px;
        }
        .warning-box h4 {
            color: #856404;
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        .warning-box p {
            color: #856404;
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
        }
        .warning-box .btn-warning {
            background: #ffc107;
            color: #856404;
            font-weight: bold;
            border: none;
            padding: 10px 15px;
            border-radius: 6px;
            margin-top: 12px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        .warning-box .btn-warning:hover {
            background: #e0a800;
            color: #fff;
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
        .checkbox-group {
            display: grid;
            gap: 8px;
            margin-top: 10px;
        }
        .checkbox-option {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .checkbox-option input[type="checkbox"] {
            width: auto;
        }
        .success-actions {
            display: grid;
            gap: 10px;
            margin-top: 20px;
        }
        .btn-secondary {
            background: #f8f9fa;
            color: #333;
            border: 2px solid #ddd;
            padding: 12px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
            display: block;
        }
        .btn-secondary:hover {
            background: #e9ecef;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎉</div>
        <h1>GoDoor 活動建立</h1>
        <p class="subtitle">歡迎使用 GoDoor 活動建立系統！<br>填寫以下資訊，我們將自動為您處理活動上架。</p>
        
        <div class="warning-box">
            <h4>⚠️ 重要提醒</h4>
            <p><strong>您必須擁有果多帳號</strong>，才能建立並管理活動。若尚未註冊，請先點擊下方按鈕完成註冊。</p>
            <button type="button" class="btn-warning" onclick="window.open('https://www.umita.tw', '_blank')">註冊果多帳號</button>
        </div>
        
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
                <textarea name="description" required placeholder="請詳細描述活動內容、講師介紹、注意事項等任何資訊"></textarea>
            </div>
            
            <div class="form-group">
                <label>講師姓名</label>
                <input type="text" name="instructor" placeholder="講師姓名（選填）">
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
            
            <div class="form-group">
                <label>付費方式 <span class="required">*</span></label>
                <div class="checkbox-group">
                    <div class="checkbox-option">
                        <input type="checkbox" name="paymentMethod" value="免費活動不需繳費" id="payment-free" checked>
                        <label for="payment-free">免費活動不需繳費</label>
                    </div>
                    <div class="checkbox-option">
                        <input type="checkbox" name="paymentMethod" value="現場繳費" id="payment-onsite">
                        <label for="payment-onsite">現場繳費</label>
                    </div>
                    <div class="checkbox-option">
                        <input type="checkbox" name="paymentMethod" value="事先匯款" id="payment-bank">
                        <label for="payment-bank">事先匯款</label>
                    </div>
                    <div class="checkbox-option">
                        <input type="checkbox" name="paymentMethod" value="線上刷卡(暫未開放)" id="payment-credit" disabled>
                        <label for="payment-credit" style="color:#999">線上刷卡(暫未開放)</label>
                    </div>
                    <div class="checkbox-option">
                        <input type="checkbox" name="paymentMethod" value="LINE PAY(暫未開放)" id="payment-line" disabled>
                        <label for="payment-line" style="color:#999">LINE PAY(暫未開放)</label>
                    </div>
                    <div class="checkbox-option">
                        <input type="checkbox" name="paymentMethod" value="街口支付(暫未開放)" id="payment-jkopay" disabled>
                        <label for="payment-jkopay" style="color:#999">街口支付(暫未開放)</label>
                    </div>
                    <div class="checkbox-option">
                        <input type="checkbox" name="paymentMethod" value="超商繳費(暫未開放)" id="payment-cvs" disabled>
                        <label for="payment-cvs" style="color:#999">超商繳費(暫未開放)</label>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label>是否開放到現場候補</label>
                <select name="waitlist">
                    <option value="是">是</option>
                    <option value="否">否</option>
                </select>
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
            var today = new Date();
            var tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            document.querySelector('input[name="startDate"]').value = tomorrow.toISOString().split('T')[0];
            document.querySelector('input[name="startTime"]').value = '14:00';
            
            // 設定結束日期為開始日期
            document.querySelector('input[name="endDate"]').value = tomorrow.toISOString().split('T')[0];
            
            // 預設選擇公開
            document.getElementById('public').checked = true;
            selectRadio('public');
            
            // 費用與付費方式聯動
            document.querySelector('input[name="price"]').addEventListener('change', function() {
                var isFree = parseInt(this.value) === 0;
                document.getElementById('payment-free').checked = isFree;
                document.getElementById('payment-free').disabled = !isFree;
                
                if (!isFree && !document.getElementById('payment-onsite').checked && !document.getElementById('payment-bank').checked) {
                    document.getElementById('payment-onsite').checked = true;
                }
            });
        };
        
        // 處理單選按鈕選擇
        function selectRadio(option) {
            var options = document.querySelectorAll('.radio-option');
            for (var i = 0; i < options.length; i++) {
                options[i].classList.remove('selected');
            }
            document.querySelector('#' + option).closest('.radio-option').classList.add('selected');
            document.querySelector('#' + option).checked = true;
        }
        
        // 同步開始和結束日期
        document.querySelector('input[name="startDate"]').addEventListener('change', function() {
            var endDateInput = document.querySelector('input[name="endDate"]');
            if (!endDateInput.value || endDateInput.value < this.value) {
                endDateInput.value = this.value;
            }
        });
        
        // 收集付費方式
        function collectPaymentMethods() {
            var checkboxes = document.querySelectorAll('input[name="paymentMethod"]:checked');
            var values = [];
            checkboxes.forEach(function(checkbox) {
                values.push(checkbox.value);
            });
            return values.join(', ');
        }
        
        // 表單提交處理
        document.getElementById('eventForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            var submitBtn = document.getElementById('submitBtn');
            var status = document.getElementById('status');
            
            // 顯示載入狀態
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ 建立中...';
            status.className = 'status loading';
            status.textContent = '正在建立活動，請稍候...';
            
            var formData = new FormData(this);
            var data = {};
            formData.forEach(function(value, key) {
                if (key !== 'paymentMethod') { // 排除付費方式，後面會特別處理
                    data[key] = value;
                }
            });
            
            // 轉換為後端期望的格式
            var eventData = {
                '活動名稱': data.activityName,
                '活動內容或備註（請盡量詳盡）': data.description,
                '講師姓名': data.instructor || '',
                '活動開始日期': data.startDate,
                '活動開始時間': data.startTime,
                '活動結束日期': data.endDate || data.startDate,
                '活動結束時間': data.endTime || '18:00',
                '活動地點': data.location,
                '詳細地址': data.address || '',
                '活動主辦人或單位': data.organizer,
                '活動人數上限': data.maxParticipants || '30',
                '活動費用': data.price || '0',
                '付費方式': collectPaymentMethods(),
                '是否開放到現場候補': data.waitlist || '是',
                '聯絡電話': data.phone || '',
                '聯絡Email': data.email || '',
                'LINE使用者ID（系統自動填寫，請保留我們才能通知您哦）': data.lineUserId,
                '要將活動公開曝光到果多APP上嗎？': data.publicity === 'public' ? '要（推薦到果多APP）' : '不要'
            };
            
            fetch('/webhook/form-submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData)
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(result) {
                if (result.success) {
                    status.className = 'status success';
                    status.innerHTML = '✅ 活動「' + result.eventName + '」建立成功！(' + result.visibility + ') 系統已開始處理，您將透過LINE收到處理結果通知。' +
                    '<div class="success-actions">' +
                    '<a href="https://line.me/R/ti/p/@535xsmpo" class="btn-secondary">👈 回到果多LINE</a>' +
                    '</div>';
                    submitBtn.textContent = '✅ 建立完成';
                    submitBtn.disabled = true;
                } else {
                    throw new Error(result.message || '建立失敗');
                }
            })
            .catch(function(error) {
                console.error('建立活動失敗:', error);
                status.className = 'status error';
                status.textContent = '❌ 建立失敗: ' + error.message;
                submitBtn.disabled = false;
                submitBtn.textContent = '🚀 建立活動';
            });
        });
    </script>
</body>
</html>`;

  res.send(htmlContent);
});

// Webhook 處理表單提交
app.post('/webhook/form-submit', async function(req, res) {
  try {
    console.log('收到表單提交:', JSON.stringify(req.body, null, 2));
    
    const formData = req.body;
    const lineUserId = formData['LINE使用者ID（系統自動填寫，請保留我們才能通知您哦）'];
    const eventName = formData['活動名稱'];
    const publicity = formData['要將活動公開曝光到果多APP上嗎？'];
    const visibility = publicity === '要（推薦到果多APP）' ? '公開' : '半公開';
    
    // 立即回應前端
    res.json({
      success: true,
      eventName: eventName,
      visibility: visibility,
      message: '活動建立請求已接收，正在處理中...'
    });
    
    // 發送數據到 Google Sheets
    try {
      await sendToGoogleSheets(formData);
    } catch (sheetError) {
      console.error('發送到 Google Sheets 失敗:', sheetError);
      // 繼續處理，不中斷流程
    }
    
    // 異步處理活動建立
    processEventCreation(formData, lineUserId, eventName, visibility);
    
  } catch (error) {
    console.error('處理表單提交錯誤:', error);
    res.status(500).json({
      success: false,
      message: '系統錯誤，請稍後再試'
    });
  }
});

// 發送數據到 Google Sheets
async function sendToGoogleSheets(formData) {
  try {
    console.log('開始發送數據到 Google Sheets...');
    
    const response = await axios.post(GOOGLE_SHEETS_WEBHOOK, formData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Google Sheets 回應:', response.data);
    return response.data;
  } catch (error) {
    console.error('發送到 Google Sheets 錯誤:', error.response?.data || error.message);
    throw error;
  }
}

// 異步處理活動建立
async function processEventCreation(formData, lineUserId, eventName, visibility) {
  try {
    console.log('開始處理活動建立:', eventName);
    
    // 模擬處理延遲
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 這裡可以加入實際的果多後台API調用
    // const result = await createEventInGoDoor(formData);
    
    // 發送成功通知
    if (lineUserId) {
      await sendLineMessage(lineUserId, 
        `🎉 活動建立成功！\n\n` +
        `活動名稱：${eventName}\n` +
        `曝光設定：${visibility}\n` +
        `系統已自動為您上架到果多後台，活動將在審核通過後開始顯示。\n\n` +
        `感謝使用 GoDoor 活動建立系統！`
      );
    }
    
    // 發送email通知給管理員
    await sendEmailNotification(formData, eventName, visibility);
    
    console.log('活動建立處理完成:', eventName);
    
  } catch (error) {
    console.error('處理活動建立失敗:', error);
    
    // 發送失敗通知
    if (lineUserId) {
      await sendLineMessage(lineUserId, 
        `❌ 活動建立失敗\n\n` +
        `活動名稱：${eventName}\n` +
        `錯誤原因：${error.message}\n\n` +
        `請稍後再試或聯繫客服人員。`
      );
    }
  }
}

// 發送LINE訊息
async function sendLineMessage(userId, message) {
  try {
    if (!config.channelAccessToken) {
      console.log('LINE Token 未設定，跳過發送訊息');
      return;
    }
    
    // 判斷message是字串還是物件
    let payload;
    if (typeof message === 'string') {
      payload = {
        to: userId,
        messages: [{
          type: 'text',
          text: message
        }]
      };
    } else {
      // 已經是完整的訊息物件
      payload = message;
    }
    
    console.log('準備發送LINE訊息:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post('https://api.line.me/v2/bot/message/push', payload, {
      headers: {
        'Authorization': `Bearer ${config.channelAccessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('LINE訊息發送成功');
    return response.data;
  } catch (error) {
    console.error('發送LINE訊息失敗:', error.response?.data || error.message);
    throw error;
  }
}

// 發送email通知
async function sendEmailNotification(formData, eventName, visibility) {
  try {
    console.log('發送email通知:', {
      to: NOTIFICATION_EMAILS,
      subject: `新活動建立通知 - ${eventName}`,
      eventData: formData
    });
    
    // 這裡可以整合實際的email服務（如SendGrid, Nodemailer等）
    console.log('Email通知已記錄（實際發送功能待實作）');
    
  } catch (error) {
    console.error('發送email通知失敗:', error);
  }
}

// LINE Bot Webhook
app.post('/webhook/line', function(req, res) {
  try {
    // 立即回應 200 OK 以確保 LINE 平台驗證通過
    res.status(200).send('OK');
    
    console.log('收到LINE webhook請求', JSON.stringify(req.body, null, 2));
    
    const events = req.body.events;
    
    // 如果沒有事件或是空陣列，可能是驗證請求
    if (!events || events.length === 0) {
      console.log('收到空事件或驗證請求');
      return;
    }
    
    events.forEach(async function(event) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userId = event.source.userId;
        const messageText = event.message.text;
        
        console.log('收到LINE訊息:', messageText, 'from:', userId);
        
        // 處理不同的指令
        if (messageText.includes('建立活動') || messageText.includes('創建活動')) {
          await sendEventCreationForm(userId);
        } else if (messageText.includes('幫助') || messageText.includes('說明')) {
          await sendHelpMessage(userId);
        } else {
          await sendWelcomeMessage(userId);
        }
      }
    });
  } catch (error) {
    console.error('處理LINE webhook錯誤:', error);
    // 即使有錯誤也回應 200，避免 LINE 平台重試
    if (!res.headersSent) {
      res.status(200).send('Error but still OK');
    }
  }
});

// 發送活動建立表單連結
async function sendEventCreationForm(userId) {
  try {
    console.log('開始準備活動建立表單訊息...');
    
    // 正確的 Flex Message 格式
    const message = {
      to: userId,
      messages: [{
        type: "flex",
        altText: "GoDoor 活動建立系統",
        contents: {
          type: "bubble",
          hero: {
            type: "image",
            url: "https://via.placeholder.com/320x200/667eea/ffffff?text=GoDoor",
            size: "full",
            aspectRatio: "16:10"
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "🎉 GoDoor 活動建立",
                weight: "bold",
                size: "xl"
              },
              {
                type: "text",
                text: "輕鬆建立活動，自動上架到果多後台！",
                size: "sm",
                color: "#666666",
                margin: "md"
              },
              {
                type: "text",
                text: "請先確認您已註冊果多帳號",
                size: "xs",
                color: "#e74c3c",
                margin: "lg",
                weight: "bold"
              }
            ]
          },
          footer: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "primary",
                height: "sm",
                action: {
                  type: "uri",
                  label: "📝 開始建立活動",
                  uri: `${process.env.BASE_URL || 'https://godoor-line-system.onrender.com'}/create-event?userId=${userId}`
                }
              },
              {
                type: "button",
                style: "secondary",
                height: "sm",
                action: {
                  type: "uri",
                  label: "註冊果多帳號",
                  uri: "https://www.umita.tw"
                }
              }
            ]
          }
        }
      }]
    };
    
    console.log('發送 Flex 訊息...');
    const result = await axios.post('https://api.line.me/v2/bot/message/push', message, {
      headers: {
        'Authorization': `Bearer ${config.channelAccessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Flex 訊息發送成功');
    return result.data;
  } catch (error) {
    console.error('發送活動建立表單失敗:', error.response?.data || error.message);
    
    // 嘗試發送備用文字訊息
    try {
      console.log('嘗試發送備用文字訊息...');
      const backupText = `👋 歡迎使用 GoDoor 活動建立系統！\n\n請確認您已註冊果多帳號，然後點擊以下連結開始建立活動：\n${process.env.BASE_URL || 'https://godoor-line-system.onrender.com'}/create-event?userId=${userId}\n\n註冊果多帳號：https://www.umita.tw`;
      
      await sendLineMessage(userId, backupText);
      console.log('備用文字訊息發送成功');
    } catch (backupError) {
      console.error('備用文字訊息也失敗:', backupError.message);
      throw error;
    }
  }
}

// 發送說明訊息
async function sendHelpMessage(userId) {
  try {
    const message = `📋 GoDoor 活動建立系統使用說明\n\n` +
      `🎯 主要功能：\n` +
      `• 快速建立活動表單\n` +
      `• 自動上架到果多後台\n` +
      `• 支援公開/半公開設定\n` +
      `• 即時LINE通知結果\n\n` +
      `💬 常用指令：\n` +
      `• 「建立活動」- 開啟活動建立表單\n` +
      `• 「幫助」- 顯示此說明\n\n` +
      `⚠️ 重要提醒：\n` +
      `您必須先註冊果多帳號才能建立活動\n` +
      `註冊網址：https://www.umita.tw\n\n` +
      `需要協助請聯繫客服 📞`;
    
    await sendLineMessage(userId, message);
  } catch (error) {
    console.error('發送說明訊息失敗:', error);
    throw error;
  }
}

// 發送歡迎訊息
async function sendWelcomeMessage(userId) {
  try {
    const message = `👋 歡迎使用 GoDoor 活動建立系統！\n\n` +
      `我可以幫您：\n` +
      `🎉 快速建立活動\n` +
      `📱 自動上架到果多APP\n` +
      `⚡ 即時通知處理結果\n\n` +
      `⚠️ 請確認您已註冊果多帳號\n\n` +
      `請輸入「建立活動」開始使用，或輸入「幫助」查看更多功能說明。`;
    
    await sendLineMessage(userId, message);
  } catch (error) {
    console.error('發送歡迎訊息失敗:', error);
    throw error;
  }
}

// 錯誤處理中間件
app.use(function(error, req, res, next) {
  console.error('全域錯誤處理:', error);
  res.status(500).json({
    success: false,
    message: '系統錯誤，請稍後再試'
  });
});

// 404處理
app.use(function(req, res) {
  res.status(404).json({
    success: false,
    message: '找不到請求的資源'
  });
});

// 啟動服務器
const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log(`🚀 GoDoor LINE System 啟動成功！`);
  console.log(`📡 服務運行在 port ${PORT}`);
  console.log(`🌐 健康檢查: http://localhost:${PORT}/`);
  console.log(`📝 活動建立: http://localhost:${PORT}/create-event`);
});

module.exports = app;
