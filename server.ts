import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const httpServer = http.createServer(app);

// 1. Google GenAI initialization on server
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Helper to reliably call Gemini with model fallback if a specific alias has a temporary 503 spike
async function callGeminiSafe(promptText: string, schema: any): Promise<string> {
  if (!ai) throw new Error('No Gemini API key configured');
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });
    return response.text || '{}';
  } catch (err: any) {
    console.warn('[Gemini] gemini-3.8-flash call failed, trying gemini-2.5-flash fallback:', err?.message);
    const responseFallback = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });
    return responseFallback.text || '{}';
  }
}

// 2. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// 3. AI Bulk Expenses Processing Endpoint
app.post('/api/ai/bulk-expenses', async (req, res) => {
  try {
    const { entries, categories = [], accounts = [] } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'entries array is required' });
    }

    // If no Gemini key is set, return a status indicating client/local fallback
    if (!ai) {
      return res.status(200).json({
        fallback: true,
        message: 'No server GEMINI_API_KEY configured; fallback to local heuristic engine',
      });
    }

    const todayDate = new Date().toISOString().split('T')[0];

    const categoryDescriptions = (categories || []).map((c: any) => ({
      category: c.name,
      subCategories: Array.isArray(c.subCategories)
        ? c.subCategories.map((s: any) => (typeof s === 'string' ? s : s.name))
        : [],
    }));

    const accountNames = (accounts || []).map((a: any) => a.name);

    const promptText = `
You are a financial bookkeeping assistant for Personal Hub.
Process the following list of raw expense inputs and output a cleaned, rephrased, auto-categorized list.

Available Categories & Sub-categories:
${JSON.stringify(categoryDescriptions, null, 2)}

Available Accounts:
${JSON.stringify(accountNames)}

Today's Date: ${todayDate}

Raw Entries to process:
${JSON.stringify(entries, null, 2)}

Instructions:
1. Rephrase the description ("rephrasedTitle"): Clean up phrasing, fix spelling, make it crisp and professional (e.g. "car fuel 91" -> "Car Fuel Refill (91 Octane)", "mechanic gearbox" -> "Car Gearbox Repair & Inspection", "room change advance" -> "Room Relocation Advance Payment", "panda groceries" -> "Groceries at Panda").
   CRITICAL: Do NOT change the facts, brand names, or original meaning!
2. Extract the numeric amount ("amount") as a positive number.
3. Match to the best account from Available Accounts ("accountName"). If unknown or unspecified, choose the first available account or "Cash".
4. Format date as YYYY-MM-DD. Relative terms like "today", "yesterday", or partial dates must be mapped to valid YYYY-MM-DD dates relative to today (${todayDate}). If unspecified, use ${todayDate}.
5. Auto-select the most fitting category name from Available Categories ("category").
6. Auto-select the most fitting sub-category ("subCategory") from that category's sub-categories if applicable (e.g. for Car: "Fuel", "Maintenance", "Cleaning"). If none fit or none exist, leave subCategory as null or empty string.
7. Return a JSON array matching the schema.
`;

    const text = await callGeminiSafe(promptText, {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          rephrasedTitle: {
            type: Type.STRING,
            description: 'Cleaned and rephrased expense title preserving original meaning',
          },
          amount: {
            type: Type.NUMBER,
            description: 'Expense amount as positive number',
          },
          accountName: {
            type: Type.STRING,
            description: 'Name of the account to deduct from',
          },
          category: {
            type: Type.STRING,
            description: 'Matching category name',
          },
          subCategory: {
            type: Type.STRING,
            description: 'Matching sub-category name or empty',
          },
          date: {
            type: Type.STRING,
            description: 'Expense date formatted as YYYY-MM-DD',
          },
          explanation: {
            type: Type.STRING,
            description: 'Brief reason for categorization',
          },
        },
        required: ['rephrasedTitle', 'amount', 'accountName', 'category', 'date'],
      },
    });
    let parsed: any[] = [];
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse Gemini response JSON:', text);
      return res.status(200).json({ fallback: true, raw: text });
    }

    res.json({
      success: true,
      data: parsed,
    });
  } catch (err: any) {
    console.error('Gemini bulk-expenses error:', err);
    res.status(200).json({
      fallback: true,
      error: err?.message || 'Gemini processing failed, falling back to local engine',
    });
  }
});

