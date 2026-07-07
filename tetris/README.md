# Tetris — 俄罗斯方块

一个基于 Canvas 2D 的俄罗斯方块 Web 游戏，纯前端实现，零外部依赖。

## 项目结构

```
tetris/
├── index.html        # 入口页面
├── style.css         # 深色主题样式
├── js/
│   ├── constants.js  # 网格尺寸、颜色、计分表、下落速度
│   ├── tetrominoes.js# 7种方块定义与预计算旋转矩阵
│   ├── board.js      # 网格状态、碰撞检测、消行
│   ├── game.js       # 状态机、游戏循环、方块生命周期
│   ├── renderer.js   # Canvas 绘制
│   ├── input.js      # 键盘绑定
│   ├── storage.js    # localStorage 高分读写
│   └── main.js       # 模块组装与启动
└── README.md
```

## 启动方式

方式一：Python 内置服务器

```bash
cd tetris
python3 -m http.server 3000
```

方式二：Node 内置服务器

```bash
cd tetris
node -e "require('http').createServer((q,r)=>{require('fs').readFile('.'+q.url.slice(q.url.length-1=='/'?'index.html':q.url),(e,d)=>{r.end(d||'err')})}).listen(3000)"
```

然后在浏览器打开 `http://localhost:3000`。

## 操作方式

| 按键 | 功能 |
|------|------|
| ← / → | 左右移动 |
| ↑ / X | 顺时针旋转 |
| Z | 逆时针旋转 |
| ↓ | 加速下落 |
| Space | 硬降（直接落底） |
| C | 暂存（Hold）当前方块 |
| P | 暂停 / 继续 |
| Enter | 开始 / 重新开始 |

## 核心功能

- **7 种标准方块** (I/O/T/S/Z/J/L) 带 Wall kick 旋转
- **7-bag 随机** — 保证分布公平，每 7 块必出全种类
- **锁定延迟** — 落地后 500ms 内可继续移动/旋转
- **幽灵落点** — 半透明提示方块最终落位
- **下 3 个预览** — 右侧显示即将到来的方块
- **Hold 暂存** — C 键暂存当前方块，每方块限一次
- **硬降** — Space 直接落底并锁定
- **消行动画** — 满行闪烁后清除
- **关卡递增** — 每消 10 行升 1 级，下落速度逐渐加快
- **最高分** — localStorage 持久化保存

## 计分规则

| 消行数 | 基础分 (× 关卡) |
|--------|----------------|
| 1 | 100 |
| 2 | 300 |
| 3 | 500 |
| 4 (Tetris) | 800 |

- 软降：+1 分 / 行
- 硬降：+2 分 / 行

## 下落速度

| 关卡 | 间隔 (ms) |
|------|-----------|
| 1 | 800 |
| 5 | 467 |
| 10 | 100 |
| 15+ | 33 |

## 可扩展方向

- 音效（Web Audio API）
- 主题切换
- Combo/Back-to-back 奖励
- 触屏支持（swipe/tap）
- 在线排行榜
- 对战模式
