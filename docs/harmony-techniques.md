# 爵士和弦优化技法参考与快查表

本文档是 Jazz Chords Aux Master 的理论参考与规则知识库草案。它的目标不是替代系统学习，而是把常见爵士重配和声技法整理成可以被前端助手识别、解释和手动选择的结构。

## 参考来源

### 核心教材与课程

1. Randy Felts, *Reharmonization Techniques*, Berklee Press  
   https://books.google.com/books/about/Reharmonization_Techniques.html?id=6FzDngEACAAJ

2. Berklee Online, *Reharmonization Techniques*  
   https://online.berklee.edu/courses/reharmonization-techniques

3. Mark Levine, *The Jazz Theory Book*, Sher Music  
   https://www.shermusic.com/1883217040.php

4. Joe Mulholland and Tom Hojnacki, *The Berklee Book of Jazz Harmony*  
   https://online.berklee.edu/store/product?product_id=40669022

5. Robert Rawlins and Nor Eddine Bahha, *Jazzology: The Encyclopedia of Jazz Theory for All Musicians*  
   https://books.google.com/books/about/Jazzology.html?id=tnmTMT6Hfi0C

6. Dariusz Terefenko, *Jazz Theory: From Basic to Advanced Study*  
   https://www.routledge.com/Jazz-Theory-From-Basic-to-Advanced-Study-2nd-Edition/Terefenko/p/book/9781138235083

### 博客、教学站点与补充材料

1. Berklee Take Note, *Chord Substitution and Reharmonization*  
   https://online.berklee.edu/takenote/reharmonization-simple-substitution/

2. Berklee Today, *Reharmonizing with Constant Structure Chords*  
   https://college.berklee.edu/bt/131/reharmonizing.html

3. Hooktheory, *Tritone Substitution*  
   https://www.hooktheory.com/support/musicreference?concept=music-concepts-tritone-substitution

4. Hooktheory, *Borrowed Chord*  
   https://www.hooktheory.com/support/musicreference?concept=music-concepts-borrowed-chord

5. Learn Jazz Standards, *10 Reharmonization Techniques*  
   https://www.learnjazzstandards.com/blog/jazz-reharmonization-techniques/

6. Learn Jazz Standards, *Modal Interchange*  
   https://www.learnjazzstandards.com/blog/modal-interchange/

7. Learn Jazz Standards, *Backdoor Progression*  
   https://www.learnjazzstandards.com/blog/learning-jazz/jazz-theory/how-to-master-the-backdoor-jazz-chord-progression/

8. Anton Schwartz, *Backdoor ii-V Progression*  
   https://antonjazz.com/2012/01/backdoor-ii-v-progression/

9. The Jazz Piano Site, *Coltrane Changes*  
   https://www.thejazzpianosite.com/jazz-piano-lessons/jazz-chord-progressions/coltrane-changes/

10. Barry Harris Companion, *Scales of Chords*  
    https://barrycompanion.com/scales-of-chords/

11. HubGuitar 中文, *三全音替代*  
    https://hubguitar.com/zh/music-theory/tritone-substitute-dominant-chords

### 中文视频来源与投稿标题索引

1. Bilibili 用户空间：爵士-没有派对 投稿页  
   https://space.bilibili.com/1405367071/upload/video

2. 代表性标题索引：没有属功能的属和弦之 3 级属七  
   https://www.bilibili.com/video/BV1LX4y1e7Dc/

3. 代表性标题索引：惯用线  
   https://www.bilibili.com/video/BV1y94y1p7S5/

4. 代表性标题索引：替代属和弦（三全音代理）  
   https://www.bilibili.com/video/BV1bR4y1r79Z/

5. 代表性标题索引：减七和弦的扩展音  
   https://www.bilibili.com/video/BV1y14y1F7aQ/

6. 代表性标题索引：高叠和弦、混合和弦、复合和弦、斜杠和弦  
   https://www.bilibili.com/video/BV174421F7bb/