// 4. AI Rephrase & Improve Endpoint for Follow-ups, Wishlists, and Notes
app.post('/api/ai/rephrase', async (req, res) => {
  try {
    const {
      text,
      type = 'note',
      notes = '',
      category = '',
      priority = 'medium',
      dueDate = '',
      categoriesList = [],
    } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' });
    }

    if (!ai) {
      return res.status(200).json({
        fallback: true,
        message: 'No server GEMINI_API_KEY configured; fallback to local heuristic engine',
      });
    }

    const todayDate = new Date().toISOString().split('T')[0];

    const promptText = `
You are a lightweight text enhancer for a personal tracker app.
Task Type: ${type} (can be 'followup', 'wishlist', or 'note')

Input title/text: "${text}"
Current notes/remarks: "${notes}"
Current category: "${category}"
Current priority: "${priority}"
Current dueDate: "${dueDate}"
Available categories: ${JSON.stringify(categoriesList)}
Today's Date: ${todayDate}

Instructions:
1. Rephrase and clean up the title/text into "rephrasedTitle".
   - Make it clear, concise, grammatically correct, and easy to read.
   - CRITICAL REQUIREMENT: Do NOT change the meaning or facts. Keep names, places, numbers, specific intentions, and context completely intact.
2. If input contains multiple sub-points, steps, conditions, or actions (e.g. "First I need to confirm... After confirming... If huge then replace..."), extract them into an array of clear, actionable checklist sub-points in "checklistItems". Each item will have its own checkbox in the app.
3. If input contained extra details or notes, provide a clean "rephrasedNotes". Otherwise keep it brief or null.
4. Suggest the most fitting category ("suggestedCategory") from available categories (or suitable label like Personal, Work, Car, Household).
5. If type is 'followup':
   - If priority is obvious from urgency words (urgent, asap, critical -> high; whenever, someday -> low), suggest "suggestedPriority" ('high', 'medium', 'low').
   - If a date or time expression is mentioned in the text (e.g. "tomorrow", "next Monday", "in 3 days", "Oct 12"), calculate the suggested date as YYYY-MM-DD relative to today (${todayDate}) in "suggestedDueDate".
6. Return JSON adhering to the schema.
`;

    const respText = await callGeminiSafe(promptText, {
      type: Type.OBJECT,
      properties: {
        rephrasedTitle: {
          type: Type.STRING,
          description: 'Improved and cleaned title text preserving exact meaning',
        },
        checklistItems: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Array of discrete checklist sub-points / steps extracted from input',
        },
        rephrasedNotes: {
          type: Type.STRING,
          description: 'Cleaned up notes or details, if applicable',
        },
        suggestedCategory: {
          type: Type.STRING,
          description: 'Best matching category',
        },
        suggestedPriority: {
          type: Type.STRING,
          description: 'high, medium, or low',
        },
        suggestedDueDate: {
          type: Type.STRING,
          description: 'YYYY-MM-DD if date mentioned in text',
        },
        explanation: {
          type: Type.STRING,
          description: 'Short 1-line note of what was improved',
        },
      },
      required: ['rephrasedTitle'],
    });
    let parsed: any = {};
    try {
      parsed = JSON.parse(respText);
    } catch (e) {
      console.error('Failed to parse Gemini rephrase response:', respText);
      return res.status(200).json({ fallback: true, raw: respText });
    }

    res.json({
      success: true,
      data: parsed,
    });
  } catch (err: any) {
    console.error('Gemini rephrase error:', err);
    res.status(200).json({
      fallback: true,
      error: err?.message || 'Gemini rephrase failed, falling back to local engine',
    });
  }
});

