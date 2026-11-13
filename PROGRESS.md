# PROGRESS.md · 專案架構與工作進度日誌

本檔案記錄本專案的系統現有架構、核心檔案清單，以及各 Agent 的接力開發日誌。每次工作完成後，請將新日誌新增於最上方。

---

## 系統現有架構與核心檔案盤點

本專案為 **THE STR SPA 男士專屬線上預約官方網站**，採靜態無後端架構（GitHub Pages 託管，自訂網域 `str.ohbaspa.com.tw`），與 LINE 官方帳號無縫串接。

### 核心檔案與目錄：
* `index.html`：預約官網核心前端頁面。
  * 包含全站 RWD 排版、Hero 視覺、品牌理念、服務項目、會館環境導覽（含全螢幕 Lightbox）。
  * 師傅動態清單展示、分區切換（台北/台中/高雄）、即時時段選擇與防呆計算。
  * 7 行標準 LINE 預約代碼自動組裝與一鍵跳轉官方 LINE。
* `data/masters_profile.json`：全體按摩師傅資料庫。
  * 記錄師傅 ID、姓名、服務分區（`regions`）、身高、體重、年齡、專長、個人簡介、評分、標籤與相片路徑。
  * 目前前台正式上架 **31 位師傅**（台北 20 位、台中 8 位、高雄 3 位）。
* `static/masters/`：師傅個人寫真照目錄。
  * `taipei/`：台北/桃園師傅照片（含 UN、Wayne、KD 等）。
  * `taichung/`：台中師傅照片（A、ACE、AK、J、L、LG、N、VT）。
  * `kaohsiung/`：高雄師傅照片（Cheng、Q、Z）。
* `static/environment/`：西門旗艦會館環境實景寫真（`env1.jpg` ~ `env4.jpg`）。
* `CNAME`：網域綁定設定檔（指向 `str.ohbaspa.com.tw`）。
* `robots.txt` & `sitemap.xml`：搜尋引擎最佳化（SEO）與爬蟲指引。
* `AGENTS.md`：多 Agent 跨環境協作開發規範守則。
* `PROGRESS.md`：本進度與架構交接日誌。

---

## 工作進度日誌（最新進度置頂）

### [2026-11-13] · 建立協作機制完成，專案待命開發中
* **執行 Agent**：Antigravity（電腦端）
* **本次改動內容**：
  1. 建立 `AGENTS.md`：確立多 Agent（Antigravity、T3 Code、Cursor）開工前檢查（`git pull` / `git status`）、收工前記錄（更新 `PROGRESS.md`）及防呆衝突處理規範。
  2. 建立 `PROGRESS.md`：完成本專案架構與核心檔案清單盤點，初始化工作進度追蹤機制。
  3. 同步遠端狀態，確認本機工作區與 GitHub `origin/main` 保持最新。
* **異動檔案**：
  - `AGENTS.md` (新增)
  - `PROGRESS.md` (新增)
* **當前狀態與下一步待辦（Next Steps）**：
  - 專案處於待命開發狀態。
  - **待辦事項**：師傅「FR (Frank / FR)」在內部排班系統已將分區改為「高雄」，目前因尚未取得相片未在前台公開；待使用者提供照片與相關體態數據後，即可在 `data/masters_profile.json` 與前台新增上架至高雄專區。