7. 可见投稿/选集标题中可抽取的技法关键词包括：副属和弦、二级五级、三全音、调式转换和弦、属功能、没有属功能的属和弦、假解决、减七和弦扩展、惯用线、Mixolydian、Aeolian、四度排列、高叠和弦、Drop2、布鲁斯和声、即兴中使用复合和弦等。当前项目把能直接替换和弦的内容纳入第 1 步规则引擎，把转位、Drop2、四度排列、Shell/Guide tones 纳入第 2 步编配；更偏即兴音型的内容先放入“排列与复合”文档组。

8. Bilibili 用户空间：三分钟音乐社 投稿页  
   https://space.bilibili.com/3546681293408724/upload/video

9. 代表性合集：和声·合集，标题中包含功能体系、排列法、连接法、共同音保持、三音跳进、正三和弦六和弦、终止四六、变格补充终止、经过四六、辅助四六、属七转位、副三和弦、阻碍进行/阻碍终止、导六/导七、属九/下属九等。  
   https://www.bilibili.com/video/BV1sx4y1R7Lr/

## 文档分组

- 基础扩展：先把三和弦提升为六和弦、七和弦、九和弦或含张力和弦。
- 功能替代：保持大体功能不变，用同功能或关系大小调换色彩。
- 属功能与终止：次属、次级 ii-V、三全音替代、backdoor 等导向目标和弦的技法。
- 减七与对称：利用减七和弦的等距结构做经过、辅助或属七 b9 替代。
- 调式借用：从平行大小调或其他调式借和弦制造色彩。
- 经过与低音线：通过半音、全音、slash chord、pedal point 改善连接。
- Turnaround：句尾或段落循环的经典回转公式。
- 高级重配：Coltrane changes、Barry Harris 6th-diminished、constant structure 等。
- 流行/影视/色彩增色：不一定严格按爵士功能解释，但能让基础走向获得更丰富的颜色。
- 排列与复合：Drop2、四度排列、高叠和弦、复合和弦等偏 voicing 或编配的技法。
- 古典功能/声部进行：功能体系、连接法、转位、终止式、共同音保持等，用来让重配结果更顺。

## 调式与级数显示

助手会根据当前走向估计调性/调式，并把和弦显示为相对级数。级数以主音大调音阶为参照标出变化音，例如 C Ionian 中 `Bb7` 显示为 `bVII7`，C Aeolian 中 `Abmaj7` 显示为 `bVImaj7`。这比只显示“第几级”更适合爵士重配，因为 modal interchange、backdoor、subV 等技法常常需要看到 `bVII`、`bVI`、`bII` 这类借用或替代来源。

当前支持的调式上下文包括 Ionian、大调、Dorian、Phrygian、Lydian、Mixolydian、Aeolian、小调、Harmonic minor 和 Locrian。MIDI 导入后，如果自动识别的调式不符合实际音乐语境，可以在页面顶部手动指定调性/调式，也可以在“识别结果”里直接修改识别出的和弦与时值。

## 两步工作流与转位编配

工作台分为两步。第 1 步“和声重配”只决定和弦替换、借用、次属、经过和声等 harmonic choice；第 2 步“转位编配”读取第 1 步的最终输出，分析根位低音的整体跨度与相邻跳进。如果根位运动过大，助手会显示“转位前指向”，例如 `C -> G -> F` 的根位低音方向，并建议 `C/E`、`G/B`、`F/A` 等转位来减少跳进。

第 1 步采用紧凑列表：所有位置默认显示摘要，只展开当前点选的位置。未展开位置仍会显示当前采用方案，包括原版/替换状态、方法名、类型分组和输出和弦名；这样可以在同一屏内检查更多小节。

第 2 步不会破坏第 1 步的功能选择：转位只是改变最低音，Drop2、四度排列、Shell/Guide tones 只是改变播放和声部排列。每个编配方案都可以单独采用或取消；回到第 1 步修改和声后，第 2 步会按新的和声走向重新计算，保持过程可逆、可修改。

## 技法快查表

