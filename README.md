# Note.ms 智能防抖保存优化

> 这是一个针对 note.ms 的 Tampermonkey 油猴脚本，旨在优化自动保存体验，以及提供风味文本。

## 功能特性
- **智能防抖保存**：输入停止 5 秒后自动触发保存，或Ctrl+S手动保存，减少服务器压力以及一定程度上缓解文本过长时的卡顿问题。
- **无变更静默**：内容未修改时不重复保存。
- **删除冷却反馈**：删除内容时触发随机删除风味文本。
- **循环闲置互动**：长时间无操作时，随机显示待机风味文本。

## 安装方法
1. 确保浏览器已安装 [Tampermonkey](https://www.tampermonkey.net/) 或 Violentmonkey 扩展。
2. 点击下方的 [安装链接](https://www.tampermonkey.net/script_installation.php#url=https://github.com/R03montia/note-ms-debounce-optimize-script/raw/refs/heads/main/note-ms-script/note-ms.user.js)。
3. 在弹出的页面中点击 **安装 (Install)**。

## 配置参数
脚本内部 `CONFIG` 对象支持微调，可以在此处自定义风味文本内容和数量（需修改源码）：
- `saveDelay`: 自动保存延迟，默认 5000ms
- `idleTimeout`: 闲置台词触发间隔，默认 30000ms
- `deletionCooldown`: 删除提示冷却，默认 5000ms

## 免责声明
- 本脚本为个人开发，与 note.ms 官方无关。
- 脚本仅在本地运行，不收集任何用户数据。
- 如遇 note.ms 网页改版导致脚本失效，请提 Issue 反馈。

## 许可证
MIT License
