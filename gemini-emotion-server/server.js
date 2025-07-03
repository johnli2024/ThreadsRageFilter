// 需要安裝的依賴項目:
// npm install @google/genai mime express cors dotenv
// npm install -D @types/node

const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 初始化 Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const config = {
  maxOutputTokens: 100,
  thinkingConfig: {
    thinkingBudget: 0,
  },
  responseMimeType: 'text/plain',
  systemInstruction: [
    {
      text: `請根據以下評論內容,依照生氣程度評分,評分範圍為1到10,數字越大生氣程度越大,0為不生氣,
必須回覆評分數字,不要有額外解釋。
評分時不受以前的評論影響。
現在請判斷以下評論:
輸入:{text_input}
判斷:`,
    }
  ],
};

// API 路由 - 分析評論情緒
app.post('/analyze-emotion', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        error: '請提供要分析的文字內容' 
      });
    }

    const model = 'gemini-2.5-flash';
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: text,
          },
        ],
      },
    ];

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let result = '';
    for await (const chunk of response) {
	  if (typeof chunk.text === 'string') {
		result += chunk.text;
	  }
	}

    res.json({
      success: true,
      input: text,
      analysis: result.trim(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('分析錯誤:', error);
    res.status(500).json({ 
      error: '分析過程中發生錯誤',
      details: error.message 
    });
  }
});

// GET 路由 - 用於測試
app.get('/analyze-emotion', async (req, res) => {
  try {
    const { text } = req.query;
    
    if (!text) {
      return res.status(400).json({ 
        error: '請在查詢參數中提供 text 參數' 
      });
    }

    const model = 'gemini-2.5-flash';
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: text,
          },
        ],
      },
    ];

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let result = '';
    for await (const chunk of response) {
      result += chunk.text;
    }

    res.json({
      success: true,
      input: text,
      analysis: result.trim(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('分析錯誤:', error);
    res.status(500).json({ 
      error: '分析過程中發生錯誤',
      details: error.message 
    });
  }
});

// 健康檢查路由
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Gemini AI 情緒分析服務'
  });
});

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: '歡迎使用 Gemini AI 情緒分析服務',
    endpoints: {
      'POST /analyze-emotion': '分析文字情緒 (JSON body: {"text": "你的文字"})',
      'GET /analyze-emotion?text=你的文字': '分析文字情緒 (查詢參數)',
      'GET /health': '健康檢查'
    },
    usage: {
      post_example: 'curl -X POST http://localhost:3000/analyze-emotion -H "Content-Type: application/json" -d \'{"text":"這個服務真的很爛!"}\'',
      get_example: 'curl "http://localhost:3000/analyze-emotion?text=這個服務真的很爛!"'
    }
  });
});

// 錯誤處理中間件
app.use((error, req, res, next) => {
  console.error('伺服器錯誤:', error);
  res.status(500).json({ 
    error: '伺服器內部錯誤',
    details: error.message 
  });
});

// 404 處理
app.use((req, res) => {
  res.status(404).json({ 
    error: '找不到請求的路由',
    availableEndpoints: [
      'POST /analyze-emotion',
      'GET /analyze-emotion',
      'GET /health',
      'GET /'
    ]
  });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 伺服器運行在 http://localhost:${PORT}`);
  console.log(`📊 情緒分析 API 已準備就緒`);
  console.log(`🔑 請確保已設定 GEMINI_API_KEY 環境變數`);
});

module.exports = app;