---
name: oauth-helper
description: |
  自动完成多种 OAuth 登录流程。支持的提供商：
  - Google、Apple、Microsoft、GitHub、Discord、微信、QQ
  
  流程：
  1. 检测 OAuth 页面
  2. 发送 Telegram 确认消息
  3. 用户回复 yes 后自动完成登录
  
  使用场景：
  - 需要登录新网站时遇到 OAuth 选项
  - 自动化流程中需要 OAuth 授权
  - 批量登录多个站点
---

# OAuth Helper

自动完成 OAuth 登录，支持 7 种主流提供商。

## 支持的 OAuth 提供商

| 提供商 | 状态 | 检测域名 |
|--------|------|----------|
| Google | ✅ | accounts.google.com |
| Apple | ✅ | appleid.apple.com |
| Microsoft | ✅ | login.microsoftonline.com, login.live.com |
| GitHub | ✅ | github.com/login/oauth |
| Discord | ✅ | discord.com/oauth2, discord.com/login |
| 微信 | ✅ | open.weixin.qq.com |
| QQ | ✅ | graph.qq.com, ssl.xui.ptlogin2.qq.com |

## 前提条件

1. clawd 浏览器已登录对应账号（一次性设置）
2. Telegram 消息通道可用

## OAuth 检测模式

### Google
```
URL 匹配：
- accounts.google.com/o/oauth2
- accounts.google.com/signin/oauth
- accounts.google.com/v3/signin
```

### Apple
```
URL 匹配：
- appleid.apple.com/auth/authorize
- appleid.apple.com/auth/oauth2
```

### Microsoft
```
URL 匹配：
- login.microsoftonline.com/common/oauth2
- login.microsoftonline.com/consumers
- login.live.com/oauth20
```

### GitHub
```
URL 匹配：
- github.com/login/oauth/authorize
- github.com/login
- github.com/sessions/two-factor
```

### Discord
```
URL 匹配：
- discord.com/oauth2/authorize
- discord.com/login
- discord.com/api/oauth2
```

### 微信
```
URL 匹配：
- open.weixin.qq.com/connect/qrconnect
- open.weixin.qq.com/connect/oauth2
```

### QQ
```
URL 匹配：
- graph.qq.com/oauth2.0/authorize
- ssl.xui.ptlogin2.qq.com
- ui.ptlogin2.qq.com
```

## 核心流程

### 流程 A：登录页检测多个 OAuth 选项

当用户请求登录某网站时：

```
1. 打开网站登录页
2. 扫描页面，检测所有可用的 OAuth 按钮
3. 发送 Telegram 消息询问：
   "🔐 [站点名] 支持以下登录方式：
    1️⃣ Google
    2️⃣ Apple  
    3️⃣ GitHub
    选择哪个？回复数字"
4. 等待用户回复数字（超时 60 秒）
5. 点击对应的 OAuth 按钮
6. 进入流程 B
```

### 流程 B：OAuth 授权页确认

当进入 OAuth 提供商页面时：

```
1. 检测 OAuth 页面类型（根据 URL 判断提供商）
2. 提取目标站点信息
3. 发送 Telegram 消息："🔐 [站点名] 请求 [提供商] 登录，确认？回复 yes"
4. 等待用户回复 yes（超时 60 秒）
5. 根据提供商执行对应的点击序列
6. 等待跳转回原站点
7. 发送："✅ 登录成功！"
```

## 各提供商点击序列

### Google
```
账号选择: [data-identifier], .JDAKTe
授权按钮: button:has-text("允许"), button:has-text("Allow"), 
         button:has-text("继续"), button:has-text("Continue")
```

### Apple
```
账号输入: input[type="email"], #account_name_text_field
密码输入: input[type="password"], #password_text_field  
继续按钮: button#sign-in, button:has-text("Continue")
信任设备: button:has-text("Trust")
```

### Microsoft
```
账号选择: .table-row[data-test-id]
账号输入: input[type="email"], input[name="loginfmt"]
密码输入: input[type="password"], input[name="passwd"]
下一步: button#idSIButton9, button:has-text("Next")
登录: button#idSIButton9, button:has-text("Sign in")
接受: button#idBtn_Accept
```

