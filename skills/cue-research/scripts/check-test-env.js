#!/usr/bin/env node
/**
 * 测试环境检查
 * 确保所有依赖和配置就绪
 */

import fs from 'fs-extra';
import path from 'path';

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║         Cue Research 测试环境检查                          ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

const checks = [
  {
    name: 'Node.js 版本',
    check: () => {
      const version = process.version;
      const major = parseInt(version.slice(1).split('.')[0]);
      return { pass: major >= 18, message: version };
    }
  },
  {
    name: 'secrets.json 配置',
    check: () => {
      const secretsPath = path.join(process.cwd(), 'secrets.json');
      if (!fs.existsSync(secretsPath)) {
        return { pass: false, message: '文件不存在' };
      }
      const secrets = fs.readJsonSync(secretsPath);
      const hasCueCue = !!secrets.CUECUE_API_KEY;
      const hasTavily = !!secrets.TAVILY_API_KEY;
      return {
        pass: hasCueCue || hasTavily,
        message: `CUECUE: ${hasCueCue ? '✅' : '❌'}, TAVILY: ${hasTavily ? '✅' : '❌'}`
      };
    }
  },
  {
    name: '测试文件完整性',
    check: () => {
      const testFiles = [
        'test/test-mode-detector.js',
        'test/nlu-test.js',
        'test/run-prompt-tests.js',
        'test/run-quick-reply-tests.js',
        'test/run-prompt-quality-tests.js',
        'tests/e2e/simple-e2e-test.js'
      ];
      
      const missing = testFiles.filter(f => !fs.existsSync(path.join(process.cwd(), f)));
      return {
        pass: missing.length === 0,
        message: missing.length === 0 ? '全部存在' : `缺少：${missing.join(', ')}`
      };
    }
  },
  {
    name: '文档完整性',
    check: () => {
      const docs = [
        'README.md',
        'USER-TESTING-GUIDE.md',
        'SKILL.md'
      ];
      
      const missing = docs.filter(f => !fs.existsSync(path.join(process.cwd(), f)));
      return {
        pass: missing.length === 0,
        message: missing.length === 0 ? '全部存在' : `缺少：${missing.join(', ')}`
      };
    }
  }
];

async function runChecks() {
  let allPassed = true;
  
  for (let i = 0; i < checks.length; i++) {
    const item = checks[i];
    const result = await Promise.resolve(item.check());
    const icon = result.pass ? '✅' : '❌';
    console.log(`${i + 1}. ${item.name}`);
    console.log(`   ${icon} ${result.message}`);
    if (!result.pass) allPassed = false;
    console.log();
  }
  
  // 快速功能测试
  console.log('5. 快速功能测试');
  try {
    const { detectResearchIntent } = await import('../src/core/intent.js');
    const result = detectResearchIntent('分析宁德时代');
    const pass = result?.shouldTrigger === true;
    console.log(`   ${pass ? '✅' : '❌'} NLU 识别：${pass ? '正常' : '失败'}`);
    if (!pass) allPassed = false;
  } catch (e) {
    console.log(`   ❌ NLU 识别：${e.message}`);
    allPassed = false;
  }
  console.log();
  
  try {
    const { buildSmartPrompt } = await import('../src/core/promptEngine.js');
    const prompt = buildSmartPrompt('测试');
    const pass = prompt.length > 100;
    console.log(`6. Prompt 生成`);
    console.log(`   ${pass ? '✅' : '❌'} 生成长度：${prompt.length} 字符`);
    if (!pass) allPassed = false;
  } catch (e) {
    console.log(`6. Prompt 生成`);
    console.log(`   ❌ 错误：${e.message}`);
    allPassed = false;
  }
  console.log();
  
  console.log('═'.repeat(60));
  if (allPassed) {
    console.log('✅ 所有检查通过！可以开始用户测试了！\n');
    console.log('📋 下一步:');
    console.log('   1. 打开 USER-TESTING-GUIDE.md');
    console.log('   2. 按照场景进行测试');
    console.log('   3. 记录测试结果');
    console.log('   4. 提交问题反馈\n');
  } else {
    console.log('❌ 部分检查未通过，请先修复问题。\n');
  }
  
  process.exit(allPassed ? 0 : 1);
}

runChecks();
