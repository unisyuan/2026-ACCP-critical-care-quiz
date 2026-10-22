# 2026 ACCP/ASHP 重症藥學 150 題 複習測驗系統 (Web & Mobile PWA)

專為 **2026 ACCP/ASHP Critical Care Pharmacy Specialty Review Course** 考生打造的現代化刷題複習網頁與手機 APP。

---

## 🌟 核心特色

1. **完整 150 題收錄**：
   - 包含全部 20 個主題章節、題目、A–D 選項、官方答案與詳細考點解析。
   - 完整支援 **14 組共用病例情境**（如第 15–18 題、19–20 題等），做題時於題幹上方直接展示共用病例資訊，隨機抽題也不會漏掉臨床背景。
   - 保留「核對註」與「依據代碼（B01–B20, R01–R20）」等考題深度補充。

2. **🎲 隨機出題模式 (Random Quiz)**：
   - 可自訂題數（⚡ 10 題快速測驗、🎯 25 題綜合模擬、📚 50 題深度練習、🏆 150 題完整全真模考）。
   - 支援「**即時解析模式**」（做一題看一題解析）與「**全真考試模式**」（交卷後統計分數並自動抓出租題）。
   - 可依特定單元章節進行專項隨機抽題。

3. **❌ 錯題複習專區 (Mistakes Notebook)**：
   - 只要做錯的題目會自動記入錯題本。
   - 專屬「錯題複習模式」：集中重複刷錯題，答對後可一鍵「移出錯題本」或繼續保留。

4. **⭐ 收藏題本 (Starred Questions)**：
   - 隨時點擊題目前方的星號「★」加入收藏，方便重點衝刺。

5. **🔍 全文搜尋與常用醫學縮寫字典**：
   - 支援關鍵字即時檢索（如輸入 `ECMO`、`vancomycin`、`KDIGO`、`ARDS` 等直接跳題）。
   - 內建重症常用醫學縮寫對照表（ICU, PaO2, ScvO2, ARCTIC, aPTT...）。

6. **📊 學習進度與章節掌握度分析**：
   - 自動記錄總答題數、正確率、各章節進度條。
   - 支援 **進度匯出與匯入 (JSON)**，方便在電腦做完後將進度轉移到手機上！

7. **📱 手機 APP (PWA) 體驗**：
   - 響應式佈局：支援深色模式 (Dark Mode)、觸控震動反饋、底部快捷導航列。
   - 支援手機「加入主畫面」，點開就是全螢幕獨立 App，且完全支援離線使用！

---

## 🚀 如何使用

### 方法一：直接點擊開啟（免安裝伺服器，最快）
- 直接在資料夾中雙擊點開 **`accp_quiz_all_in_one.html`** 或 **`index.html`**。
- 即可在 Chrome、Edge、Safari 或任何瀏覽器中離線練習！

### 方法二：透過本機伺服器在電腦與手機上同步使用（推薦）
1. 在 Windows 上雙擊點擊 **`啟動測驗系統.bat`**。
2. 電腦會自動開啟瀏覽器前往 `http://localhost:8080`。
3. 視窗黑畫面會顯示手機連線網址（例如 `http://192.168.x.x:8080`）：
   - 手機連上與電腦相同的 Wi-Fi。
   - 手機 Safari 或 Chrome 輸入該網址。
   - 點擊「分享」或「選單」→ **「加入主畫面 (Add to Home Screen)」**。
   - 手機桌面即會產生「重症藥學題庫」獨立 App 圖示，點開即可全螢幕刷題！

---

## 📁 檔案清單

- [`index.html`](file:///C:/Users/FJUHUSER.FJCUH.001/.gemini/antigravity/scratch/accp-critical-care-quiz/index.html) - 標準 Web App 主頁面
- [`style.css`](file:///C:/Users/FJUHUSER.FJCUH.001/.gemini/antigravity/scratch/accp-critical-care-quiz/style.css) - 現代化設計樣式表（含深色模式）
- [`app.js`](file:///C:/Users/FJUHUSER.FJCUH.001/.gemini/antigravity/scratch/accp-critical-care-quiz/app.js) - 核心互動邏輯與狀態持久化
- [`accp_quiz_all_in_one.html`](file:///C:/Users/FJUHUSER.FJCUH.001/.gemini/antigravity/scratch/accp-critical-care-quiz/accp_quiz_all_in_one.html) - 單一獨立離線 HTML 檔案（方便分享/傳到手機直接開）
- [`questions.json`](file:///C:/Users/FJUHUSER.FJCUH.001/.gemini/antigravity/scratch/accp-critical-care-quiz/questions.json) - 150 題結構化題庫資料
- [`questions-data.js`](file:///C:/Users/FJUHUSER.FJCUH.001/.gemini/antigravity/scratch/accp-critical-care-quiz/questions-data.js) - 免 CORS 的題庫資料檔
- [`manifest.json`](file:///C:/Users/FJUHUSER.FJCUH.001/.gemini/antigravity/scratch/accp-critical-care-quiz/manifest.json) - PWA 手機安裝配置檔
- [`sw.js`](file:///C:/Users/FJUHUSER.FJCUH.001/.gemini/antigravity/scratch/accp-critical-care-quiz/sw.js) - Service Worker 離線快取
- [`start_server.py`](file:///C:/Users/FJUHUSER.FJCUH.001/.gemini/antigravity/scratch/accp-critical-care-quiz/start_server.py) - 伺服器啟動器（自動檢測區網 IP）
- [`啟動測驗系統.bat`](file:///C:/Users/FJUHUSER.FJCUH.001/.gemini/antigravity/scratch/accp-critical-care-quiz/啟動測驗系統.bat) - Windows 一鍵啟動腳本
