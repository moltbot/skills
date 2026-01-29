# 高考理科导师 (Gaokao Science Tutor)

一个用于 Claude Code 的 Agent Skill，模拟经验丰富的高三理科辅导老师，使用渐进式教学法引导学生独立思考和解决问题。

## 功能特点

- 🎓 **针对性强**：专为中国高三理科生设计，覆盖数学、物理、化学、生物
- 🤔 **苏格拉底式提问**：通过引导性问题激发学生思考，而非直接给答案
- 📊 **渐进式教学**：每次只推进一小步，确保学生理解每个环节
- 💪 **鼓励式语言**：亲切、耐心的高三老师语气，帮助学生建立信心
- ✨ **总结提升**：每道题后总结解题方法和易错点

## 适用场景

当学生：
- 提出理科问题需要讲解
- 说"我不懂"、"教我"、"不会做"
- 请求辅导或详细解释
- 需要思路引导而非直接答案

## 安装方法

### 方法一：从教育 Skills 集合安装（推荐）

```bash
# 克隆教育 Skills 集合仓库
git clone https://github.com/flysheep-ai/education-skills.git

# 安装本 Skill 到个人配置
cp -r education-skills/gaokao-science-tutor ~/.claude/skills/

# 或安装到项目配置（团队共享）
cp -r education-skills/gaokao-science-tutor .claude/skills/
```

### 方法二：手动下载

1. 访问 [教育 Skills 集合仓库](https://github.com/flysheep-ai/education-skills)
2. 下载 `gaokao-science-tutor` 文件夹
3. 将文件夹复制到以下位置之一：
   - 个人使用：`~/.claude/skills/gaokao-science-tutor/`
   - 项目共享：`.claude/skills/gaokao-science-tutor/`

## 使用方法

安装后，当你向 Claude 提出理科学习问题时，Skill 会自动激活：

```
# 示例提问
我不会这道导数题：已知函数f(x)=x³-3x²+2，求f(x)的单调区间

这道物理题怎么做：一个物体从静止开始自由落体...

老师，能讲讲这个化学反应吗？

这道遗传题我没思路...
```

Claude 会以高三辅导老师的身份，通过提问引导你逐步解决问题。

## 文件结构

```
gaokao-science-tutor/
├── SKILL.md          # 主 Skill 文件（必需）
├── examples.md       # 详细的教学对话示例
└── README.md         # 本文件
```

## 教学原则

本 Skill 遵循以下教学原则：

1. **不直接给答案**：通过提问引导思考
2. **渐进式引导**：每次只推进一小步
3. **确认理解**：每步都确认学生真正理解了再继续
4. **科目针对性**：针对数学、物理、化学、生物的不同特点
5. **情感支持**：理解学生压力，给予鼓励

## 示例对话

### 数学题辅导

**学生**：这道导数题我不会做

**老师**：
```
好，咱们一起来看这道题。
先别着急，你先仔细读一遍题目，然后告诉我：
1. 这道题要求我们求什么？
2. 题目给了哪些已知条件？
```

更多完整示例请查看 [examples.md](examples.md)。

## 贡献

欢迎贡献改进建议！可以通过以下方式：

1. Fork [教育 Skills 集合仓库](https://github.com/flysheep-ai/education-skills)
2. 创建特性分支 (`git checkout -b feature/improvement`)
3. 提交更改 (`git commit -m 'Add some improvement'`)
4. 推送到分支 (`git push origin feature/improvement`)
5. 创建 Pull Request

## 许可证

本 Skill 采用 MIT 许可证，详见仓库根目录的 [LICENSE](../LICENSE) 文件。

## 作者

[@flysheep-ai](https://github.com/flysheep-ai)

## 反馈

如果你在使用过程中遇到问题或有改进建议，欢迎：
- [提交 Issue](https://github.com/flysheep-ai/education-skills/issues)
- [发起 Pull Request](https://github.com/flysheep-ai/education-skills/pulls)
- 在 [Discussions](https://github.com/flysheep-ai/education-skills/discussions) 讨论

## 致谢

感谢所有为高考努力的学生，以及默默付出的老师们。

---

**注意**：本 Skill 是教学辅助工具，不能替代系统的学习和练习。建议配合课本、练习册和老师指导使用。
