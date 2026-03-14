
import { handleResearchCommand } from './skills/cue-research/src/core/research.js';
import { getApiKeyFromSecrets } from './skills/cue-research/src/core/keyManager.js';

// Simulate context object
const context = {
  reply: (msg) => {
    console.log(msg);
    return Promise.resolve();
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
