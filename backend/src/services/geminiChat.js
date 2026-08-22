const { GoogleGenAI } = require('@google/genai');
const { TOOL_DECLARATIONS, runTool } = require('./chatTools');

// flash-lite: far higher free-tier daily quota than flash, and noticeably faster per call -
// both matter here since one reply can involve several sequential model round-trips (tool calls).
const MODEL = 'gemini-3.1-flash-lite';
const MAX_TOOL_ROUNDS = 4;
const MAX_HISTORY_TURNS = 20;

let ai = null;
function client() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

const SYSTEM_INSTRUCTION = `You are the TrainMitra assistant, embedded on the TrainMitra website (a companion app for Indian Railways passengers).

TrainMitra has no official GPS feed and no real ticket-availability data from IRCTC - everything about delays, live location, and Tatkal sellout speed is crowdsourced from passengers, not fact. When you use the search_trains, get_train_details, search_stations, search_route, get_delay_reports, get_live_status, get_journey_experience or get_tatkal_experience tools, present that data as passenger reports/estimates, not as guaranteed fact. If a tool returns no data, say so plainly rather than guessing.

You can also chat about anything else the user brings up, using your own general knowledge - you are not limited to trains. Never claim to book tickets or handle payments - for actually booking, point users to IRCTC (irctc.co.in).

Be brief. This is a live chat widget, not an essay - every extra sentence is extra time the user waits and extra text they have to read. Default to 1-3 short sentences. Only use a list when the answer genuinely is a list of items (e.g. train options, delay reports), and keep each line to the essential facts - no restating the question, no closing pleasantries, no padding disclaimers beyond one brief note when it actually matters. Answer the question and stop.

Formatting: the chat UI renders plain text only, not markdown. Never use **bold**, headings, or [link](url) syntax - write links as bare URLs. For lists, use a simple "- " prefix on its own line instead of markdown bullets.

Tool use: each tool call is a slow round trip for the user. If you already know you'll need more than one (e.g. delay reports and live status for the same train), call them together in the same turn instead of one at a time.`;

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
];

function toGeminiHistory(history) {
  return (history || [])
    .slice(-MAX_HISTORY_TURNS)
    .filter((turn) => turn && typeof turn.text === 'string' && turn.text.trim() && (turn.role === 'user' || turn.role === 'model'))
    .map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] }));
}

async function sendChatMessage({ message, history }) {
  const chat = client().chats.create({
    model: MODEL,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      safetySettings: SAFETY_SETTINGS,
      // This is a lookup-and-answer assistant, not a reasoning task - minimal thinking
      // cuts multi-second latency per round with no real quality loss here.
      thinkingConfig: { thinkingLevel: 'LOW' },
    },
    history: toGeminiHistory(history),
  });

  let response = await chat.sendMessage({ message });

  let round = 0;
  while (response.functionCalls && response.functionCalls.length > 0 && round < MAX_TOOL_ROUNDS) {
    const calls = response.functionCalls;
    const results = await Promise.all(calls.map((call) => runTool(call.name, call.args)));
    const responseParts = calls.map((call, i) => ({ functionResponse: { name: call.name, response: results[i] } }));
    response = await chat.sendMessage({ message: responseParts });
    round += 1;
  }

  return response.text || "Sorry, I couldn't come up with a reply to that.";
}

module.exports = { sendChatMessage };
