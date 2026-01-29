# 高考英语导师 (Gaokao English Tutor)

一个用于 Claude Code 的 Agent Skill，模拟经验丰富的高三英语辅导老师，培养学生的英语语言能力、应试技巧和学习方法。

## 功能特点

- 📚 **全题型覆盖**：阅读理解、完形填空、语法填空、写作
- 🔤 **词汇语法并重**：先扫除词汇障碍，再讲解语法结构
- 🎯 **理解优先**：不只讲技巧，更注重真正理解
- ✍️ **写作提升**：从审题到表达的系统指导
- 📖 **方法总结**：归纳各类题型的解题方法

## 适用场景

当学生：
- 提出英语阅读、完形、语法填空问题
- 请求讲解英语语法
- 需要作文审题、构思、语言提升
- 说"单词不认识"、"句子看不懂"
- 需要英语学习方法和做题技巧

## 安装方法

从教育 Skills 集合安装：

```bash
# 克隆教育 Skills 集合仓库
git clone https://github.com/flysheep-ai/education-skills.git

# 安装本 Skill 到个人配置
cp -r education-skills/gaokao-english-tutor ~/.claude/skills/

# 或安装到项目配置（团队共享）
cp -r education-skills/gaokao-english-tutor .claude/skills/
```

## 使用方法

安装后，当你向 Claude 提出英语学习问题时，Skill 会自动激活：

```
# 示例提问
这篇英语阅读我看不懂

这道完形填空为什么选B？

这个语法填空应该填什么？

我的英语作文怎么写？

这个句子的结构是什么？
```

## 教学特色

### 阅读理解
- 主旨大意题、细节理解题、推理判断题、词义猜测题的解题方法
- 先理解文章，再做题
- 教授定位技巧和选项分析方法

### 完形填空
- 注重上下文逻辑和词汇复现
- 教授固定搭配和语境分析
- 培养把握文章基调的能力

### 语法填空
- 有提示词：名词、动词、形容词的变形规则
- 无提示词：冠词、介词、连词、代词的使用
- 系统讲解时态语态、非谓语、从句

### 写作
- 审题构思、谋篇布局、语言表达全流程
- 提供各类体裁的写作框架
- 教授词汇升级和句式多样化技巧

## 示例对话

**学生**：这篇阅读的主旨大意题我不会做

**老师**：
```
好，咱们一起来看这道主旨题。

先别急着选答案，你先完整读一遍文章（或回忆一下），
然后告诉我：
1. 文章主要讲了什么？
2. 首段和尾段说了什么？

试着用中文概括一下。
```

## 贡献

欢迎贡献改进建议！

1. Fork [教育 Skills 集合仓库](https://github.com/flysheep-ai/education-skills)
2. 创建特性分支
3. 提交更改
4. 发起 Pull Request

## 许可证

本 Skill 采用 MIT 许可证，详见仓库根目录的 [LICENSE](../LICENSE) 文件。

## 作者

[@flysheep-ai](https://github.com/flysheep-ai)

## 反馈

如果你在使用过程中遇到问题或有改进建议：
- [提交 Issue](https://github.com/flysheep-ai/education-skills/issues)
- [发起 Pull Request](https://github.com/flysheep-ai/education-skills/pulls)
- 在 [Discussions](https://github.com/flysheep-ai/education-skills/discussions) 讨论

---

**注意**：本 Skill 是教学辅助工具，不能替代系统的学习和练习。建议配合课本、笔记和老师指导使用。
