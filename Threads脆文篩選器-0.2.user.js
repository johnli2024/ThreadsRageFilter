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

    // 在推文主容器下的標籤
    function getMainTagBlock(container) {
        return container.querySelector('div.xeuugli span.x1lliihq.x1plvlek.xryxfnj.x1n2onr6.x1ji0vk5.x18bv5gf.x193iq5w.xeuugli.x1fj9vlw.x13faqbe.x1vvkbs.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x1i0vuye.xjohtrz.x1s688f.xp07o12.x1yc453h');
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
        let blocks = ['罷免','借錢','瘡','大便','小草','鬼故事','四叉貓','民進黨','章魚嗶','崑萁','MuaChat','土城','藍白','耳屎','債務','拉屎','鍾明軒','鐘明軒','廣興橋','阿泰爾','莮','男蘿莉'
                     ,'母胎單身戀愛','戀愛大作戰','單身大作戰','點進主頁連結','追蹤我','還沒睡','switch2','Switch 2','NS2','台電','徵才','漢光','吳恩碩','紅姐','光逝去的夏天','屁眼','蟑螂'
                     ,'男同','阿紅','麥玉珍','Joeman','紅爺','自縊','楓之谷','會超順','紅姊','柯南','街口','柯文哲','砍預算','會考','秦始皇','男莖'];
        containers.forEach(container => {
            let mainTextBlock = getMainTextBlock(container);
            if (!mainTextBlock) return;
            if (mainTextBlock.classList.contains('my-class')) return;
             mainTextBlock.classList.add('my-class');
            let mainText = mainTextBlock.textContent.replace(/\s+/g, ' ').trim();

            //console.log("主文:"+mainText);
            for (let i = 0; i < blocks.length; i++) {
                if (mainText.toLowerCase().includes(blocks[i].toLowerCase())) {
                    console.log('主文含有敏感詞:', blocks[i], '|內容:',mainText);
                    container.style.display = 'none';
                    return;
                }
            }

            let tagBlock = getMainTagBlock(container);
            if (tagBlock) {
                let tagText = tagBlock.textContent.replace(/\s+/g, ' ').trim();
                //console.log("標籤:"+tagText);
                for (let i = 0; i < blocks.length; i++) {
                    if (tagText.toLowerCase().includes(blocks[i].toLowerCase())) {
                        console.log('標籤含有敏感詞:', blocks[i], '|內容:',tagText);
                        container.style.display = 'none';
                        return;
                    }
                }
            }

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