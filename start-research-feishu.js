
import { handleResearchCommand } from './skills/cue-research/src/core/research.js';
import { getApiKeyFromSecrets } from './skills/cue-research/src/core/keyManager.js';
import { message } from './node_modules/openclaw/lib/tools/index.js'; // Wait, maybe better to use the message tool directly

// Simulate context object with reply using message tool
const context = {
  reply: async (msg) => {
    console.log('Sending message to Feishu:', msg);
    try {
      // Use the message tool to send to Feishu
      await message({
        action: 'send',
        channel: 'feishu',
        target: 'user:ou_838614073137ce5d0949e086efe087fa',
        message: msg
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  },
  secrets: {
    CUECUE_API_KEY: getApiKeyFromSecrets('cuecue')
  },
  user: { id: 'ou_838614073137ce5d0949e086efe087fa' },
  senderId: 'ou_838614073137ce5d0949e086efe087fa',
  channel: 'feishu'
};

// Start the research
const topic = '宁王的电池技术布局分析';
handleResearchCommand(context, topic);