// 4.1. AI Auto-Detect for the "+" Button (Plain words to any module)
app.post('/api/ai/auto-detect', async (req, res) => {
  try {
    const { input, categories = [], accounts = [] } = req.body;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({ error: 'input is required' });
    }

    if (!ai) {
      return res.status(200).json({
        fallback: true,
        message: 'No server GEMINI_API_KEY configured; fallback to local heuristic engine',
      });
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const categoryDescriptions = (categories || []).map((c: any) => ({
      category: c.name,
      subCategories: Array.isArray(c.subCategories)
        ? c.subCategories.map((s: any) => (typeof s === 'string' ? s : s.name))
        : [],
    }));
    const accountNames = (accounts || []).map((a: any) => a.name);

    const promptText = `
You are the master intelligent router for Personal Hub.
The user tapped "+" and typed in plain words: "${input}".

Available Categories: ${JSON.stringify(categoryDescriptions)}
Available Accounts: ${JSON.stringify(accountNames)}
Today's Date: ${todayDate}

Tasks:
1. Automatically detect what module this belongs to:
   - "transaction": Money expense, income, or transfer (e.g. "Paid 150 SAR for car fuel", "Received 5000 SAR salary", "Transfer 1000 from SNB to Cash").
   - "followup": Task, action item, reminder, chore, diagnostic step (e.g. "Repair washing machine", "Call mechanic tomorrow", "Follow up on visa renewal").
   - "wishlist": Desired purchase, savings goal, gadget, shopping wish (e.g. "Buy car seat cover", "Save for iPhone 16", "Wishlist drone").
   - "note": Informational note, memo, checklist, idea, reference (e.g. "Meeting minutes", "Packing list", "Wifi passwords").
   - "loan": Money borrowed from someone or lent to someone (e.g. "Lent 500 SAR to Ahmed", "Borrowed 2000 from uncle").
   - "account": Bank account, wallet, or card setup (e.g. "New Alinma savings account with 5000 SAR").
2. Clean and rephrase the title/description into "title".
3. Extract amount as positive number if mentioned ("amount").
4. If "transaction": detect "transactionType" ('expense' | 'income' | 'transfer').
5. Identify best matching "accountName" from Available Accounts.
6. Auto-select category ("category") and sub-category ("subCategory") from Available Categories (especially Car -> Fuel, Maintenance, Cleaning).
7. If date mentioned (today, yesterday, tomorrow, next week), resolve to YYYY-MM-DD in "date". Default to ${todayDate}.
8. Priority ("priority"): 'high', 'medium', or 'low'.
9. If user described multiple steps, parts, or a workflow (like "first check programming, then repair internal parts, else buy new"), break it down into an array of checklist sub-points in "checklistItems".
10. If loan: "counterpartyName", "loanType" ('lent' | 'borrowed').

Return JSON.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedType: {
              type: Type.STRING,
              description: 'transaction, followup, wishlist, note, loan, or account',
            },
            transactionType: {
              type: Type.STRING,
              description: 'expense, income, or transfer (if detectedType is transaction)',
            },
            title: {
              type: Type.STRING,
              description: 'Cleaned, rephrased entry title',
            },
            amount: {
              type: Type.NUMBER,
              description: 'Numeric amount or estimated price in SAR',
            },
            accountName: {
              type: Type.STRING,
              description: 'Matching account name from available accounts',
            },
            category: {
              type: Type.STRING,
              description: 'Matching category',
            },
            subCategory: {
              type: Type.STRING,
              description: 'Matching sub-category or empty string',
            },
            date: {
              type: Type.STRING,
              description: 'YYYY-MM-DD date or dueDate',
            },
            priority: {
              type: Type.STRING,
              description: 'high, medium, or low',
            },
            counterpartyName: {
              type: Type.STRING,
              description: 'Person name for loans',
            },
            loanType: {
              type: Type.STRING,
              description: 'lent or borrowed',
            },
            checklistItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Extracted checklist sub-points',
            },
            explanation: {
              type: Type.STRING,
              description: 'Brief reason why this module & fields were detected',
            },
          },
          required: ['detectedType', 'title'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Gemini auto-detect error:', err);
    res.status(200).json({ fallback: true, error: err?.message });
  }
});

// 4.2. AI Suggestions inside Form (Wishlist Goal form & other edit modals)
app.post('/api/ai/suggest-item', async (req, res) => {
  try {
    const {
      type = 'wishlist',
      title = '',
      currentPrice = 0,
      currentPriority = 'medium',
      currentCategory = '',
      notes = '',
      categories = [],
    } = req.body;

    if (!ai) {
      return res.status(200).json({
        fallback: true,
        message: 'No server GEMINI_API_KEY configured; fallback to local heuristic engine',
      });
    }

    const categoryNames = (categories || []).map((c: any) => c.name || c);

    const promptText = `
You are an expert personal finance and productivity advisor for Personal Hub.
The user is filling out or editing a ${type} (e.g. wishlist, followup, note, loan, account, transaction) and requested AI assistance before saving.

Form Type: ${type}
Current title / name: "${title}"
Current amount / price entered: ${currentPrice}
Current priority: "${currentPriority}"
Current category: "${currentCategory}"
Current notes / details: "${notes}"
Available categories: ${JSON.stringify(categoryNames)}

Instructions based on Form Type (${type}):
1. General: Rephrase and clean up the title / name ("rephrasedTitle") to be crisp, clear, and professional. CRITICAL: Never change the core intent, facts, brand names, or original meaning!
2. If type is 'wishlist':
   - Suggest a reasonable Estimated Price in SAR ("suggestedPrice"): If unentered or 0, estimate a realistic Saudi market price (e.g., car seat covers ~ 250-400 SAR, washing machine ~ 1800 SAR, dashcam ~ 350 SAR, smartphone ~ 3500 SAR, oil change ~ 150 SAR, vacuum cleaner ~ 450 SAR). If entered, review and refine.
   - Suggest appropriate Priority ("suggestedPriority"): 'high', 'medium', or 'low'.
   - Suggest the most accurate Category ("suggestedCategory") and subCategory ("suggestedSubCategory") from available categories (e.g. Car, Tech, Home, Personal).
   - If applicable, break down purchase milestones or action steps into "checklistItems" (e.g. "Check specifications & model", "Compare prices", "Order online").
3. If type is 'followup':
   - Suggest Priority ("suggestedPriority"): 'high' (urgent/critical), 'medium' (important), or 'low'.
   - Suggest Category ("suggestedCategory") from available categories.
   - If input mentions multiple steps, diagnosis, or workflow (e.g. "First check programming, then repair internal parts, else buy new"), break it down into an array of clear, actionable checklist sub-points in "checklistItems".
   - If a date or timeframe is mentioned in text, suggest YYYY-MM-DD in "suggestedDueDate".
4. If type is 'note':
   - Clean up notes / remarks into "rephrasedNotes".
   - Suggest Category ("suggestedCategory") and pastel color ("suggestedColor": 'lavender', 'mint', 'peach', 'sky', 'butter', 'slate').
   - If input has sub-points, extract into "checklistItems".
5. If type is 'loan':
   - Rephrase counterparty name ("suggestedCounterparty") and notes ("rephrasedNotes").
   - Suggest loan type ("suggestedLoanType": 'borrowed' or 'lent').
   - Suggest a reasonable due date ("suggestedDueDate": 30 or 60 days out if unspecified).
6. If type is 'account':
   - Clean up account name (e.g. "snb credit" -> "SNB Credit Card", "alinma salary" -> "Alinma Salary Account").
   - Suggest account type ("suggestedAccountType": 'bank', 'cash', 'wallet', 'savings', 'credit_card').
   - Suggest pastel hex color ("suggestedColor").
7. Provide a concise 1-line reason in "explanation".

Return JSON.
`;

    const responseText = await callGeminiSafe(promptText, {
      type: Type.OBJECT,
      properties: {
        rephrasedTitle: { type: Type.STRING },
        suggestedPrice: { type: Type.NUMBER },
        suggestedPriority: { type: Type.STRING },
        suggestedCategory: { type: Type.STRING },
        suggestedSubCategory: { type: Type.STRING },
        suggestedDueDate: { type: Type.STRING },
        suggestedColor: { type: Type.STRING },
        suggestedAccountType: { type: Type.STRING },
        suggestedLoanType: { type: Type.STRING },
        suggestedCounterparty: { type: Type.STRING },
        rephrasedNotes: { type: Type.STRING },
        checklistItems: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        explanation: { type: Type.STRING },
      },
      required: ['rephrasedTitle'],
    });

    const parsed = JSON.parse(responseText || '{}');
    res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Gemini suggest-item error:', err);
    res.status(200).json({ fallback: true, error: err?.message });
  }
});

// 5. WebSocket Relay Server for Local Wi-Fi Peer-to-Peer Sync
const sessions = new Map<string, { pcWs: WebSocket | null; mobileWs: WebSocket | null; createdAt: number }>();

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  const host = req.headers.host || 'localhost';
  const urlParams = new URL(req.url || '/', `http://${host}`).searchParams;
  const token = urlParams.get('token');
  const role = urlParams.get('role'); // 'pc' or 'mobile'

  if (!token) {
    ws.close(4001, 'Token required');
    return;
  }

  let session = sessions.get(token);
  if (!session) {
    session = { pcWs: null, mobileWs: null, createdAt: Date.now() };
    sessions.set(token, session);
  }

  if (role === 'pc') {
    session.pcWs = ws;
    console.log(`[WS] PC connected for token ${token}`);
  } else if (role === 'mobile') {
    session.mobileWs = ws;
    console.log(`[WS] Mobile connected for token ${token}`);
  }

  ws.on('message', (data: any) => {
    try {
      const message = JSON.parse(data.toString());
      if (role === 'mobile' && session.pcWs && session.pcWs.readyState === WebSocket.OPEN) {
        session.pcWs.send(JSON.stringify(message));
      } else if (role === 'pc' && session.mobileWs && session.mobileWs.readyState === WebSocket.OPEN) {
        session.mobileWs.send(JSON.stringify(message));
      }
    } catch (err: any) {
      console.error('[WS] Error processing message:', err.message);
    }
  });

  ws.on('close', () => {
    if (role === 'pc') session.pcWs = null;
    if (role === 'mobile') session.mobileWs = null;
    if (!session.pcWs && !session.mobileWs) {
      sessions.delete(token);
    }
  });
});

// Periodic cleanup of expired WS sessions (> 120s)
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now - session.createdAt > 120000 && !session.pcWs && !session.mobileWs) {
      sessions.delete(token);
    }
  }
}, 30000);

// 6. Vite middleware for Dev or static assets for Production
const isDev = process.env.NODE_ENV !== 'production';

async function setupFrontend() {
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }
}

await setupFrontend();

const PORT = Number(process.env.PORT) || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Personal Hub server listening on http://0.0.0.0:${PORT}`);
  console.log(`[Server] WebSocket sync relay & Gemini API proxy initialized.`);
});
