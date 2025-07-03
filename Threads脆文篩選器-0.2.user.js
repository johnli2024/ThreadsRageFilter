// ==UserScript==
// @name         Threads脆文篩選器
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Threads脆文篩選器
// @author       你自己
// @match        *://www.threads.net/*
// @match        *://www.threads.com/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==
	/*
	開發目標：打造一款PC端的脆文篩選器
	1.瀏覽器自動擷取脆文內容並傳送給 AI 模型分析。
	2.AI判斷該脆文是否帶有憤怒情緒，並給予生氣程度的評分。
	3.分析結果以文字形式回傳並顯示在瀏覽器上。
	4.使用者可自行設定希望隱藏的「生氣程度」門檻。
	5.系統依據設定，自動隱藏超過該門檻的脆文內容。
	結果：
	1.呼叫模型因網站CSP，需要使用者端啟動伺服器（node.js）
	2.瀏覽脆文的速度不能太快，回應速度跟不上
	3.同一脆文，AI的評分會忽高忽低，但還能接受
	*/
(function() {
    'use strict';
    //取得所有推文主容器
    function getAllPostContainers() {
        return document.querySelectorAll('div[data-pressable-container][class*=" "]');
    }

    // 在推文主容器下的主文
    function getMainTextBlock(container) {
        return container.querySelector('div.x1a6qonq.x6ikm8r.x10wlt62.xj0a0fe.x126k92a.x6prxxf.x7r5mf7');
    }

	//脆文內容傳送給AI模型分析
    const serverURL = 'http://localhost:3000/analyze-emotion';
    function analyzeComment(text, callback) {
        GM_xmlhttpRequest({
            method: 'POST',
            url: serverURL,
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify({ text }),
            onload: function (response) {
                const json = JSON.parse(response.responseText);
                callback(json);
            },
            onerror: function (error) {
                console.error('分析請求失敗:', error);
            }
        });
    }

	//分析結果以文字形式回傳並顯示在瀏覽器上。
    function insertAnalyzeResult(container,result) {
        let timeObj = container.querySelector('time');
       // timeObjs.forEach(timeObj => {
            let timeObjDiv = timeObj.closest('div').parentNode;
            if (!timeObjDiv) return;

            // 避免重複插入
            if (timeObjDiv.querySelector('.analyzeResult')) return;

            // 把分析結果加到頁面中
            const div = document.createElement('div');
            div.className = 'analyzeResult';
            const span = document.createElement('span');
            span.textContent = result;
            div.appendChild(span);
            timeObjDiv.appendChild(div);
       // });
    }

	//主程式
    function getMainText(){
        let containers = getAllPostContainers();
        containers.forEach(container => {
            let mainTextBlock = getMainTextBlock(container);
            if (!mainTextBlock) return;
            if (mainTextBlock.classList.contains('my-class')) return;
            let mainText = mainTextBlock.textContent.replace(/\s+/g, ' ').trim();
            //console.log("主文:"+mainText);
            mainTextBlock.classList.add('my-class');
            analyzeComment(mainText, (result) => {
                console.log('分析:', result.analysis, '|內容:',mainText);
                insertAnalyzeResult(container,'分析:'+result.analysis);
				//「生氣程度」門檻
                if(result.analysis>=6)container.style.display = 'none';
            });
        })
    }

    //監控網頁是否有新的 HTML 元素被添加，如果有就執行 getMainText() 函數
    const observer = new MutationObserver(mutations => {
        let needFilter = false;
        for (const m of mutations) {
            if (m.addedNodes && m.addedNodes.length > 0) {
                needFilter = true;
                break;
            }
        }
        if (needFilter) {
            needFilter = false;
            getMainText();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    getMainText();
})();