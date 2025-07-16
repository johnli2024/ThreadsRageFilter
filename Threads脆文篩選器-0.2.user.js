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

    // 在推文主容器下的帳號
    function getMainNameBlock(container) {
        return container.querySelector('span.x6s0dn4.x78zum5.x1q0g3np');
    }

    // 抓個人簡介
    async function fetchBio(username) {
        try {
            const res = await fetch(`https://www.threads.com/@${username}`);
            const html = await res.text();

            const decodeHTML = (str) => {
                return str
                    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
                    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&apos;/g, "'")
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>');
            };

            // 放寬的正則，用來抓 og:title
            const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
            let title = titleMatch ? decodeHTML(titleMatch[1]) : '';

            // 放寬的正則，用來抓 og:description
            const descMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
            let description = descMatch ? decodeHTML(descMatch[1]) : '';

            // ✅ 清除固定雜訊
            //title = title.replace(/ • Threads，暢所欲言$/, '').trim();
            //description = description
                //.replace(/^\d+\s*位粉絲\s*•\s*\d+\s*則串文\s*•\s*/g, '')
                //.replace(/。查看\s*@?[^\s]+?\s*參與的最新對話。$/g, '')
                //.trim();

            return title + "\n" + description;

        } catch (e) {
            console.error("無法抓取 og:title/og:description:", e);
            return null;
        }
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
    async function getMainText(){
        if (window.location.href !== 'https://www.threads.com/') {
            console.log('目前不在首頁,暫停篩選器處理:'+window.location.href);
            return;
        }

        let containers = getAllPostContainers();
        let blocks = ['罷免','借錢','瘡'];
        let blockPatterns = ['不是(.{1,5})不要按','國軍(.{1,5})民宅'];
        let bioBlocks = ['教練','道長','蝦皮','Pinkoi','賣貨便','粉專','連結','領取','業者','自媒體','顧問','創業','科技','｜','小編','客服'];
        containers.forEach(async container => {
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

            for (let i = 0; i < blockPatterns.length; i++) {
                const patternString = blockPatterns[i];
                const regex = new RegExp(patternString); // 建立正規表達式物件
                if (regex.test(mainText.toLowerCase())) {
                    console.log('主文匹配敏感詞模式:', patternString, '|內容:',mainText);
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

            let nameBlock = getMainNameBlock(container);
            if (nameBlock) {
                let nameText = nameBlock.textContent.replace(/\s+/g, ' ').replace(/已驗證/g, '').trim();
                //console.log("帳號:"+nameText);
                let bio = await fetchBio(nameText);
                if (bio) {
                    //console.log("帳號:"+nameText+",帳號個人簡介:"+bio);
                    for (let i = 0; i < bioBlocks.length; i++) {
                        if (bio.toLowerCase().includes(bioBlocks[i].toLowerCase())) {
                            console.log('帳號個人簡介含有敏感詞:', bioBlocks[i], '|內容:',bio);
                            container.style.display = 'none';
                            return;
                        }
                    }
                }
            }

            analyzeComment(mainText, (result) => {
                console.log('分析:', result.analysis, '|內容:',mainText);
                insertAnalyzeResult(container,'分析:'+result.analysis);
				//「生氣程度」門檻
                if(result.analysis>=7)container.style.display = 'none';
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
