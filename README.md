# Threads脆文篩選器
感謝:  
hzbrrbmin,腳本直接使用這裡的版本修改而成  
https://greasyfork.org/zh-TW/scripts/533791-keyword-based-tweet-filtering-for-threads/code

開發目標：打造一款PC端的脆文篩選器  
1.瀏覽器自動擷取脆文內容並傳送給 AI 模型分析。  
2.AI判斷該脆文是否帶有憤怒情緒，並給予生氣程度的評分。  
3.分析結果以文字形式回傳並顯示在瀏覽器上。  
4.使用者可自行設定希望隱藏的「生氣程度」門檻。  
5.系統依據設定，自動隱藏超過該門檻的脆文內容。  
6.(7/11)新增敏感詞篩選功能，標籤區與主文區若發現敏感詞，隱藏脆文內容  
敏感詞請至腳本內(let blocks段落處)新增  
7.(7/17更新)新增敏感詞可使用正則表達式  
正則表達式,請至腳本內(let blockPatterns段落處)新增  
8.(7/17更新)新增個人頁面篩選功能，個人頁面若發現敏感詞，隱藏脆文內容  
個人頁面的敏感詞,請至腳本內(let bioBlocks段落處)新增  

微調:  
1.(7/15更新)僅針對首頁的脆文做篩選器處理  
2.(7/17更新)「生氣程度」門檻預設從6改成7  
  
結果：  
1.呼叫模型因網站CSP，需要使用者端啟動伺服器（node.js）  
2.瀏覽脆文的速度不能太快，回應速度跟不上  
3.同一脆文，AI的評分會忽高忽低，但還能接受  
4.AI模型分析要付費,請養成定時查看目前用量的習慣  

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
6.打開Threads和瀏覽器開發工具看結果  

結果截圖:    
<img src="screenshot/screenshot 2025-07-04 013656.png" alt="介面預覽" width="500"/>
<img src="screenshot/screenshot 2025-07-04 013806.png" alt="介面預覽" width="500"/>
