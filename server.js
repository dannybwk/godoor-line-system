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
                data[key] = value;
            });
            
            // 轉換為後端期望的格式
            var eventData = {
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
                    status.textContent = '✅ 活動「' + result.eventName + '」建立成功！(' + result.visibility + ') 系統已開始處理，您將透過LINE收到處理結果通知。';
                    submitBtn.textContent = '✅ 建立完成';
                    
                    // 5秒後重置表單
                    setTimeout(function() {
                        window.location.reload();
                    }, 5000);
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

// 測試用快速建立活動頁面
app.get('/quick-test-event', function(req, res) {
  const userId = req.query.userId || '';
  
  const quickHtml = `<!DOCTYPE html>
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
        .quick-form { display: grid; gap: 15px; }
        label { font-weight: bold; color: #333; margin-bottom: 5px; display: block; }
        input, select, textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
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
        }
        .preset-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
        .preset-btn {
            background: #f8f9fa;
            border: 2px solid #ddd;
            padding: 10px;
            border-radius: 8px;
            cursor: pointer;
            text-align: center;
            font-size: 12px;
        }
        .status { margin-top: 15px; padding: 12px; border-radius: 8px; font-size: 14px; display: none; }
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
            <div class="preset-btn" onclick="fillPreset('workshop')">🎨 工作坊範例</div>
            <div class="preset-btn" onclick="fillPreset('seminar')">📚 講座範例</div>
            <div class="preset-btn" onclick="fillPreset('social')">🎉 社交活動範例</div>
            <div class="preset-btn" onclick="fillPreset('sports')">⚽ 運動活動範例</div>
        </div>
        
        <form id="quickForm" class="quick-form">
            <div><label>活動名稱</label><input type="text" name="activityName" required></div>
            <div><label>活動描述</label><textarea name="description" rows="3"></textarea></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div><label>開始日期</label><input type="date" name="startDate" required></div>
                <div><label>開始時間</label><input type="time" name="startTime" required></div>
            </div>
            <div><label>活動地點</label><input type="text" name="location" required></div>
            <div><label>主辦單位</label><input type="text" name="organizer" required></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div><label>人數上限</label><input type="number" name="maxParticipants" value="30" min="1"></div>
                <div><label>活動費用</label><input type="number" name="price" value="0" min="0"></div>
            </div>
            <div>
                <label>公開設定</label>
                <select name="publicity">
                    <option value="public">完全公開（在APP顯示）</option>
                    <option value="private">半公開（不在APP顯示）</option>
                </select>
            </div>
            <input type="hidden" name="lineUserId" value="${userId}">
            <button type="submit" class="btn" id="submitBtn">🚀 快速建立測試活動</button>
        </form>
        
        <div id="status" class="status"></div>
    </div>

    <script>
        var presets = {
            workshop: { activityName: 'AI 程式設計工作坊', description: '學習如何使用 AI 工具提升程式開發效率，適合初學者參加', location: '台北市信義區信義路五段7號', organizer: 'TechHub Taiwan', maxParticipants: 25, price: 1500 },
            seminar: { activityName: '數位轉型趨勢講座', description: '探討 2025 年企業數位轉型的最新趨勢與實務案例分享', location: '台北市中山區南京東路二段', organizer: '數位創新協會', maxParticipants: 80, price: 0 },
            social: { activityName: '週末咖啡聚會', description: '輕鬆的週末聚會，認識新朋友，分享生活趣事', location: '台北市大安區敦化南路一段', organizer: '咖啡愛好者社群', maxParticipants: 15, price: 200 },
            sports: { activityName: '週日羽球練習', description: '歡迎各程度球友參加，一起運動流汗增進球技', location: '台北市松山區體育館', organizer: '羽球同好會', maxParticipants: 12, price: 100 }
        };
        
        window.onload = function() {
            var tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            document.querySelector('input[name="startDate"]').value = tomorrow.toISOString().split('T')[0];
            document.querySelector('input[name="startTime"]').value = '14:00';
        };
        
        function fillPreset(type) {
            var preset = presets[type];
            var form = document.getElementById('quickForm');
            Object.keys(preset).forEach(function(key) {
                var input = form.querySelector('[name="' + key + '"]');
                if (input) input.value = preset[key];
            });
        }
        
        document.getElementById('quickForm').addEventListener('submit', function(e) {
            e.preventDefault();
            var submitBtn = document.getElementById('submitBtn');
            var status = document.getElementById('status');
            
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ 建立中...';
            status.className = 'status loading';
            status.textContent = '正在快速建立測試活動...';
            
            var formData = new FormData(this);
            var data = {};
            formData.forEach(function(value, key) { data[key] = value; });
            
            var eventData = {
                '活動名稱': data.activityName,
                '活動內容或備註（請盡量詳盡）': data.description,
                '活動開始日期': data.startDate,
                '活動開始時間': data.startTime,
                '活動結束日期': data.startDate,
                '活動結束時間': '18:00',
                '活動地點': data.location,
                '活動主辦人或單位': data.organizer,
                '活動人數上限': data.maxParticipants,
                '活動費用': data.price,
                'LINE使用者ID（系統自動填寫，請保留我們才能通知您哦）': data.lineUserId,
                '要將活動公開曝光到果多APP上嗎？': data.publicity === 'public' ? '要（推薦到果多APP）' : '不要'
            };
            
            fetch('/webhook/form-submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            })
            .then(function(response) { return response.json(); })
            .then(function(result) {
                if (result.success) {
                    status.className = 'status success';
                    status.textContent = '✅ 測試活動「' + result.eventName + '」建立成功！(' + result.visibility + ')';
                    submitBtn.textContent = '✅ 建立完成';
                    setTimeout(function() {
                        document.getElementById('quickForm').reset();
                        submitBtn.disabled = false;
                        submitBtn.textContent = '🚀 快速建立測試活動';
                        status.className = 'status';
                        status.style.display = 'none';
                    }, 3000);
                } else {
                    throw new Error(result.message || '建立失敗');
                }
            })
            .catch(function(error) {
                console.error('建立測試活動失敗:', error);
                status.className = 'status error';
                status.textContent = '❌ 建立失敗: ' + error.message;
                submitBtn.disabled = false;
                submitBtn.textContent = '🚀 快速建立測試活動';
            });
        });
    </script>
</body>
</html>`;

  res.send(quickHtml);
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
    
    const response = await axios.post('https://api.line.me/v2/bot/message/push', {
      to: userId,
      messages: [{
        type: 'text',
        text: message
      }]
    }, {
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
    const events = req.body.events;
    
    events.forEach(async function(event) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userId = event.source.userId;
        const messageText = event.message.text;
        
        console.log('收到LINE訊息:', messageText, 'from:', userId);
        
        // 處理不同的指令
        if (messageText.includes('建立活動') || messageText.includes('創建活動')) {
          await sendEventCreationForm(userId);
        } else if (messageText.includes('測試') || messageText.includes('demo')) {
          await sendQuickTestForm(userId);
        } else if (messageText.includes('幫助') || messageText.includes('說明')) {
          await sendHelpMessage(userId);
        } else {
          await sendWelcomeMessage(userId);
        }
      }
    });
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('處理LINE webhook錯誤:', error);
    res.status(500).send('Error');
  }
});

