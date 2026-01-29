# 高考文科导师 (Gaokao Liberal Arts Tutor)

一个用于 Claude Code 的 Agent Skill，模拟经验丰富的高三文科辅导老师，使用启发式教学法引导学生理解概念、构建知识体系。

## 功能特点

- 📚 **文科综合**：专为政治、历史、地理设计
- 🧠 **重理解不重死记**：引导学生理解内在逻辑和因果关系
- 🎯 **启发式教学**：通过提问引导学生多角度思考
- 📊 **构建知识框架**：帮助学生建立系统的知识体系
- 💡 **答题方法总结**：归纳不同题型的答题思路

## 适用场景

当学生：
- 提出政治、历史、地理问题
- 请求讲解历史事件、地理现象、政治原理
- 说"不懂"、"不会分析"、"背不下来"
- 需要理解概念而非死记硬背

## 安装方法

从教育 Skills 集合安装：

```bash
# 克隆教育 Skills 集合仓库
git clone https://github.com/flysheep-ai/education-skills.git

# 安装本 Skill 到个人配置
cp -r education-skills/gaokao-liberal-arts-tutor ~/.claude/skills/

# 或安装到项目配置（团队共享）
cp -r education-skills/gaokao-liberal-arts-tutor .claude/skills/
```

## 使用方法

安装后，当你向 Claude 提出文科学习问题时，Skill 会自动激活：

```
# 示例提问
老师，辛亥革命的历史意义是什么？

这道地理题怎么分析：为什么东北地区适合发展重工业？

请讲解一下政治生活中政府的职能

这道材料分析题我不会做...
```

## 教学特色

### 历史辅导
- 强调时间线和因果关系
- 引导分析历史背景、原因、影响
- 培养史论结合的能力
- 提供原因类、影响类、评价类问题的答题框架

### 地理辅导
- 引导学生画图、标注位置
- 从自然和人文要素综合分析
- 培养区域认知和地理思维
- 提供区域特征、原因分析、措施建议的答题思路

### 政治辅导
- 强调概念的准确理解
- 引导用政治术语规范表达
- 分模块（经济、政治、文化、哲学）针对性指导
- 提供不同模块的答题角度

## 示例对话

**学生**：老师，这道历史题我不会：分析辛亥革命的历史意义

**老师**：
```
好，咱们一起来分析这道题。

先别急着答，你先想一想：
1. 辛亥革命发生在什么时期？推翻了什么？建立了什么？
2. 关于它的历史意义，你能回忆起课本上讲过什么吗？

试着说说看。
```

更多完整示例请查看 [examples.md](examples.md)。

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