| 分组 | 技法 | 识别条件 | 常见输出 | 解释重点 |
|---|---|---|---|---|
| 基础扩展 | 三和弦加 7/6/add9 | 输入是 C、Am、F 等三和弦 | Cmaj7、C6、Cadd9 | 不改功能，只增加色彩音 |
| 基础扩展 | 可用张力 | 已识别 maj7、m7、7、m7b5 | maj9、m9、13、7alt | 按和弦性质添加 9、11、13 或 altered tension |
| 基础扩展 | sus 属和弦 | V7 解决到 I | G7sus4-G7-Cmaj7 | 延迟 3 音出现，增加解决感 |
| 功能替代 | 同功能替代 | I/iii/vi，ii/IV，V/viiø | Cmaj7->Em7/Am7 | 保持主、下属、属功能 |
| 功能替代 | 关系大小调替代 | 大和弦与 vi，小和弦与 bIII | Cmaj7<->Am7 | 共享多个音，功能接近 |
| 功能替代 | 和弦性质转换 | 旋律允许，根音保留 | Cm7->Cm6/CmMaj7 | 让同根和弦在大小调色彩间移动 |
| 古典功能/声部进行 | 共同音保持 | 两个和弦共享音较多 | C->Am 保留 C/E | 优先保留共同音，让连接更平稳 |
| 古典功能/声部进行 | 一转位低音衔接 | 根音跳进较大但可用三音作低音 | C/E->F | 用六和弦平滑低音线 |
| 古典功能/声部进行 | 终止四六和弦 | V-I 终止前可强化属准备 | C/G-G7-C | I6/4 作为属前悬挂，强化终止 |
| 古典功能/声部进行 | 辅助四六和弦 | 稳定和弦持续时间较长 | C-F/C-C | 上方声部离开再回到原和弦，低音保持 |
| 古典功能/声部进行 | 经过四六和弦 | 低音可级进经过 | C-C/G-F | 用四六和弦作为低音线中的经过点 |
| 古典功能/声部进行 | 阻碍终止 / 欺骗解决 | V 后预期回 I | G7->Am7 | 属功能不直接回 I，转向 vi 或 bVI 制造延迟 |
| 古典功能/声部进行 | 变格补充终止 | I 前或 I 后需要补充收束 | Fmaj7->Cmaj7 | 用 IV-I 或 iv-I 补充正格终止的收束感 |
| 古典功能/声部进行 | 导七和弦 | 目标根音下方半音可导入 | Bdim7->C | 导音七和弦比单个导音更完整地导向目标 |
| 古典功能/声部进行 | 属九/下属九 | 属或下属功能需要扩展 | G9、Fmaj9 | 用九度扩展传统功能和声 |
| 属功能 | 次属和弦 | 目标可被临时 tonicize | A7->Dm7 | A7 是 Dm 的 V7 |
| 属功能 | 次级 ii-V | 目标前有足够时值 | Em7b5-A7->Dm7 | 把单个次属扩展为 ii-V |
| 属功能 | 延伸属链 | 多个目标按五度推进 | E7-A7-D7-G7-C | 每个属七向下五度解决 |
| 属功能 | Backcycling / 反向五度链 | 目标前有较长时值 | E7-A7-D7-G7->C | 从目标倒推一串属七制造推进 |
| 属功能 | 三全音替代 | 原和弦是属七或可解释为 V7 | G7->Db7 | 两个属七共享 3、7 音形成的三全音 |
| 属功能 | SubV 的 ii-V | SubV 前有空间 | Abm7-Db7->Cmaj7 | 先建立替代属，再解决到目标 |
| 属功能 | Altered dominant | 属七强解决到目标 | G7->G7alt | 用 b9/#9/b13 等 altered tension 强化解决 |
| 属功能 | Lydian dominant | SubV 或非功能属七需要明亮张力 | Db7#11->Cmaj7 | #11 保留属七推进，同时减少旋律冲突 |
| 属功能 | Backdoor dominant | 目标是 I 或 maj7 | Bb7->Cmaj7 | bVII7 从平行小调/小下属色彩导向 I |
| 属功能 | Backdoor ii-V | 可借用平行小调 iv-bVII | Fm7-Bb7->Cmaj7 | 小下属 iv 到 bVII7 再回 I |
| 属功能 | 欺骗解决 | V7 后不直接回 I | G7->Am7 或 Abmaj7 | 保留张力，让解决延迟或转向 |
| 减七 | 属七 b9 减七替代 | V7 可加 b9 | G7b9≈Abdim/Bdim/Ddim/Fdim | 去掉根音后的 3、5、b7、b9 构成减七 |
| 减七 | 半音经过减七 | 两根音相差全音 | Cmaj7-C#dim-Dm7 | 用升一半音的减七填充级进 |
| 减七 | 辅助减七 | 稳定和弦需要装饰 | Cmaj7-C#dim-Cmaj7 | 离开再回到原和弦 |
| 减七 | Common-tone diminished | 稳定和弦需要原地装饰 | Cmaj7-C#dim7-Cmaj7 | 保留共同音，短暂制造对称张力后回到原和弦 |
| 减七 | Secondary leading-tone diminished | 目标根音下方半音可导入 | C#dim7->Dm7 | 用目标下方半音的减七作为导入 |
| 减七 | Leading-tone dim | 目标根音下方半音可导入 | C#dim->Dm7 | 减七根音向上半音解决 |
| 调式借用 | 小下属 iv | 大调 IV-I 或 I 前 | Fm6->Cmaj7 | 从平行小调借 iv，产生柔和暗色 |
| 调式借用 | bVI/bVII/bIII | 大调中借平行小调 | Abmaj7、Bb7、Ebmaj7 | 平行小调的稳定色彩和弦 |
| 调式借用 | bII/Phrygian | 目标前半音上方大和弦 | Dbmaj7->Cmaj7 | 半音下行解决，色彩强烈 |
| 调式借用 | Minor ii-V | 小调目标或暗色终止 | Dm7b5-G7alt->Cm | 使用和声小调/旋律小调语汇 |
| 调式借用 | Melodic minor dominant | 属七需要更强张力 | G7alt、Db7#11 | altered 或 Lydian dominant 色彩 |
| 经过与低音线 | Diatonic approach | 目标前可插入调内和弦 | Cmaj7-Dm7-Em7 | 调内级进接近目标 |
| 经过与低音线 | Dominant approach | 目标可被 V7 推动 | A7->Dm7 | 用目标的属七导入 |
| 经过与低音线 | Chromatic approach | 目标前有半拍或一拍空间 | Db7->Cmaj7 | 半音上方或下方滑入目标 |
| 经过与低音线 | Chromatic dominant approach | 目标前可用半音属七 | Db7->Cmaj7 | 把半音滑入写成属七，兼具低音线和张力 |
| 经过与低音线 | Line cliché / 惯用线 | 小和弦持续时间较长 | Cm-CmMaj7-Cm7-Cm6 | 用内声半音线制造情绪推进 |
| 经过与低音线 | Parallel planing | 旋律或根音可平行移动 | Ebmaj7-Dmaj7-Dbmaj7-Cmaj7 | 相同和弦品质平移 |
| 经过与低音线 | Constant structure | 一串同品质和弦 | maj7 或 m11 平行移动 | 以音色和线条为主，弱化功能 |
| 低音线 | Slash chord | 保留上方和声、移动低音 | C/E、F/A、G/B | 用转位或指定低音形成线条 |
| 低音线 | Stepwise bass reharm | 低音可级进 | C-C/B-Am-Am/G-F | 低音线比功能更突出 |
| 低音线 | Pedal point | 一个低音可持续 | C/G-F/G-G7sus | 固定低音上方换和声 |
| Turnaround | I-vi-ii-V | 段落末尾回 I | C-Am7-Dm7-G7 | 经典句尾回转 |
| Turnaround | I-VI7-ii-V | vi 改成属七 | C-A7-Dm7-G7 | VI7 作为 V/ii 更有推进力 |
| Turnaround | iii-VI-ii-V | 经典循环预备 | Em7-A7-Dm7-G7 | 五度循环回到 I |
| Turnaround | Rhythm changes | I-vi-ii-V 强化 | C-A7-Dm7-G7 或替代属版本 | 可叠加次属和三全音替代 |
| 高级重配 | 和声位移 | 重要终止点可提前/延后 | 目标提前，后面填 approach | 改变落点让句子更有推动 |
| 高级重配 | Coltrane changes | ii-V-I 有足够空间 | Dm7-Eb7-Abmaj7-B7-Emaj7-G7-C | 以大三度 key center 重配 |
| 高级重配 | Barry Harris 6th-diminished | maj/min 稳定区域 | C6-Ddim-C6/E-Fdim | 六和弦与减七交替产生流动 |
| 高级重配 | Quartal/modal | 静态和声或 modal 段落 | sus、四度堆叠、m11 | 非功能和声，强调调式色彩 |
| 流行/影视/色彩增色 | 没有属功能的属七 | 想要亮色但不需要强解决 | E7、Ab7、Bb7 | 把属七当作色彩块，而不是一定按五度解决 |
| 流行/影视/色彩增色 | bVI7 色彩属 | 大调 I 前或稳定区 | Ab7->Cmaj7 | 来自平行小调/蓝调语汇，带电影或 gospel 色彩 |
| 流行/影视/色彩增色 | Chromatic mediants | 同性质大三度关系 | Cmaj7-Ebmaj7-Abmaj7 | 弱化功能，强调色彩距离 |
| 排列与复合 | Upper-structure triads / 高叠和弦 | 属七需要明确张力来源 | G7 + Ab/Eb/A triad | 用上方三和弦解释 alt、b9、#11、13 等张力 |
| 排列与复合 | Quartal voicing / 四度排列 | 静态或 modal 段落 | Dm11、G13sus | 以四度堆叠弱化传统三度功能 |
| 排列与复合 | Drop2 | 需要更吉他/钢琴化的四声部排列 | Cmaj7 Drop2 | 改变排列而非换和弦，适合后续 MIDI 导出声部 |
| 排列与复合 | Shell + Guide tones | 和弦太厚或连接不清晰 | 根音 + 3 音 + 7 音 | 突出功能音，减少音域拥挤 |
| 排列与复合 | 低音线转位 | 根位低音跨度或跳进过大 | C/E、G/B、F/A | 保留原和弦指向，同时让低音更平滑 |

