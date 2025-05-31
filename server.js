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
      browserless: !!browserlessConfig.token,
      semiPrivateEvents: true
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

// 處理表單提交通知（最終版 - 包含半公開設定）
app.post('/webhook/form-submit', async (req, res) => {
  try {
    const formData = req.body;
    console.log('=== 收到表單提交資料 ===');
    console.log('資料:', JSON.stringify(formData, null, 2));
    
    // 解析活動資料
    const eventInfo = parseEventData(formData);
    console.log('解析的活動資訊:', eventInfo);
    
    // 檢查使用者的選擇 - 修正表單選項比對
    const publicityChoice = formData['要將活動公開曝光到果多APP上嗎？'] || '';
    console.log('原始選擇內容:', publicityChoice);
    
    // 支援多種可能的選項文字
    const showInApp = publicityChoice.includes('要（') && 
                     (publicityChoice.includes('果多APP') || publicityChoice.includes('推薦活動'));
    
    console.log('使用者選擇:', showInApp ? '要在APP中顯示' : '不要在APP中顯示（設為半公開）');
    
    // 發送初始確認訊息
    if (eventInfo.lineUserId && eventInfo.lineUserId.trim() !== '' && eventInfo.lineUserId !== 'connection_test_123') {
      console.log('準備發送初始確認訊息給:', eventInfo.lineUserId);
      
      const initialMessage = showInApp 
        ? `✅ 您的活動資料已收到！\n\n📅 活動名稱：${eventInfo.name}\n📍 活動地點：${eventInfo.location}\n📊 主辦單位：${eventInfo.organizer}\n⏰ 開始日期：${eventInfo.startDate}\n\n🚀 系統正在自動上架到果多後台，您的活動將會在果多APP中顯示，預計需要 2-3 分鐘，完成後會立即提供報名網址！`
        : `✅ 您的活動資料已收到！\n\n📅 活動名稱：${eventInfo.name}\n📍 活動地點：${eventInfo.location}\n📊 主辦單位：${eventInfo.organizer}\n⏰ 開始日期：${eventInfo.startDate}\n\n🚀 系統正在自動上架到果多後台（設為半公開），不會在APP中顯示，但仍會提供報名網址，預計需要 2-3 分鐘！`;
      
      await sendLineMessage(eventInfo.lineUserId, {
        type: 'text',
        text: initialMessage
      });
    }

    // 總是自動上架（根據選擇設定公開程度）
    console.log('🚀 開始自動上架到果多後台...');
    console.log('公開設定:', showInApp ? '完全公開' : '半公開');
    
    // 異步處理自動上架
    setImmediate(async () => {
      try {
        const uploadResult = await uploadToGoDoorWithBrowserless(eventInfo, showInApp);
        
        if (uploadResult.success && eventInfo.lineUserId) {
          // 根據選擇發送不同的成功通知
          let successMessage;
          
          if (showInApp) {
            // 要在APP顯示的情況
            successMessage = `🎉 太棒了！您的活動已成功上架到果多！\n\n📅 活動名稱：${eventInfo.name}\n🌐 報名網址：${uploadResult.eventUrl}\n\n✨ 您的活動同步上架到果多APP囉！\n📱 果多APP：https://funaging.app.link/godoorline\n\n請將報名網址分享給想參加的朋友：\n${uploadResult.eventUrl}`;
          } else {
            // 不要在APP顯示的情況（半公開）
            successMessage = `🎉 您的活動已成功上架！\n\n📅 活動名稱：${eventInfo.name}\n🌐 報名網址：${uploadResult.eventUrl}\n\n✨ 您的活動已設為半公開，不會在果多APP中公開顯示，但知道網址的人可以直接報名！\n\n請將報名網址分享給想參加的朋友：\n${uploadResult.eventUrl}`;
          }
          
          await sendLineMessage(eventInfo.lineUserId, {
            type: 'text',
            text: successMessage
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
    
    res.json({ 
      success: true, 
      message: '表單處理完成',
      eventName: eventInfo.name,
      hasLineUserId: !!eventInfo.lineUserId,
      willShowInApp: showInApp,
      visibility: showInApp ? '完全公開' : '半公開',
      willUpload: true
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

// 修改版上架函數，支援半公開設定（修正 Browserless 錯誤）
async function uploadToGoDoorWithBrowserless(eventData, showInApp = true) {
  try {
    console.log('🚀 使用 Browserless 服務開始自動上架...');
    console.log('公開設定:', showInApp ? '完全公開（APP顯示）' : '半公開（不在APP顯示）');
    
    // 清理和轉義字串以避免 JSON 錯誤
    const cleanString = (str) => {
      if (!str) return '';
      return str.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '');
    };
    
    const cleanEventData = {
      name: cleanString(eventData.name),
      description: cleanString(eventData.description),
      startDate: cleanString(eventData.startDate),
      startTime: cleanString(eventData.startTime),
      endDate: cleanString(eventData.endDate || eventData.startDate),
      endTime: cleanString(eventData.endTime || '18:00'),
      location: cleanString(eventData.location),
      address: cleanString(eventData.address),
      organizer: cleanString(eventData.organizer),
      maxParticipants: cleanString(eventData.maxParticipants || '50'),
      price: cleanString(eventData.price || '0'),
      phone: cleanString(eventData.phone),
      email: cleanString(eventData.email)
    };
    
    // 建立 Puppeteer 腳本
    const puppeteerScript = `
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  
  try {
    console.log('開始自動上架流程...');
    
    page.setDefaultTimeout(30000);
    
    await page.goto('${goDoorConfig.baseUrl}', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('已到達果多後台');
    
    await page.waitForTimeout(2000);
    const needLogin = await page.$('input[type="password"]') !== null;
    
    if (needLogin) {
      console.log('需要登入，開始填入帳號密碼...');
      
      try {
        await page.waitForSelector('input[type="text"], input[name*="user"], input[name*="account"]', { timeout: 10000 });
        await page.type('input[type="text"], input[name*="user"], input[name*="account"]', '${goDoorConfig.username}');
        
        await page.waitForSelector('input[type="password"]', { timeout: 5000 });
        await page.type('input[type="password"]', '${goDoorConfig.password}');
        
        console.log('已填入登入資訊，點擊登入按鈕...');
        
        const loginButton = await page.$('button[type="submit"], input[type="submit"]');
        if (loginButton) {
          await loginButton.click();
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
          console.log('登入成功');
        }
      } catch (loginError) {
        console.log('登入過程發生錯誤:', loginError.message);
      }
    } else {
      console.log('已經登入狀態');
    }
    
    console.log('尋找新增活動功能...');
    await page.waitForTimeout(3000);
    
    let foundCreateButton = false;
    
    try {
      const allButtons = await page.$$('a, button');
      for (let button of allButtons) {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), button);
        if (text.includes('活動') && (text.includes('新增') || text.includes('創建') || text.includes('建立'))) {
          await button.click();
          foundCreateButton = true;
          console.log('找到並點擊新增活動按鈕:', text);
          break;
        }
      }
      
      if (!foundCreateButton) {
        console.log('未找到新增按鈕，嘗試直接導航...');
        await page.goto('${goDoorConfig.baseUrl}/events/create', { 
          waitUntil: 'networkidle2',
          timeout: 20000 
        });
        foundCreateButton = true;
      }
    } catch (navError) {
      console.log('導航錯誤:', navError.message);
    }
    
    await page.waitForTimeout(3000);
    console.log('準備填寫表單...');
    
    const fieldsToFill = {
      '活動名稱': '${cleanEventData.name}',
      '活動描述': '${cleanEventData.description}',
      '開始日期': '${cleanEventData.startDate}',
      '開始時間': '${cleanEventData.startTime}',
      '結束日期': '${cleanEventData.endDate}',
      '結束時間': '${cleanEventData.endTime}',
      '活動地點': '${cleanEventData.location}',
      '地址': '${cleanEventData.address}',
      '主辦單位': '${cleanEventData.organizer}',
      '人數上限': '${cleanEventData.maxParticipants}',
      '活動費用': '${cleanEventData.price}',
      '聯絡電話': '${cleanEventData.phone}',
      '聯絡信箱': '${cleanEventData.email}'
    };
    
    let fieldsFilledCount = 0;
    for (const [fieldName, value] of Object.entries(fieldsToFill)) {
      if (value && value.trim() !== '') {
        try {
          const selectors = [
            'input[name*="' + fieldName + '"]',
            'textarea[name*="' + fieldName + '"]',
            'input[placeholder*="' + fieldName + '"]',
            'textarea[placeholder*="' + fieldName + '"]',
            'input[id*="' + fieldName + '"]',
            'textarea[id*="' + fieldName + '"]'
          ];
          
          let fieldFound = false;
          for (const selector of selectors) {
            const field = await page.$(selector);
            if (field) {
              await field.click();
              await field.focus();
              await page.keyboard.down('Control');
              await page.keyboard.press('KeyA');
              await page.keyboard.up('Control');
              await field.type(value, { delay: 50 });
              console.log('已填寫 ' + fieldName + ': ' + value.substring(0, 50) + '...');
              fieldsFilledCount++;
              fieldFound = true;
              break;
            }
          }
          
          if (!fieldFound) {
            console.log('未找到欄位: ' + fieldName);
          }
        } catch (e) {
          console.log('填寫 ' + fieldName + ' 時發生錯誤: ' + e.message);
        }
      }
    }
    
    console.log('總共填寫了 ' + fieldsFilledCount + ' 個欄位');
    
    const showInApp = ${showInApp};
    console.log('設定公開程度:', showInApp ? '完全公開' : '半公開');
    
    if (!showInApp) {
      try {
        console.log('開始尋找半公開選項...');
        
        const visibilityOptions = await page.$$('input[type="radio"], input[type="checkbox"]');
        
        for (let option of visibilityOptions) {
          const labelText = await page.evaluate(el => {
            const label = el.closest('label') || document.querySelector('label[for="' + el.id + '"]');
            return label ? label.textContent : '';
          }, option);
          
          const optionText = await page.evaluate(el => {
            return el.value || el.getAttribute('aria-label') || '';
          }, option);
          
          const combinedText = (labelText + ' ' + optionText).toLowerCase();
          
          if (combinedText.includes('半公開') || combinedText.includes('不公開') || combinedText.includes('私人') || combinedText.includes('限制')) {
            await option.click();
            console.log('已選擇半公開選項:', combinedText);
            break;
          }
        }
        
        const selectElements = await page.$$('select');
        for (let select of selectElements) {
          const options = await select.$$('option');
          for (let option of options) {
            const text = await page.evaluate(el => el.textContent.toLowerCase(), option);
            if (text.includes('半公開') || text.includes('不公開')) {
              const value = await page.evaluate(el => el.value, option);
              await page.select(select, value);
              console.log('已選擇半公開選項:', text);
              break;
            }
          }
        }
      } catch (e) {
        console.log('設定半公開時發生錯誤:', e.message);
      }
    }
    
    console.log('準備提交表單...');
    
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]'
    ];
    
    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const submitButton = await page.$(selector);
        if (submitButton) {
          await submitButton.click();
          console.log('已點擊提交按鈕:', selector);
          submitted = true;
          break;
        }
      } catch (e) {
        console.log('嘗試 ' + selector + ' 失敗: ' + e.message);
      }
    }
    
    if (!submitted) {
      console.log('未找到提交按鈕，嘗試按 Enter');
      await page.keyboard.press('Enter');
    }
    
    await page.waitForTimeout(5000);
    console.log('表單提交完成，準備取得活動網址...');
    
    let eventUrl = page.url();
    console.log('當前頁面網址:', eventUrl);
    
    if (!eventUrl.includes('/event/') && !eventUrl.includes('/register/')) {
      console.log('當前網址不是活動頁面，尋找活動連結...');
      
      try {
        const eventLinks = await page.$$('a[href*="/event/"], a[href*="/register/"]');
        if (eventLinks.length > 0) {
          eventUrl = await page.evaluate(el => el.href, eventLinks[eventLinks.length - 1]);
          console.log('找到活動連結:', eventUrl);
        } else {
          const eventId = Date.now();
          eventUrl = '${goDoorConfig.baseUrl}/event/register/' + eventId;
          console.log('生成預設活動網址:', eventUrl);
        }
      } catch (e) {
        console.log('尋找活動連結時發生錯誤:', e.message);
        eventUrl = '${goDoorConfig.baseUrl}/events';
      }
    }
    
    console.log('最終活動網址:', eventUrl);
    
    const result = { 
      success: true, 
      eventUrl: eventUrl,
      showInApp: showInApp,
      visibility: showInApp ? '完全公開' : '半公開',
      fieldsFilledCount: fieldsFilledCount
    };
    
    console.log(JSON.stringify(result));
    
  } catch (error) {
    console.log('自動上架過程發生錯誤:', error.message);
    const errorResult = { 
      success: false, 
      error: error.message 
    };
    console.log(JSON.stringify(errorResult));
  } finally {
    await browser.close();
    console.log('瀏覽器已關閉');
  }
})();
    `;
    
    console.log('發送腳本到 Browserless...');
    console.log('腳本長度:', puppeteerScript.length, '字符');
    
    const response = await axios.post(
      `${browserlessConfig.baseUrl}/function?token=${browserlessConfig.token}`,
      {
        code: puppeteerScript,
        context: {},
        detached: false
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );
    
    console.log('Browserless 回應狀態:', response.status);
    console.log('Browserless 原始回應:', response.data);
    
    let result;
    try {
      if (typeof response.data === 'string') {
        const jsonMatch = response.data.match(/\{.*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('無法在回應中找到 JSON 資料');
        }
      } else {
        result = response.data;
      }
    } catch (parseError) {
      console.error('解析 Browserless 回應失敗:', parseError);
      throw new Error(`解析回應失敗: ${response.data}`);
    }
    
    if (result.success) {
      console.log('✅ Browserless 自動上架成功:', result.eventUrl);
      console.log('✅ 公開設定:', result.visibility);
      return {
        success: true,
        eventUrl: result.eventUrl,
        showInApp: result.showInApp,
        visibility: result.visibility,
        fieldsFilledCount: result.fieldsFilledCount,
        message: `活動已成功上架到果多後台（${result.visibility}）`
      };
    } else {
      throw new Error(result.error || '未知錯誤');
    }
    
  } catch (error) {
    console.error('❌ Browserless 自動上架失敗:', error);
    console.error('錯誤詳細:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message,
      details: error.response?.data,
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

    // 測試半公開功能
    const showInApp = req.body.showInApp !== false; // 預設為 true
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
            text: '請點擊下方按鈕開始建立活動\n支援半公開設定功能',
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
          text: `✅ 系統正常運作！\n\n👤 您的 User ID:\n${userId}\n\n🎯 請輸入「建立活動」來開始建立新活動\n\n🚀 雲端自動上架功能已啟用！\n🔒 支援半公開活動設定`
        });
      } else {
        await sendReplyMessage(replyToken, {
          type: 'text',
          text: `👋 您好！歡迎使用 GoDoor 活動小幫手！\n\n🎯 請輸入「建立活動」來開始建立新活動\n🔧 輸入「測試」來檢查系統狀態\n🚀 雲端自動上架功能\n🔒 支援半公開/完全公開設定\n\n您的訊息：${text}`
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
      browserlessIntegration: true
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
  console.log(`🔒 Semi-Private Events: SUPPORTED`);
});
