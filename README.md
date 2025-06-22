# GoDoor 樂齡活動報名系統

此專案為長者友善的 LINE LIFF 報名平台，使用 Google Apps Script + Google Sheets 作為後端，支援自訂欄位與 LINE ID 綁定。

---

## 📁 專案結構

```
frontend/             # 前端靜態頁
├── index.html        # 主頁面（課程月曆與報名表）
├── styles.css        # 基本樣式
├── script.js         # 活動載入、報名送出邏輯
├── config.js.template# LIFF ID & API 設定模板

apps-script/          # Google Apps Script 程式
├── Code.gs           # 包含 getEvents / submitRegistration / Flex 推播等功能

liff/                 # LIFF 整合相關
├── login.html        # LIFF 登入頁（若未登入會自動導向）

```

## 🔧 部署方式

### 1. Google Sheets
- 建立 `活動總表` 與 `報名紀錄表` 兩個 Sheet，參考範本欄位。

### 2. Google Apps Script
- 新增專案，貼上 `apps-script/Code.gs` 內容
- 發佈為網路應用程式，記下 deploy URL（做為 API_BASE）

### 3. LINE LIFF 設定
- 使用 LINE Developers 建立 Messaging API channel
- 新增 LIFF app，記下 LIFF ID

### 4. Netlify 前端部署
- 將 `frontend/` 上傳或連 GitHub 部署至 Netlify
- 複製 `config.js.template` 為 `config.js`，填入你的 LIFF ID 與 API BASE URL

## 💡 自訂欄位格式
在活動表的 `活動內容或備註` 欄位，填入 JSON：
```json
{
  "customQuestions": [
    { "type": "radio", "label": "你是否有瑜伽經驗？", "options": ["有", "沒有"] },
    { "type": "text", "label": "你希望帶來什麼？" }
  ]
}
```

## ✅ 功能清單
- [x] 支援多堂課勾選報名
- [x] 自動產生自訂欄位題目
- [x] LINE LIFF 自動登入、取得 LINE ID
- [x] 自動推播報名成功訊息
- [x] 防止重複報名（LINE ID + 活動ID 為唯一）

---

Made with ❤️ by 果多
