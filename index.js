// Cue Research Skill - CommonJS Entry Point with ESM Internal
// This allows the skill to use ESM internally while being loaded by OpenClaw's CommonJS system

let skillModule = null;

async function loadSkillModule() {
  if (skillModule) return skillModule;
  
  // Use dynamic import to load ESM module
  const modulePath = './src/index.js';
  skillModule = await import(modulePath);
  return skillModule;
}

module.exports = {
  name: "cue-research",
  
  async onCommand(context) {
    const mod = await loadSkillModule();
    if (mod.default && typeof mod.default.onCommand === 'function') {
      return mod.default.onCommand(context);
    }
  },

  // 方案 C：处理大模型的函数调用
  async onToolCall(context) {
    const mod = await loadSkillModule();
    if (mod.default && typeof mod.default.onToolCall === 'function') {
      return mod.default.onToolCall(context);
    }
  },

  // 方案 C：处理大模型的函数调用（备用名）
  async onFunctionCall(context) {
    const mod = await loadSkillModule();
    if (mod.default && typeof mod.default.onFunctionCall === 'function') {
      return mod.default.onFunctionCall(context);
    }
  },

  // OpenClaw 标准事件钩子：message:received
  async onMessageReceived(context) {
    const mod = await loadSkillModule();
    if (mod.default && typeof mod.default.onMessageReceived === 'function') {
      return mod.default.onMessageReceived(context);
    }
  },

  // 向下兼容
  async onMessage(context) {
    const mod = await loadSkillModule();
    if (mod.default && typeof mod.default.onMessage === 'function') {
      return mod.default.onMessage(context);
    }
  },

  async onCardAction(context) {
    const mod = await loadSkillModule();
    if (mod.default && typeof mod.default.onCardAction === 'function') {
      return mod.default.onCardAction(context);
    }
  },
};
