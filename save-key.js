
import { saveApiKeyToSecrets, detectKeyType, buildKeyConfiguredSuccess, buildKeyConfigFailed } from './skills/cue-research/src/core/keyManager.js';

const apiKey = 'skbX1fQos33AVv7NWMi2uxMnj1';
const keyInfo = detectKeyType(apiKey);

if (!keyInfo) {
  console.log(buildKeyConfigFailed());
} else {
  const provider = keyInfo.type.replace('_API_KEY', '').toLowerCase();
  const success = saveApiKeyToSecrets(provider, apiKey);
  if (success) {
    console.log(buildKeyConfiguredSuccess(keyInfo.name) + '\n💡 配置已立即生效，无需重启。');
  } else {
    console.log('❌ 配置失败，请检查文件权限或联系管理员。');
  }
}
