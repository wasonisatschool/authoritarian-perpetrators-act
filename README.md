# 威權時期加害者識別及處理條例（草案）

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-線上閱覽-blue)](https://wasonisatschool.github.io/authoritarian-perpetrators-act/)

本儲存庫提供「**威權時期加害者識別及處理條例（草案）**」全文的靜態網頁閱讀介面，並自動部署至 GitHub Pages。

---

## 專案目的

為落實轉型正義，識別威權統治時期（民國34年8月15日至民國80年11月7日）參與侵害人權之加害者，公開其責任，並採取適當處理措施，以彰顯歷史真相、促進社會和解。本專案以漂亮、易讀的網頁形式呈現草案全文，方便公民社會討論與學術研究參考。

> **免責聲明**：本草案尚未經立法院審議通過，不具法律效力，僅供學術研究及公民討論參考之用。

---

## 功能特色

- 📖 **章節側邊欄導覽**：共八章，點擊可平滑捲動至對應章節
- 🔍 **即時全文搜尋**：輸入關鍵字即時高亮顯示，顯示符合條數
- 🔗 **條文錨點連結**：每條條文有 URL 錨點，可直接分享特定條文
- 📱 **響應式設計**：桌機、平板、手機均可流暢閱讀
- 🖨️ **列印友善**：點擊「列印」按鈕，自動隱藏介面元素，僅印條文正文
- ♿ **無障礙考量**：使用語意化 HTML 與 ARIA 標籤

---

## 檔案結構

```
/
├── index.html              # 網頁主檔
├── style.css               # 樣式（深藍主色調、Noto Serif/Sans TC）
├── app.js                  # 動態渲染、搜尋、導覽邏輯
├── data/
│   └── law.json            # 草案全文結構化資料（8章42條）
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Pages 自動部署工作流程
└── README.md               # 本說明文件
```

---

## 本地端預覽

本專案為純靜態頁面，使用 `fetch()` 載入 JSON，**需透過 HTTP 伺服器**開啟（直接用 `file://` 開啟會受 CORS 限制）。

### 方法一：使用 Python（推薦）

```bash
# Python 3
python -m http.server 8080
# 開啟瀏覽器：http://localhost:8080
```

### 方法二：使用 Node.js `npx serve`

```bash
npx serve .
# 開啟瀏覽器：http://localhost:3000
```

### 方法三：使用 VS Code Live Server 擴充功能

安裝 [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) 後，右鍵點擊 `index.html` → **Open with Live Server**。

---

## GitHub Pages 部署

本儲存庫已設定 GitHub Actions 自動部署，流程如下：

1. 推送至 `main` 分支後，`.github/workflows/deploy.yml` 自動觸發
2. 使用 `actions/upload-pages-artifact` 打包靜態檔案
3. 使用 `actions/deploy-pages` 部署至 GitHub Pages

**首次啟用步驟**（僅需執行一次）：

1. 進入儲存庫 **Settings → Pages**
2. **Source** 選擇 `GitHub Actions`
3. 儲存後，下次推送 `main` 即自動部署

部署完成後，網頁將可在以下網址存取：

```
https://wasonisatschool.github.io/authoritarian-perpetrators-act/
```

---

## 草案條文總覽

| 章次 | 章名 | 條文範圍 |
|------|------|----------|
| 第一章 | 總則 | 第1條－第4條 |
| 第二章 | 認定委員會之組織與職權 | 第5條－第7條 |
| 第三章 | 調查程序 | 第8條－第12條 |
| 第四章 | 處理措施 | 第13條－第17條 |
| 第五章 | 當事人權利保障與救濟 | 第18條－第20條 |
| 第六章 | 檔案管理與資訊公開 | 第21條－第23條 |
| 第七章 | 罰則 | 第24條－第39條 |
| 第八章 | 附則 | 第40條－第42條 |

---

## 技術說明

| 項目 | 說明 |
|------|------|
| 前端框架 | 無（原生 HTML / CSS / JavaScript） |
| 字型 | Google Fonts Noto Serif TC（正文）、Noto Sans TC（介面） |
| 資料格式 | JSON（`data/law.json`） |
| 部署 | GitHub Pages（GitHub Actions 自動化） |
| 相依套件 | 無（零外部 JS 依賴） |

---

## 授權

本草案條文內容屬草稿性質，作者保留所有權利。網頁程式碼採 [MIT License](LICENSE) 授權。