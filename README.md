  # GoDoor 線上報名系統（適樂齡活動）

> 一個為長者友善設計的線上活動報名平台，採用 Google Sheet + HTML 靜態頁 + LINE LIFF 整合實作，無需後端伺服器、低成本維運。

---

## 🧩 系統架構簡介

使用者（LINE） → LIFF 登入 → 活動月曆頁（HTML） → 呼叫 Apps Script API → 寫入 Google Sheet 報名紀錄

主辦方 → 填寫 Google 表單上架活動 → 自動寫入活動總表

less
Copy
Edit

- 前端：HTML + Tailwind + Vanilla JS
- 資料庫：Google Sheet（活動總表 + 報名紀錄表）
- API：Google Apps Script 提供 `GET` / `POST`
- 推播：LINE Messaging API 推送報名成功 & 提醒通知
- 使用者登入：LINE LIFF 自動帶入名字與 LINE ID
- 部署：Netlify / Vercel（靜態頁）

---

## 🔗 Demo 與資源連結

| 項目 | 連結 |
|------|------|
| GitHub Repo | https://github.com/dannybwk/godoor-line-system |
| Google Sheet（資料庫） | [活動總表與報名紀錄](https://docs.google.com/spreadsheets/d/13IwMmUYPOCrQOpF7yBnjtM0whoMOxfQb2wpQkoPGYnY/edit) |
| LINE LIFF ID | `2007618883-ewZnj9Py` |
| Web App API Endpoint | [`GET` / `POST`](https://script.google.com/macros/s/AKfycbwzd92TWf8P7jh--pkeeTc7SorLsHppVOpwisTZTShCmQ3slVtTamZquHldG4VH0Y-LVA/exec) |
| 活動上架表單 | [Google Form](https://docs.google.com/forms/d/1BShSREDikHSSkNNcaPjd-FDXAAaea6W5K8ghJJPxvhk/edit) |

---

## 📌 API 文件

### GET `/events`
取得所有公開活動資料。

#### 範例回傳：
```json
[
  {
    "活動ID": "a001",
    "活動標題": "樂齡手作課程",
    "講師": "王老師",
    "活動日期": "2025-07-15",
    "開始時間": "10:00",
    "活動內容或備註": "{ \"customQuestions\": [...] }"
  },
  ...
]
POST /register
傳送使用者報名資料。

參數欄位（JSON）：
欄位名稱	說明
姓名	報名者姓名
LINE的名字	自動從 LIFF 帶入
LINE ID	自動從 LIFF 帶入
電子郵件	選填
手機號碼	選填
活動ID	被勾選的活動 ID
備註	其他補充

回傳格式：
json
Copy
Edit
{
  "status": "success",
  "message": "報名成功"
}
📋 資料欄位設計
活動總表：
活動ID、活動標題、講師、活動日期、開始時間、活動內容或備註（含自訂欄位 JSON）

報名紀錄表：
報名時間、姓名、LINE的名字、LINE ID、電子郵件、手機號碼、活動ID、備註、出席狀態

✅ 專案開發進度（Issues）
請參考 GitHub Issues 查看目前功能分工與待辦事項。

✨ License
MIT License
