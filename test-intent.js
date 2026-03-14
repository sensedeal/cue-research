
import { detectResearchIntent } from './skills/cue-research/src/core/intent.js';

const input = '宁王的电池技术布局分析';
const result = detectResearchIntent(input);
console.log('Input:', input);
console.log('Result:', result);
