# Threads-
Threads脆文篩選器
工具:
1.瀏覽器"竄改猴"外掛
https://www.tampermonkey.net/index.php
2.node.js
https://nodejs.org/zh-tw/download
3.一組Gemini api key
https://aistudio.google.com/apikey

操作步驟:
1.下載node.js專案資料夾(gemini-emotion-server)
2.輸入Gemini api key
更新專案資料夾內的.env檔案
3.初始化專案並安裝專案依賴,打開cmd工具輸入以下指令
cd gemini-emotion-server
npm init -y
npm install @google/genai mime express cors dotenv
4.啟動伺服器
npm start
5.腳本匯入至竄改猴(Threads脆文篩選器-0.2.user.js)
6.打開Threads看結果