## 解释弹窗模板

### 三全音替代

原进行：`Dm7 - G7 - Cmaj7`  
识别：`G7` 是 `Cmaj7` 的 V7，满足“属七和弦可三全音替代”的条件。  
替换：`G7 -> Db7`，根音 `G -> Db` 相距 6 个半音。  
理论：`G7 = G B D F`，其中 3 音 `B` 与 7 音 `F` 构成三全音；`Db7 = Db F Ab Cb`，其中 `F` 与 `Cb(=B)` 仍然是同一组三全音。  
解决：`B -> C`，`F -> E`，低音 `Db -> C` 半音下行，所以替换后仍能合理解决到 `Cmaj7`。

### 次属和弦

原进行：`Cmaj7 - Dm7 - G7 - Cmaj7`  
识别：`Dm7` 可以被临时当作目标和弦。  
替换：在 `Dm7` 前加入或替换为 `A7`。  
理论：`A7` 是 `Dm7` 的 V7，`C#` 是导音，倾向解决到 `D`。  
效果：让原本平稳的级进获得更明确的前进方向。

### Backdoor ii-V

原进行：`Fmaj7 - Cmaj7`  
识别：目标是大调 I，且前方存在下属功能位置。  
替换：`Fmaj7 -> Fm7 - Bb7 -> Cmaj7`。  
理论：`Fm7` 是平行小调的 iv，`Bb7` 是 bVII7，二者构成 backdoor ii-V。  
效果：比正格 `G7 -> C` 更柔和、更带蓝调/灵魂乐色彩。
