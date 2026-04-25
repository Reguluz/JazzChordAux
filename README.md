# Jazz Chords Aux Master

一个纯静态 HTML 爵士和弦助手原型。它可以输入基础和声走向或提交 MIDI 文件，给出可手动选择的重配和声方案，并为每个方案提供可查看的理论解释。

## 当前功能

- 文本输入和声走向与时值，例如：`C:4 | Am:4 | Dm:4 | G7:4 | C:4`
- 选择或拖入 `.mid` / `.midi` 文件，自动识别同时发声的音组并归纳为和弦
- 自动估计调性/调式，并可手动指定 Ionian、Dorian、Mixolydian、Aeolian、Harmonic minor 等常用调式
- 输入和输出都会显示对应级数，例如 `Imaj7`、`vi7`、`bVII7`
- MIDI 识别出的和弦与时值可以在“识别结果”里直接手动修改
- 技法库已加入爵士、流行/影视增色、古典功能/声部进行三类来源
- 对每个和弦位置生成多个优化方案
- 采用某个位置的方案后，后续位置的可选方案会重新计算
- 工作台分为两步：第 1 步选择和声重配，第 2 步做转位和编配；可用上一步/下一步来回修改
- 第 1 步采用紧凑列表交互，同屏显示更多位置；每次只展开一个位置的候选方案
- 未展开位置会保留当前采用方案摘要，并标明原版/替换、方法、类型和输出和弦名
- 第 2 步会分析根位低音跨度和相邻跳进，显示“转位前指向”，并提供转位、Drop2、四度排列、Shell/Guide tones 等方案
- 每个方案都有悬浮摘要与点击弹窗解释
- 原始输入和优化后的走向都可以用 Web Audio 播放预览
- 右侧内置技法文档浏览与搜索
- 完整参考来源和快查表见 `docs/harmony-techniques.md`

## 支持的输入格式

每个和弦后面可以用 `:时值` 标注拍数；没有写时值时默认 4 拍。

```text
C:4 | Am:4 | Dm:2 G7:2 | Cmaj7:4
Fmaj7:4 Fm6:4 C/E:2 A7:2 Dm7:2 G7:2
```

目前推荐用空格、竖线或逗号分隔和弦。Slash chord 支持如 `C/E`；`C6/9` 会作为六九和弦处理。

## 本地打开

直接用浏览器打开 `index.html` 即可运行。项目没有构建步骤，也不依赖外部包。

## 规则覆盖

当前规则重点覆盖：

- 三和弦扩展为 maj7、m7、6/9、m9
- 属七扩展为 13、7sus4
- 一转位低音衔接
- 终止四六、辅助四六
- 变格补充终止
- 阻碍终止 / 欺骗解决
- 属九/下属九扩展
- 次属和弦
- 次级 ii-V
- Backcycling / 反向五度链
- 三全音替代
- Altered dominant
- Lydian dominant SubV
- Backdoor dominant
- Backdoor ii-V
- 半音经过减七
- Common-tone diminished
- Secondary leading-tone diminished
- 小下属 iv 借用
- Chromatic dominant approach
- Line cliché / 惯用线
- bIImaj7、bVImaj7-bVII7 等扩展调式借用
- 非功能属七、bVI7 色彩属、chromatic mediants 等流行/影视增色技法
- I-VI7-ii-V turnaround
- 第二步编配：低音线转位、Drop2、四度排列、Shell + Guide tones

右侧技法库也包含高叠和弦、复合和弦等偏 voicing 的条目。Drop2、四度排列、Shell/Guide tones 已进入第二步播放预览；高叠和弦与更细的钢琴声部导出可以继续扩展。