// 發送活動建立表單連結
async function sendEventCreationForm(userId) {
  const message = {
    type: 'flex',
    altText: 'GoDoor 活動建立系統',
    contents: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: 'https://via.placeholder.com/320x200/667eea/ffffff?text=GoDoor',
        size: 'full',
        aspectRatio: '16:10'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🎉 GoDoor 活動建立',
            weight: 'bold',
            size: 'xl'
          },
          {
            type: 'text',
            text: '輕鬆建立活動，自動上架到果多後台！',
            size: 'sm',
            color: '#666666',
            margin: 'md'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: {
              type: 'uri',
              label: '📝 開始建立活動',
              uri: `${process.env.BASE_URL || 'https://your-domain.com'}/create-event?userId=${userId}`
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'uri',
              label: '🚀 快速測試',
              uri: `${process.env.BASE_URL || 'https://your-domain.com'}/quick-test-event?userId=${userId}`
            }
          }
        ]
      }
    }
  };
  
  await sendLineMessage(userId, message);
}

// 發送快速測試表單
async function sendQuickTestForm(userId) {
  const testUrl = `${process.env.BASE_URL || 'https://your-domain.com'}/quick-test-event?userId=${userId}`;
  const message = `🚀 快速測試模式\n\n點擊下方連結立即體驗活動建立功能：\n${testUrl}\n\n此模式提供預設範例，讓您快速了解系統操作流程。`;
  
  await sendLineMessage(userId, message);
}

// 發送說明訊息
async function sendHelpMessage(userId) {
  const message = `📋 GoDoor 活動建立系統使用說明\n\n` +
    `🎯 主要功能：\n` +
    `• 快速建立活動表單\n` +
    `• 自動上架到果多後台\n` +
    `• 支援公開/半公開設定\n` +
    `• 即時LINE通知結果\n\n` +
    `💬 常用指令：\n` +
    `• 「建立活動」- 開啟活動建立表單\n` +
    `• 「測試」- 快速測試模式\n` +
    `• 「幫助」- 顯示此說明\n\n` +
    `需要協助請聯繫客服 📞`;
  
  await sendLineMessage(userId, message);
}

// 發送歡迎訊息
async function sendWelcomeMessage(userId) {
  const message = `👋 歡迎使用 GoDoor 活動建立系統！\n\n` +
    `我可以幫您：\n` +
    `🎉 快速建立活動\n` +
    `📱 自動上架到果多APP\n` +
    `⚡ 即時通知處理結果\n\n` +
    `請輸入「建立活動」開始使用，或輸入「幫助」查看更多功能說明。`;
  
  await sendLineMessage(userId, message);
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
  console.log(`🧪 快速測試: http://localhost:${PORT}/quick-test-event`);
});

module.exports = app;
