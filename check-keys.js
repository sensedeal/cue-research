
import { buildApiKeyStatusCard, getApiKeyFromSecrets } from './skills/cue-research/src/core/keyManager.js';

const configuredKeys = [];
if (getApiKeyFromSecrets('cuecue')) configuredKeys.push('CUECUE_API_KEY');
if (getApiKeyFromSecrets('tavily')) configuredKeys.push('TAVILY_API_KEY');

console.log(buildApiKeyStatusCard(configuredKeys));