### GitHub
```
账号输入: input#login_field
密码输入: input#password
登录按钮: input[type="submit"], button:has-text("Sign in")
授权按钮: button[name="authorize"], button:has-text("Authorize")
2FA输入: input#app_totp (如需要)
```

### Discord
```
账号输入: input[name="email"]
密码输入: input[name="password"]
登录按钮: button[type="submit"]
授权按钮: button:has-text("Authorize"), button:has-text("授权")
```

### 微信
```
检测方式: 扫码登录为主
- 显示二维码截图给用户
- 等待用户手机扫码确认
- 检测页面跳转
```

### QQ
```
检测方式: 扫码或账密登录
扫码: 截图二维码给用户
账密登录（如支持）:
  - 切换到账密模式: a:has-text("密码登录")
  - 账号输入: input#u
  - 密码输入: input#p
  - 登录按钮: input#login_button
```

## 智能检测 OAuth 选项

在登录页面扫描以下选择器，找到所有可用的 OAuth 按钮：

| 提供商 | 检测选择器 | 常见文本 |
|--------|-----------|----------|
| Google | `[data-provider="google"]`, `.google-btn`, `button img[src*="google"]` | "Continue with Google", "使用 Google 登录" |
| Apple | `[data-provider="apple"]`, `.apple-btn`, `button img[src*="apple"]` | "Sign in with Apple", "通过 Apple 登录" |
| Microsoft | `[data-provider="microsoft"]`, `.microsoft-btn` | "Sign in with Microsoft" |
| GitHub | `[data-provider="github"]`, `.github-btn` | "Continue with GitHub" |
| Discord | `[data-provider="discord"]`, `.discord-btn` | "Login with Discord" |
| 微信 | `.wechat-btn`, `button img[src*="wechat"]`, `button img[src*="weixin"]` | "微信登录", "WeChat" |
| QQ | `.qq-btn`, `button img[src*="qq"]` | "QQ登录", "QQ Login" |

### 检测示例代码（伪代码）

```javascript
const providers = [];
const snapshot = await browser.snapshot();

// 检测各提供商
if (snapshot.includes('Google') || snapshot.includes('google')) {
  providers.push({ name: 'Google', ref: findRef('Google') });
}
if (snapshot.includes('Apple') || snapshot.includes('apple')) {
  providers.push({ name: 'Apple', ref: findRef('Apple') });
}
// ... 其他提供商

// 发送选择消息
if (providers.length > 1) {
  const options = providers.map((p, i) => `${i+1}️⃣ ${p.name}`).join('\n');
  message(`🔐 检测到以下登录方式：\n${options}\n回复数字选择`);
}
```

## 一次性设置：登录各平台

首次使用需在 clawd 浏览器中登录各平台：

```bash
# Google
browser action=navigate profile=clawd url=https://accounts.google.com

# Apple
browser action=navigate profile=clawd url=https://appleid.apple.com

# Microsoft  
browser action=navigate profile=clawd url=https://login.live.com

# GitHub
browser action=navigate profile=clawd url=https://github.com/login

# Discord
browser action=navigate profile=clawd url=https://discord.com/login

# 微信/QQ - 通常使用扫码，无需预登录
```

## 错误处理

- 用户未回复 yes → 取消操作，通知用户
- 需要 2FA → 提示用户手动输入验证码
- 扫码超时 → 重新生成二维码截图
- 登录失败 → 截图发送给用户排查

## 使用示例

```
用户: 帮我登录 Notion
Agent:
1. 打开 notion.so/login
2. 检测到 Google/Apple 登录选项
3. 发送: "🔐 Notion 请求登录，检测到以下选项：
   1. Google
   2. Apple
   选择哪个？"
4. 用户回复: 1
5. 点击 Google 登录
6. 检测到 Google OAuth 页面
7. 发送: "🔐 Notion 请求 Google 登录，确认？回复 yes"
8. 用户回复: yes
9. 完成登录流程
```
