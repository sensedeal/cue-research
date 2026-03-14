
import { detectKeyType } from './skills/cue-research/src/core/keyManager.js';

const apiKey = 'skbX1fQos33AVv7NWMi2uxMnj1';
console.log('Testing key:', apiKey);
console.log('detectKeyType result:', detectKeyType(apiKey));

// Let's test the regex directly
const regex = /^skbX?-/i;
console.log('Regex test:', regex.test(apiKey));
