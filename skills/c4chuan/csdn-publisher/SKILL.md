---
name: csdn-publisher
description: 写文章并发布到 CSDN。使用浏览器自动化 + 扫码登录。支持通过 Telegram 发送二维码，无需 VNC。
---

# CSDN Publisher

通过浏览器自动化发布文章到 CSDN。支持扫码登录，二维码可通过 Telegram 发送。

## 前置条件

### 1. 安装 Chrome

```bash
cd /tmp && curl -sL \
  "https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm" \
  -o chrome.rpm && yum install -y ./chrome.rpm
```

### 2. 安装 Python 依赖

```bash
pip install playwright -i https://pypi.org/simple/
playwright install chromium
```

### 3. 配置 OpenClaw 浏览器

需要 headless + noSandbox 模式（服务器无显示器）：

```bash
# 通过 gateway config.patch 添加：
{"browser": {"headless": true, "noSandbox": true}}
```

---

## 扫码登录流程 ✨

### 完整流程（推荐）

1. **启动登录脚本**
```bash
cd /root/.openclaw/workspace/skills/csdn-publisher
nohup python scripts/login.py login --timeout 300 > /tmp/csdn-login.log 2>&1 &
```

2. **等待二维码生成**（约 10-15 秒）
```bash
# 检查二维码是否生成
ls ~/.openclaw/workspace/credentials/csdn-qr.png
```

3. **通过 Telegram 发送二维码**
```
message(action="send", filePath="~/.openclaw/workspace/credentials/csdn-qr.png", target="用户ID", caption="请用 CSDN App 扫码登录")
```

4. **用户扫码后，脚本自动保存 Cookie**
```bash
# 检查登录结果
cat /tmp/csdn-login.log
```

### 检查 Cookie 有效性

```bash
python scripts/login.py check
```

---

## Cookie 存储

```
~/.openclaw/workspace/credentials/csdn-cookie.json   # Playwright storage_state 格式
~/.openclaw/workspace/credentials/csdn-cookie.txt    # 简单字符串格式（兼容）
~/.openclaw/workspace/credentials/csdn-qr.png        # 登录二维码截图
```

---

## 发布文章流程

### Step 1: 检查登录状态

先检查 Cookie 是否有效，无效则启动扫码登录流程。

### Step 2: 启动浏览器

```
browser action=start profile=openclaw
```

### Step 3: 打开编辑器

```
browser action=open targetUrl=https://editor.csdn.net/md
```

### Step 4: 输入标题

找到标题输入框（ref），输入标题（5-100字）。

### Step 5: 注入文章内容

```javascript
const content = `你的 Markdown 内容`;
const editor = document.querySelector('.editor__inner');
editor.textContent = content;
editor.dispatchEvent(new Event('input', { bubbles: true }));
```

### Step 6: 发布

1. 点击"发布文章"按钮
2. 在弹窗中确认设置（标签、类型等）
3. 再次点击"发布文章"
4. 看到绿色勾号 = 成功

---

## 目录结构

```
csdn-publisher/
├── SKILL.md           # 本文档
└── scripts/
    └── login.py       # 扫码登录脚本
```

---

## 踩坑记录

| 坑 | 原因 | 解决方案 |
|----|------|----------|
| Playwright 安装失败 | 国内镜像源没有 | `pip install playwright -i https://pypi.org/simple/` |
| 进程被 kill | OpenClaw 超时机制 | 用 `nohup` 后台运行 |
| 二维码定位失败 | 选择器不对 | 用 `img[src*="qrcode"]` |
| 浏览器启动失败 | 服务器无显示器 | 配置 `headless: true, noSandbox: true` |
| Cookie 注入无效 | domain 设置错误 | 必须设置 `domain=.csdn.net` |

---

## 写作风格要求

**核心原则：不要 AI 味**

- ❌ 不要用"首先...其次...最后..."这种模板句式
- ❌ 不要用"值得注意的是"、"总而言之"、"综上所述"
- ❌ 不要每段都总结，不要过度解释
- ✅ 用口语化表达，像跟朋友聊天
- ✅ 可以吐槽、可以有情绪
- ✅ 用具体的细节和故事，不要泛泛而谈

**标题技巧：**
- 用数字：「3 个坑让我搞了 2 小时」
- 用冲突：「CSDN 官方 API 挂了，我只能...」
- 用悬念：「没想到最后是这样解决的」

---

## 完整工作流示例

```
1. 用户说"帮我发篇 CSDN 文章"
2. 检查 Cookie 是否有效
   ├─ 有效 → 继续
   └─ 无效 → 启动扫码登录
              ├─ 运行 login.py
              ├─ 等待二维码生成
              ├─ 通过 Telegram 发送二维码
              ├─ 用户扫码
              └─ Cookie 自动保存
3. 撰写 Markdown 文章
4. 启动浏览器，打开编辑器
5. 注入标题和内容
6. 点击发布，确认设置
7. 截图验证发布成功
```

---

## 自动通知配置 🔔

登录成功后自动发送 Telegram 通知，无需用户手动确认。

### 1. 配置 Telegram 通知

```bash
python scripts/login.py setup-notify \
  --bot-token "YOUR_BOT_TOKEN" \
  --chat-id "YOUR_CHAT_ID"
```

配置会保存到 `~/.openclaw/workspace/credentials/telegram-notify.json`

### 2. 启动带通知的登录

```bash
nohup python scripts/login.py login --timeout 300 --notify > /tmp/csdn-login.log 2>&1 &
```

登录成功后会自动发送 Telegram 消息："✅ CSDN 登录成功！Cookie 已保存，可以继续发布文章了。"

---

## Changelog

- **v1.3.0**: 添加登录成功自动 Telegram 通知功能，无需用户手动确认
- **v1.2.0**: 完善 Telegram 二维码发送流程，添加完整工作流示例
- **v1.1.0**: 添加扫码登录脚本 `scripts/login.py`
- **v1.0.0**: 初始版本，手动 Cookie 注入
