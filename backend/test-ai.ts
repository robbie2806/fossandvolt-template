import { generateBlipkinResponse } from './src/utils/ai';

async function test() {
  console.log('Testing AI with CODEX_API_KEY...');
  console.log('API Key present:', !!process.env.CODEX_API_KEY);
  console.log('Base URL:', process.env.OPENAI_BASE_URL);

  try {
    const response = await generateBlipkinResponse({
      blipkinName: 'TestBlipkin',
      blipkinLevel: 1,
      blipkinMood: 'Happy',
      blipkinBond: 50,
      blipkinEnergy: 80,
      blipkinHunger: 30,
      userMessage: 'Hello!',
      chatHistory: []
    });

    console.log('✅ SUCCESS! AI Response:', response);
  } catch (error) {
    console.error('❌ FAILED:', error);
  }
}

test();
