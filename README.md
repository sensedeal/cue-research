# 🔍 Cue Research - 你的专属 AI 调研助理 (OpenClaw Skill)

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Environment](https://img.shields.io/badge/OpenClaw-Gateway-success)
![License](https://img.shields.io/badge/license-MIT-green)

Cue Research 是一款专为 OpenClaw 打造的深度调研与智能监控技能。只需一句话，即可在 5-30 分钟内自动调度多个 AI 智能体，为您生成包含数据支撑、逻辑严密的专业级行业与公司分析报告，并支持 24/7 不间断的全网动态监控。

## ✨ 核心特性 (v1.0 架构升级)

- 🚀 **极致性能**：基于纯异步 I/O 构建，0 子进程开销，完美适配 OpenClaw 高并发场景。
- 🛡️ **安全隔离**：用户数据严格隔离于独立工作区，绝不越权访问宿主文件。
- 🧠 **动态研判**：自动识别分析意图（宏观、短线、财报、产业），动态匹配最佳研究框架。
- 🔔 **智能巡防**：内置智能防雪崩 Cron 守护进程，7x24 小时追踪重要资讯并主动推送。

## ⚙️ 安装与配置

详细的安装步骤请查看 [INSTALL.md](./INSTALL.md) 安装指南。

本插件依赖外部 API 提供大模型推理和全网实时搜索能力。请在 OpenClaw 的 **Secrets (密钥管理)** 中配置以下环境变量：

| 变量名 | 是否必填 | 获取地址 | 说明 |
| --- | --- | --- | --- |
| `CUECUE_API_KEY` | **必填** | [CueCue 官网](https://cuecue.cn) | 用于驱动深度研究的 Agent API |
| `TAVILY_API_KEY` | 选填 | [Tavily 官网](https://tavily.com) | 提供更精准的金融及新闻搜索能力 |

*注：配置完成后，无需重启 Gateway，插件将自动读取并生效。*

## ⌨️ 命令列表

| 命令 | 功能说明 | 示例 |
| --- | --- | --- |
| `/cue <问题>` | 💡 **发起深度调研**（核心功能） | `/cue 分析宁德时代竞争优势` |
| `/ct` | 📊 **查看任务状态** | 查看当前正在进行的调研进度 |
| `/cm` | 🔔 **查看我的监控** | 列出当前所有活跃的订阅监控 |
| `/cm add <主题>` | ➕ **添加自定义监控** | `/cm add 苹果固态电池进展` |
| `/ch` | ❓ **查看帮助菜单** | 显示所有可用指令 |

## ⚖️ 合规与免责声明

**本插件提供的所有输出结果均由人工智能大语言模型及全网搜索数据自动生成，仅供数据分析和研究参考，在任何情况下均不构成对任何人的实质性投资建议或买卖指导。投资者应独立决策，自担风险。**

---
*Developed with ❤️ by SenseDeal Team.*
