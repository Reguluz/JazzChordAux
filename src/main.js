(function () {
  "use strict";

  var NOTE_TO_PC = {
    C: 0,
    "B#": 0,
    "C#": 1,
    Db: 1,
    D: 2,
    "D#": 3,
    Eb: 3,
    E: 4,
    Fb: 4,
    "E#": 5,
    F: 5,
    "F#": 6,
    Gb: 6,
    G: 7,
    "G#": 8,
    Ab: 8,
    A: 9,
    "A#": 10,
    Bb: 10,
    B: 11,
    Cb: 11
  };

  var NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  var NOTE_NAMES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
  var FLAT_KEYS = new Set(["F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"]);
  var MODE_DEFS = {
    ionian: { label: "Ionian / 大调", intervals: [0, 2, 4, 5, 7, 9, 11], tonicQuality: "major", common: true },
    dorian: { label: "Dorian", intervals: [0, 2, 3, 5, 7, 9, 10], tonicQuality: "minor", common: true },
    phrygian: { label: "Phrygian", intervals: [0, 1, 3, 5, 7, 8, 10], tonicQuality: "minor", common: false },
    lydian: { label: "Lydian", intervals: [0, 2, 4, 6, 7, 9, 11], tonicQuality: "major", common: false },
    mixolydian: { label: "Mixolydian", intervals: [0, 2, 4, 5, 7, 9, 10], tonicQuality: "major", common: true },
    aeolian: { label: "Aeolian / 小调", intervals: [0, 2, 3, 5, 7, 8, 10], tonicQuality: "minor", common: true },
    harmonicMinor: { label: "Harmonic minor", intervals: [0, 2, 3, 5, 7, 8, 11], tonicQuality: "minor", common: true },
    locrian: { label: "Locrian", intervals: [0, 1, 3, 5, 6, 8, 10], tonicQuality: "diminished", common: false }
  };
  var MODE_ORDER = ["ionian", "aeolian", "dorian", "mixolydian", "harmonicMinor", "lydian", "phrygian", "locrian"];
  var MAJOR_DEGREE_NAMES = ["I", "bII", "II", "bIII", "III", "IV", "#IV", "V", "bVI", "VI", "bVII", "VII"];

  var state = {
    slots: [],
    lockedChoices: {},
    arrangementChoices: {},
    currentSuggestions: [],
    expandedHarmonyIndex: 0,
    midiNotes: null,
    midiName: "",
    midiSourceActive: false,
    textDirty: false,
    activeWorkflowStep: "harmony",
    activeCategory: "全部",
    audioContext: null,
    scheduledNodes: [],
    highlightTimers: [],
    stopTimer: null
  };

  var techniques = [
    tech("基础扩展", "三和弦加 7/6/add9", "输入是 C、Am、F 等三和弦", "Cmaj7、C6、Cadd9", "不改功能，只增加色彩音。"),
    tech("基础扩展", "可用张力", "已识别 maj7、m7、7、m7b5", "maj9、m9、13、7alt", "按和弦性质添加 9、11、13 或 altered tension。"),
    tech("基础扩展", "sus 属和弦", "V7 解决到 I", "G7sus4-G7-Cmaj7", "延迟 3 音出现，增加解决感。"),
    tech("功能替代", "同功能替代", "I/iii/vi，ii/IV，V/viiø", "Cmaj7->Em7/Am7", "保持主、下属、属功能。"),
    tech("功能替代", "关系大小调替代", "大和弦与 vi，小和弦与 bIII", "Cmaj7<->Am7", "共享多个音，功能接近。"),
    tech("古典功能/声部进行", "共同音保持", "两个和弦共享音较多", "C->Am 保留 C/E", "优先保留共同音，让连接更平稳。"),
    tech("古典功能/声部进行", "一转位低音衔接", "根音跳进较大但可用三音作低音", "C/E->F", "用六和弦平滑低音线。"),
    tech("古典功能/声部进行", "终止四六和弦", "V-I 终止前可强化属准备", "C/G-G7-C", "I6/4 作为属前悬挂，强化终止。"),
    tech("古典功能/声部进行", "辅助四六和弦", "稳定和弦持续时间较长", "C-F/C-C", "上方声部离开再回到原和弦，低音保持。"),
    tech("古典功能/声部进行", "经过四六和弦", "低音可级进经过", "C-C/G-F", "用四六和弦作为低音线中的经过点。"),
    tech("古典功能/声部进行", "阻碍终止 / 欺骗解决", "V 后预期回 I", "G7->Am7", "属功能不直接回 I，转向 vi 或 bVI 制造延迟。"),
    tech("古典功能/声部进行", "变格补充终止", "I 前或 I 后需要补充收束", "Fmaj7->Cmaj7", "用 IV-I 或 iv-I 补充正格终止的收束感。"),
    tech("古典功能/声部进行", "导七和弦", "目标根音下方半音可导入", "Bdim7->C", "导音七和弦比单个导音更完整地导向目标。"),
    tech("古典功能/声部进行", "属九/下属九", "属或下属功能需要扩展", "G9、Fmaj9", "用九度扩展传统功能和声。"),
    tech("属功能与终止", "次属和弦", "目标可被临时 tonicize", "A7->Dm7", "用目标和弦上方纯五度的属七导入。"),
    tech("属功能与终止", "次级 ii-V", "目标前有足够时值", "Em7b5-A7->Dm7", "把单个次属扩展为 ii-V。"),
    tech("属功能与终止", "延伸属链", "多个目标按五度推进", "E7-A7-D7-G7-C", "每个属七向下五度解决。"),
    tech("属功能与终止", "Backcycling / 反向五度链", "目标前有较长时值", "E7-A7-D7-G7->C", "从目标往前倒推一串属七，形成连续推进。"),
    tech("属功能与终止", "三全音替代", "原和弦是属七或可解释为 V7", "G7->Db7", "两个属七共享 3、7 音形成的三全音。"),
    tech("属功能与终止", "SubV 的 ii-V", "SubV 前有空间", "Abm7-Db7->Cmaj7", "先建立替代属，再解决到目标。"),
    tech("属功能与终止", "Altered dominant", "属七强解决到目标", "G7->G7alt", "用 b9/#9/b13 等 altered tension 强化解决。"),
    tech("属功能与终止", "Lydian dominant", "SubV 或非功能属七需要明亮张力", "Db7->Db7#11", "#11 保留属七推进，同时减少和旋律的冲突。"),
    tech("属功能与终止", "Backdoor dominant", "目标是 I 或 maj7", "Bb7->Cmaj7", "bVII7 从平行小调/小下属色彩导向 I。"),
    tech("属功能与终止", "Backdoor ii-V", "可借用平行小调 iv-bVII", "Fm7-Bb7->Cmaj7", "小下属 iv 到 bVII7 再回 I。"),
    tech("减七与对称", "属七 b9 减七替代", "V7 可加 b9", "G7b9≈Abdim/Bdim/Ddim/Fdim", "去掉根音后的 3、5、b7、b9 构成减七。"),
    tech("减七与对称", "半音经过减七", "两根音相差全音", "Cmaj7-C#dim-Dm7", "用升一半音的减七填充级进。"),
    tech("减七与对称", "Common-tone diminished", "稳定和弦需要原地装饰", "Cmaj7-C#dim7-Cmaj7", "保留共同音，短暂制造对称张力后回到原和弦。"),
    tech("减七与对称", "Secondary leading-tone diminished", "目标根音下方半音可导入", "C#dim7->Dm7", "用目标下方半音的减七作为导入。"),
    tech("减七与对称", "Leading-tone dim", "目标根音下方半音可导入", "C#dim->Dm7", "减七根音向上半音解决。"),
    tech("调式借用", "小下属 iv", "大调 IV-I 或 I 前", "Fm6->Cmaj7", "从平行小调借 iv，产生柔和暗色。"),
    tech("调式借用", "bVI/bVII/bIII", "大调中借平行小调", "Abmaj7、Bb7、Ebmaj7", "平行小调的稳定色彩和弦。"),
    tech("调式借用", "Minor ii-V", "小调目标或暗色终止", "Dm7b5-G7alt->Cm", "使用和声小调/旋律小调语汇。"),
    tech("经过与低音线", "Chromatic approach", "目标前有半拍或一拍空间", "Db7->Cmaj7", "半音上方或下方滑入目标。"),
    tech("经过与低音线", "Chromatic dominant approach", "目标前可用半音属七", "Db7->Cmaj7", "把半音滑入写成属七，兼具低音线和张力。"),
    tech("经过与低音线", "Line cliché / 惯用线", "小和弦持续时间较长", "Cm-CmMaj7-Cm7-Cm6", "用内声半音线制造情绪推进。"),
    tech("经过与低音线", "Slash chord", "保留上方和声、移动低音", "C/E、F/A、G/B", "用转位或指定低音形成线条。"),
    tech("经过与低音线", "Pedal point", "一个低音可持续", "C/G-F/G-G7sus", "固定低音上方换和声。"),
    tech("Turnaround", "I-vi-ii-V", "段落末尾回 I", "C-Am7-Dm7-G7", "经典句尾回转。"),
    tech("Turnaround", "I-VI7-ii-V", "vi 改成属七", "C-A7-Dm7-G7", "VI7 作为 V/ii 更有推进力。"),
    tech("高级重配", "Coltrane changes", "ii-V-I 有足够空间", "Dm7-Eb7-Abmaj7-B7-Emaj7-G7-C", "以大三度 key center 重配。"),
    tech("流行/影视/色彩增色", "没有属功能的属七", "想要亮色但不需要强解决", "E7、Ab7、Bb7", "把属七当作色彩块使用，而不是一定按五度解决。"),
    tech("流行/影视/色彩增色", "bVI7 色彩属", "大调 I 前或稳定区", "Ab7->Cmaj7", "来自平行小调/蓝调语汇，带强烈电影感或 gospel 色彩。"),
    tech("流行/影视/色彩增色", "Chromatic mediants", "同性质大三度关系", "Cmaj7-Ebmaj7-Abmaj7", "弱化功能，强调色彩距离。"),
    tech("排列与复合", "Upper-structure triads / 高叠和弦", "属七需要明确张力来源", "G7 + Ab/Eb/A triad", "用上方三和弦解释 alt、b9、#11、13 等张力。"),
    tech("排列与复合", "Quartal voicing / 四度排列", "静态或 modal 段落", "Dm11、G13sus", "以四度堆叠弱化传统三度功能。"),
    tech("排列与复合", "Drop2", "需要更吉他/钢琴化的四声部排列", "Cmaj7 Drop2", "改变排列而非换和弦，适合后续 MIDI 导出声部。"),
    tech("高级重配", "Barry Harris 6th-diminished", "maj/min 稳定区域", "C6-Ddim-C6/E-Fdim", "六和弦与减七交替产生流动。"),
    tech("高级重配", "Quartal/modal", "静态和声或 modal 段落", "sus、四度堆叠、m11", "非功能和声，强调调式色彩。")
  ];

  var els = {
    keySelect: document.getElementById("keySelect"),
    modeSelect: document.getElementById("modeSelect"),
    tempoInput: document.getElementById("tempoInput"),
    playOriginalBtn: document.getElementById("playOriginalBtn"),
    playOptimizedBtn: document.getElementById("playOptimizedBtn"),
    stopBtn: document.getElementById("stopBtn"),
    analyzeBtn: document.getElementById("analyzeBtn"),
    resetChoicesBtn: document.getElementById("resetChoicesBtn"),
    progressionInput: document.getElementById("progressionInput"),
    midiInput: document.getElementById("midiInput"),
    fileDrop: document.querySelector(".file-drop"),
    midiFileName: document.getElementById("midiFileName"),
    applyParsedEditsBtn: document.getElementById("applyParsedEditsBtn"),
    parsedList: document.getElementById("parsedList"),
    analysisMeta: document.getElementById("analysisMeta"),
    statusBadge: document.getElementById("statusBadge"),
    timeline: document.getElementById("timeline"),
    arrangementPanel: document.getElementById("arrangementPanel"),
    harmonyStepBtn: document.getElementById("harmonyStepBtn"),
    arrangementStepBtn: document.getElementById("arrangementStepBtn"),
    workflowPrevBtn: document.getElementById("workflowPrevBtn"),
    workflowNextBtn: document.getElementById("workflowNextBtn"),
    docSearch: document.getElementById("docSearch"),
    categoryTabs: document.getElementById("categoryTabs"),
    techniqueDocs: document.getElementById("techniqueDocs"),
    explainDialog: document.getElementById("explainDialog"),
    dialogContent: document.getElementById("dialogContent"),
    closeDialogBtn: document.getElementById("closeDialogBtn")
  };

  init();

  function init() {
    bindEvents();
    renderTechniqueLibrary();
    analyzeFromText(false);
  }

  function bindEvents() {
    els.analyzeBtn.addEventListener("click", function () {
      state.midiSourceActive = false;
      state.midiNotes = null;
      analyzeFromText(false);
    });

    els.progressionInput.addEventListener("input", function () {
      state.midiSourceActive = false;
      state.textDirty = true;
    });

    els.keySelect.addEventListener("change", function () {
      recomputeAndRender();
    });

    els.modeSelect.addEventListener("change", function () {
      recomputeAndRender();
    });

    els.applyParsedEditsBtn.addEventListener("click", applyParsedEdits);

    els.harmonyStepBtn.addEventListener("click", function () {
      setWorkflowStep("harmony");
    });

    els.arrangementStepBtn.addEventListener("click", function () {
      setWorkflowStep("arrangement");
    });

    els.workflowPrevBtn.addEventListener("click", function () {
      setWorkflowStep("harmony");
    });

    els.workflowNextBtn.addEventListener("click", function () {
      setWorkflowStep("arrangement");
    });

    els.parsedList.addEventListener("change", function (event) {
      if (event.target.closest("[data-slot-edit]")) {
        applyParsedEdits();
      }
    });

    els.resetChoicesBtn.addEventListener("click", function () {
      state.lockedChoices = {};
      state.arrangementChoices = {};
      state.expandedHarmonyIndex = 0;
      recomputeAndRender();
      setStatus("已清空选择");
    });

    els.timeline.addEventListener("click", function (event) {
      var slotPlayButton = event.target.closest("[data-play-slot-index]");
      if (slotPlayButton) {
        playHarmonySlotPreview(Number(slotPlayButton.dataset.playSlotIndex));
        return;
      }

      var optionPlayButton = event.target.closest("[data-play-option-index]");
      if (optionPlayButton) {
        playHarmonyOptionPreview(Number(optionPlayButton.dataset.playOptionIndex), optionPlayButton.dataset.optionId);
        return;
      }

      var explainButton = event.target.closest("[data-explain-index]");
      if (explainButton) {
        var explainIndex = Number(explainButton.dataset.explainIndex);
        var explainOptionId = explainButton.dataset.optionId;
        var explainOption = findOption(explainIndex, explainOptionId);
        if (explainOption) {
          openExplanation(explainOption);
        }
        return;
      }

      var adoptButton = event.target.closest("[data-adopt-index]");
      if (adoptButton) {
        var index = Number(adoptButton.dataset.adoptIndex);
        var optionId = adoptButton.dataset.optionId;
        var locked = state.lockedChoices[index];
        if (locked && locked.id === optionId) {
          delete state.lockedChoices[index];
          state.arrangementChoices = {};
          setStatus("已取消该位置方案");
        } else {
          var option = findOption(index, optionId);
          if (option) {
            state.lockedChoices[index] = cloneOption(option);
            state.arrangementChoices = {};
            removeLaterInvalidChoices(index);
            setStatus("已采用方案，后续位置已重新计算");
          }
        }
        recomputeAndRender();
        state.expandedHarmonyIndex = index;
        renderTimeline();
        renderArrangementPanel();
        renderWorkflowStep();
        return;
      }

      var expandButton = event.target.closest("[data-expand-index]");
      if (expandButton) {
        state.expandedHarmonyIndex = Number(expandButton.dataset.expandIndex);
        renderTimeline();
      }
    });

    els.arrangementPanel.addEventListener("click", function (event) {
      var arrangeCurrentPlayButton = event.target.closest("[data-arrange-current-play-index]");
      if (arrangeCurrentPlayButton) {
        playArrangementCurrentPreview(Number(arrangeCurrentPlayButton.dataset.arrangeCurrentPlayIndex));
        return;
      }

      var arrangePlayButton = event.target.closest("[data-arrange-play-index]");
      if (arrangePlayButton) {
        playArrangementOptionPreview(Number(arrangePlayButton.dataset.arrangePlayIndex), arrangePlayButton.dataset.optionId);
        return;
      }

      var explainButton = event.target.closest("[data-arrange-explain-index]");
      if (explainButton) {
        var explainIndex = Number(explainButton.dataset.arrangeExplainIndex);
        var explainOption = findArrangementOption(explainIndex, explainButton.dataset.optionId);
        if (explainOption) {
          openArrangementExplanation(explainOption);
        }
        return;
      }

      var adoptButton = event.target.closest("[data-arrange-adopt-index]");
      if (!adoptButton) {
        return;
      }
      var index = Number(adoptButton.dataset.arrangeAdoptIndex);
      var optionId = adoptButton.dataset.optionId;
      var locked = state.arrangementChoices[index];
      if (locked && locked.id === optionId) {
        delete state.arrangementChoices[index];
        setStatus("已取消该编配方案");
      } else {
        var option = findArrangementOption(index, optionId);
        if (option) {
          state.arrangementChoices[index] = cloneOption(option);
          setStatus("已采用编配方案，可返回上一步继续修改和声");
        }
      }
      renderArrangementPanel();
    });

    els.midiInput.addEventListener("change", handleMidiUpload);
    els.fileDrop.addEventListener("dragover", function (event) {
      event.preventDefault();
      els.fileDrop.classList.add("drag-over");
    });
    els.fileDrop.addEventListener("dragleave", function () {
      els.fileDrop.classList.remove("drag-over");
    });
    els.fileDrop.addEventListener("drop", function (event) {
      event.preventDefault();
      els.fileDrop.classList.remove("drag-over");
      var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) {
        handleMidiFile(file);
      }
    });
    els.playOriginalBtn.addEventListener("click", playOriginal);
    els.playOptimizedBtn.addEventListener("click", playOptimized);
    els.stopBtn.addEventListener("click", function () {
      stopPlayback();
      setStatus("停止播放");
    });

    els.docSearch.addEventListener("input", renderTechniqueLibrary);

    els.categoryTabs.addEventListener("click", function (event) {
      var button = event.target.closest("[data-category]");
      if (!button) {
        return;
      }
      state.activeCategory = button.dataset.category;
      renderTechniqueLibrary();
    });

    els.closeDialogBtn.addEventListener("click", function () {
      els.explainDialog.close();
    });

    els.explainDialog.addEventListener("click", function (event) {
      if (event.target === els.explainDialog) {
        els.explainDialog.close();
      }
    });
  }

  function analyzeFromText(preserveChoices) {
    try {
      var slots = parseProgression(els.progressionInput.value);
      state.slots = slots;
      state.textDirty = false;
      if (!preserveChoices) {
        state.lockedChoices = {};
        state.arrangementChoices = {};
        state.expandedHarmonyIndex = 0;
      }
      recomputeAndRender();
      setStatus(slots.length ? "已分析 " + slots.length + " 个位置，调式估计 " + describeContext(getHarmonicContext()) : "没有识别到和弦");
    } catch (error) {
      state.slots = [];
      state.currentSuggestions = [];
      state.arrangementChoices = {};
      renderParsedList();
      renderTimeline();
      renderArrangementPanel();
      setStatus(error.message || "分析失败");
    }
  }

  function recomputeAndRender() {
    state.currentSuggestions = state.slots.map(function (slot, index) {
      return generateSuggestions(slot, index);
    });
    renderParsedList();
    renderTimeline();
    renderArrangementPanel();
    renderWorkflowStep();
  }

  function setWorkflowStep(step) {
    state.activeWorkflowStep = step === "arrangement" ? "arrangement" : "harmony";
    renderArrangementPanel();
    renderWorkflowStep();
    setStatus(state.activeWorkflowStep === "harmony" ? "第 1 步：选择和声重配方案" : "第 2 步：调整转位与编配");
  }

  function renderWorkflowStep() {
    var isArrangement = state.activeWorkflowStep === "arrangement";
    els.harmonyStepBtn.classList.toggle("active", !isArrangement);
    els.arrangementStepBtn.classList.toggle("active", isArrangement);
    els.timeline.classList.toggle("active", !isArrangement);
    els.arrangementPanel.classList.toggle("active", isArrangement);
    els.workflowPrevBtn.disabled = !isArrangement;
    els.workflowNextBtn.disabled = isArrangement;
  }

  function parseProgression(text) {
    var prepared = text
      .replace(/[，、；;]/g, " ")
      .replace(/\|/g, " ")
      .replace(/\n/g, " ")
      .trim();

    if (!prepared) {
      return [];
    }

    var tokens = prepared.split(/\s+/).filter(Boolean);
    var slots = [];
    var startBeat = 0;

    tokens.forEach(function (token, index) {
      var parsed = parseToken(token);
      var chord = parseChord(parsed.symbol);
      if (!chord) {
        return;
      }
      var slot = {
        id: "slot-" + index,
        symbol: chord.symbol,
        rawSymbol: parsed.symbol,
        chord: chord,
        duration: parsed.duration,
        startBeat: startBeat
      };
      startBeat += parsed.duration;
      slots.push(slot);
    });

    return slots;
  }

  function applyParsedEdits() {
    if (!state.slots.length) {
      return;
    }

    var rows = Array.from(els.parsedList.querySelectorAll("[data-slot-row]"));
    var nextSlots = [];
    var startBeat = 0;

    try {
      rows.forEach(function (row, index) {
        var chordInput = row.querySelector('[data-slot-edit="symbol"]');
        var durationInput = row.querySelector('[data-slot-edit="duration"]');
        var chord = parseChord(chordInput.value);
        var duration = Math.max(0.25, Number(durationInput.value) || state.slots[index].duration || 4);
        nextSlots.push({
          id: "manual-" + index,
          symbol: chord.symbol,
          rawSymbol: chordInput.value,
          chord: chord,
          duration: Math.round(duration * 1000) / 1000,
          startBeat: startBeat
        });
        startBeat += duration;
      });

      state.slots = nextSlots;
      state.lockedChoices = {};
      state.arrangementChoices = {};
      state.expandedHarmonyIndex = 0;
      state.midiSourceActive = false;
      state.textDirty = false;
      updateProgressionTextFromSlots();
      recomputeAndRender();
      setStatus("已应用手动修改");
    } catch (error) {
      setStatus(error.message || "修改内容无法识别");
    }
  }

  function updateProgressionTextFromSlots() {
    els.progressionInput.value = state.slots.map(function (slot) {
      return slot.symbol + ":" + formatBeats(slot.duration);
    }).join(" | ");
  }

  function parseToken(token) {
    var cleaned = token.trim();
    var duration = 4;
    var match = cleaned.match(/^(.+?)(?:[:*@x])(\d+(?:\.\d+)?)$/i);
    if (!match) {
      match = cleaned.match(/^(.+?)\((\d+(?:\.\d+)?)\)$/);
    }
    if (match) {
      cleaned = match[1];
      duration = Math.max(0.25, Number(match[2]) || 4);
    }
    return {
      symbol: cleaned,
      duration: duration
    };
  }

  function parseChord(symbol) {
    if (!symbol) {
      return null;
    }

    var normalized = String(symbol)
      .trim()
      .replace(/♭/g, "b")
      .replace(/♯/g, "#")
      .replace(/Δ/g, "maj")
      .replace(/−/g, "-");

    if (!normalized || /^N\.?C\.?$/i.test(normalized)) {
      return null;
    }

    var main = normalized;
    var bass = "";
    var slashIndex = normalized.lastIndexOf("/");
    if (slashIndex > 0 && /^[A-Ga-g]/.test(normalized.slice(slashIndex + 1))) {
      main = normalized.slice(0, slashIndex);
      bass = normalized.slice(slashIndex + 1);
    }
    var match = main.match(/^([A-Ga-g])([#b]?)(.*)$/);
    if (!match) {
      throw new Error("无法识别和弦：" + symbol);
    }

    var root = match[1].toUpperCase() + match[2];
    var rootPc = NOTE_TO_PC[root];
    if (typeof rootPc !== "number") {
      throw new Error("无法识别根音：" + symbol);
    }

    var suffix = match[3] || "";
    var quality = detectQuality(suffix);
    var canonicalSuffix = normalizeSuffix(suffix, quality);
    var bassName = bass ? "/" + bass : "";

    return {
      symbol: root + canonicalSuffix + bassName,
      root: root,
      rootPc: rootPc,
      suffix: canonicalSuffix,
      rawSuffix: suffix,
      quality: quality,
      bass: bass,
      intervals: intervalsForQuality(quality, canonicalSuffix)
    };
  }

  function detectQuality(suffix) {
    var raw = suffix || "";
    var s = raw.toLowerCase();

    if (/m7b5|ø/.test(s)) {
      return "half-diminished";
    }
    if (/dim7|o7|°7/.test(s)) {
      return "diminished7";
    }
    if (/dim|°|^o/.test(s)) {
      return "diminished";
    }
    if (/aug|\+/.test(s)) {
      return "augmented";
    }
    if (/sus/.test(s)) {
      return "suspended";
    }
    if (/^mmaj|^m\(maj|^minmaj|^mΔ/i.test(raw) || /^mmaj/.test(s)) {
      return "minorMajor7";
    }
    if (/^(maj|ma|M)/.test(raw) || /^maj/.test(s)) {
      if (/9/.test(s)) {
        return "major9";
      }
      if (/6/.test(s)) {
        return "major6";
      }
      return "major7";
    }
    if (/^(-|m|min)/.test(s)) {
      if (/6/.test(s)) {
        return "minor6";
      }
      if (/9/.test(s)) {
        return "minor9";
      }
      if (/7/.test(s)) {
        return "minor7";
      }
      return "minor";
    }
    if (/alt|7|9|13|b9|#9|#11|b13/.test(s)) {
      if (/13/.test(s)) {
        return "dominant13";
      }
      if (/9/.test(s)) {
        return "dominant9";
      }
      return "dominant7";
    }
    if (/6/.test(s)) {
      return "major6";
    }
    if (/add9/.test(s)) {
      return "add9";
    }
    return "major";
  }

  function normalizeSuffix(suffix, quality) {
    var raw = suffix || "";
    if (/alt/i.test(raw)) {
      return "7alt";
    }
    if (/sus/i.test(raw)) {
      return raw.includes("7") ? "7sus4" : "sus4";
    }
    if (/add9/i.test(raw)) {
      return "add9";
    }
    switch (quality) {
      case "major":
        return "";
      case "major6":
        return raw.includes("/9") || /69|6\/9/.test(raw) ? "6/9" : "6";
      case "add9":
        return "add9";
      case "major7":
        return "maj7";
      case "major9":
        return "maj9";
      case "minor":
        return "m";
      case "minorMajor7":
        return "mMaj7";
      case "minor6":
        return "m6";
      case "minor7":
        return "m7";
      case "minor9":
        return "m9";
      case "dominant7":
        if (raw.includes("#11")) {
          return "7#11";
        }
        if (raw.includes("b9")) {
          return "7b9";
        }
        if (raw.includes("#9")) {
          return "7#9";
        }
        return "7";
      case "dominant9":
        return raw.includes("b9") ? "7b9" : raw.includes("#9") ? "7#9" : "9";
      case "dominant13":
        return "13";
      case "suspended":
        return raw.includes("7") ? "7sus4" : "sus4";
      case "half-diminished":
        return "m7b5";
      case "diminished":
        return "dim";
      case "diminished7":
        return "dim7";
      case "augmented":
        return "aug";
      default:
        return raw;
    }
  }

  function intervalsForQuality(quality, suffix) {
    var s = suffix || "";
    if (/7alt/.test(s)) {
      return [0, 4, 10, 13, 15, 20];
    }
    if (/7b9/.test(s)) {
      return [0, 4, 7, 10, 13];
    }
    if (/7#9/.test(s)) {
      return [0, 4, 7, 10, 15];
    }
    if (/7#11/.test(s)) {
      return [0, 4, 7, 10, 18];
    }
    switch (quality) {
      case "major":
        return [0, 4, 7];
      case "major6":
        return /6\/9/.test(s) ? [0, 4, 7, 9, 14] : [0, 4, 7, 9];
      case "add9":
        return [0, 4, 7, 14];
      case "major7":
        return [0, 4, 7, 11];
      case "major9":
        return [0, 4, 7, 11, 14];
      case "minor":
        return [0, 3, 7];
      case "minorMajor7":
        return [0, 3, 7, 11];
      case "minor6":
        return [0, 3, 7, 9];
      case "minor7":
        return [0, 3, 7, 10];
      case "minor9":
        return [0, 3, 7, 10, 14];
      case "dominant7":
        return [0, 4, 7, 10];
      case "dominant9":
        return [0, 4, 7, 10, 14];
      case "dominant13":
        return [0, 4, 7, 10, 14, 21];
      case "suspended":
        return /7/.test(s) ? [0, 5, 7, 10] : [0, 5, 7];
      case "half-diminished":
        return [0, 3, 6, 10];
      case "diminished":
        return [0, 3, 6];
      case "diminished7":
        return [0, 3, 6, 9];
      case "augmented":
        return [0, 4, 8];
      default:
        return [0, 4, 7];
    }
  }

  function generateSuggestions(slot, index) {
    if (!slot || !slot.chord) {
      return [];
    }

    var suggestions = [];
    var chord = slot.chord;
    var next = getEffectiveChord(index + 1);
    var keyRoot = getSelectedKeyRoot();
    var preferFlats = shouldPreferFlats(keyRoot, chord.root);

    addBasicExtensions(suggestions, slot, preferFlats);

    if (next) {
      var next2 = getEffectiveChord(index + 2);
      addFirstInversionSmoothing(suggestions, slot, next, preferFlats);
      addSecondaryDominant(suggestions, slot, next, preferFlats);
      addSecondaryTwoFive(suggestions, slot, next, preferFlats);
      addTritoneSubstitution(suggestions, slot, next, preferFlats);
      addAlteredDominant(suggestions, slot, next, preferFlats);
      addLydianDominant(suggestions, slot, next, preferFlats);
      addDominantNinth(suggestions, slot, next, preferFlats);
      addBackdoorOptions(suggestions, slot, next, preferFlats);
      addPassingDiminished(suggestions, slot, next, preferFlats);
      addLeadingToneDiminished(suggestions, slot, next, preferFlats);
      addMinorPlagal(suggestions, slot, next, preferFlats);
      addPlagalCadence(suggestions, slot, next, preferFlats);
      addDeceptiveResolution(suggestions, slot, next, preferFlats);
      addCadentialSixFour(suggestions, slot, next, next2, preferFlats);
      addChromaticDominantApproach(suggestions, slot, next, preferFlats);
      addBorrowedColorApproach(suggestions, slot, next, preferFlats);
      addColorDominantApproach(suggestions, slot, next, preferFlats);
      addBackcycling(suggestions, slot, next, preferFlats);
    }

    addCommonToneDiminished(suggestions, slot, preferFlats);
    addLineCliche(suggestions, slot, preferFlats);
    addAuxiliarySixFour(suggestions, slot, preferFlats);

    if (isTonicLike(chord, keyRoot) && slot.duration >= 4) {
      addTurnaround(suggestions, slot, keyRoot, preferFlats);
    }

    return uniqueOptions(suggestions).slice(0, 10);
  }

  function addBasicExtensions(suggestions, slot, preferFlats) {
    var chord = slot.chord;
    var root = pcToName(chord.rootPc, preferFlats);
    var duration = slot.duration;

    if (chord.quality === "major") {
      suggestions.push(option(
        "basic-maj7",
        "三和弦加 maj7",
        "基础扩展",
        [event(root + "maj7", duration)],
        "把 " + slot.symbol + " 扩展为 " + root + "maj7。",
        [
          "识别：`" + slot.symbol + "` 是大三和弦，当前没有 7 音。",
          "替换：保留根音、3 音、5 音，加入大七度，得到 `" + root + "maj7`。",
          "效果：功能仍然是原来的主/下属色彩，但质感更接近爵士标准曲。"
        ].join("\n")
      ));
      suggestions.push(option(
        "basic-69",
        "六九和弦色彩",
        "基础扩展",
        [event(root + "6/9", duration)],
        "把稳定大三和弦换成 " + root + "6/9。",
        [
          "识别：`" + slot.symbol + "` 是稳定的大三和弦。",
          "替换：加入 6 音和 9 音，得到 `" + root + "6/9`。",
          "效果：比 maj7 更柔和，常用于 tonic major 的开放式色彩。"
        ].join("\n")
      ));
    }

    if (chord.quality === "minor") {
      suggestions.push(option(
        "basic-m7",
        "小三和弦加 m7",
        "基础扩展",
        [event(root + "m7", duration)],
        "把 " + slot.symbol + " 扩展为 " + root + "m7。",
        [
          "识别：`" + slot.symbol + "` 是小三和弦，当前没有 7 音。",
          "替换：保留根音、小三度、五度，加入小七度，得到 `" + root + "m7`。",
          "效果：仍保持小和弦功能，但更适合 ii-V、modal 和声或流行爵士语境。"
        ].join("\n")
      ));
      suggestions.push(option(
        "basic-m9",
        "小九和弦色彩",
        "基础扩展",
        [event(root + "m9", duration)],
        "把小三和弦换成 " + root + "m9。",
        [
          "识别：`" + slot.symbol + "` 是小三和弦。",
          "替换：加入小七度和 9 音，得到 `" + root + "m9`。",
          "效果：让小和弦更宽、更现代，适合慢速或中速段落。"
        ].join("\n")
      ));
    }

    if (isDominant(chord)) {
      suggestions.push(option(
        "basic-dom13",
        "属十三色彩",
        "基础扩展",
        [event(root + "13", duration)],
        "把属七扩展为 " + root + "13。",
        [
          "识别：`" + slot.symbol + "` 已有属功能。",
          "替换：保留 3 音和 b7 的核心属功能，加入 9/13 等上方张力。",
          "效果：推进力不变，但音响更饱满。"
        ].join("\n")
      ));
      suggestions.push(option(
        "basic-sus",
        "sus 属和弦延迟",
        "基础扩展",
        [event(root + "7sus4", duration / 2), event(root + "7", duration / 2)],
        "先用 " + root + "7sus4 延迟，再回到 " + root + "7。",
        [
          "识别：`" + slot.symbol + "` 是属七或属功能和弦。",
          "替换：先把 3 音换成 4 音形成 `" + root + "7sus4`，再回到 `" + root + "7`。",
          "效果：解决前多一次悬挂感，适合 V-I 之前。"
        ].join("\n")
      ));
    }

    if (chord.quality === "major7") {
      suggestions.push(option(
        "basic-maj9",
        "大九和弦色彩",
        "基础扩展",
        [event(root + "maj9", duration)],
        "把 " + slot.symbol + " 扩展为 " + root + "maj9。",
        [
          "识别：`" + slot.symbol + "` 已是 maj7。",
          "替换：继续加入 9 音，得到 `" + root + "maj9`。",
          "效果：保持稳定，同时让上方结构更有空气感。"
        ].join("\n")
      ));
    }

    if (chord.quality === "minor7") {
      suggestions.push(option(
        "basic-m11",
        "小十一和弦色彩",
        "基础扩展",
        [event(root + "m9", duration)],
        "把 " + slot.symbol + " 扩展为 " + root + "m9。",
        [
          "识别：`" + slot.symbol + "` 是 m7。",
          "替换：加入 9 音形成 `" + root + "m9`。",
          "效果：不改变小和弦功能，让 ii 级或 vi 级更圆润。"
        ].join("\n")
      ));
    }
  }

  function addFirstInversionSmoothing(suggestions, slot, next, preferFlats) {
    if (!next.chord || (!isMajorLike(slot.chord) && !isMinorLike(slot.chord))) {
      return;
    }

    var distance = mod(next.chord.rootPc - slot.chord.rootPc, 12);
    if (distance !== 5 && distance !== 7) {
      return;
    }

    var root = pcToName(slot.chord.rootPc, preferFlats);
    var suffix = inversionSuffixForChord(slot.chord);
    var bassPc = mod(slot.chord.rootPc + (isMinorLike(slot.chord) ? 3 : 4), 12);
    var bass = pcToName(bassPc, preferFlats);
    var slash = root + suffix + "/" + bass;

    suggestions.push(option(
      "first-inversion-smoothing-" + slot.chord.rootPc + "-" + next.chord.rootPc,
      "一转位低音衔接",
      "古典功能/声部进行",
      [event(slash, slot.duration)],
      slash + " 平滑连接到 " + next.chord.symbol + "。",
      [
        "识别：`" + slot.symbol + "` 到 `" + next.chord.symbol + "` 的根音跳进较大，可以用一转位平滑低音。",
        "替换：保留 `" + slot.symbol + "` 的上方和声，把低音改成三音 `" + bass + "`，得到 `" + slash + "`。",
        "理论：六和弦常用于连接法，让低音从根音跳进变成更顺的级进或小跳。",
        "效果：和声功能基本不变，但声部运动更自然。"
      ].join("\n")
    ));
  }

  function addDominantNinth(suggestions, slot, next, preferFlats) {
    if (!next.chord || !isDominant(slot.chord)) {
      return;
    }

    var root = pcToName(slot.chord.rootPc, preferFlats);
    var targetLine = resolvesByFifth(slot.chord, next.chord) ? "强解决到 " + next.chord.symbol : "作为属九色彩连接";
    suggestions.push(option(
      "dominant-ninth-" + slot.chord.rootPc,
      "属九扩展",
      "古典功能/声部进行",
      [event(root + "9", slot.duration)],
      root + "9 " + targetLine + "。",
      [
        "识别：`" + slot.symbol + "` 是属七类和弦。",
        "替换：在属七基础上加入 9 音，得到 `" + root + "9`。",
        "理论：属九是传统功能和声与爵士和声都常用的属功能扩展，核心仍是 3 音和 b7。",
        "效果：比普通属七更饱满，但比 altered dominant 更温和。"
      ].join("\n")
    ));
  }

  function addSecondaryDominant(suggestions, slot, next, preferFlats) {
    if (!next.chord || isDominant(next.chord)) {
      return;
    }

    var target = next.chord;
    var dominantPc = mod(target.rootPc + 7, 12);
    var dominant = pcToName(dominantPc, preferFlats) + "7";
    if (slot.chord.rootPc === dominantPc && isDominant(slot.chord)) {
      return;
    }

    var guide = pcToName(mod(dominantPc + 4, 12), preferFlats);
    suggestions.push(option(
      "secondary-dominant-" + target.rootPc,
      "次属导入 " + target.symbol,
      "属功能与终止",
      [event(dominant, slot.duration)],
      dominant + " 作为 " + target.symbol + " 的 V7。",
      [
        "识别：后一个目标和弦是 `" + target.symbol + "`，可以被临时 tonicize。",
        "替换：目标 `" + target.root + "` 上方纯五度是 `" + pcToName(dominantPc, preferFlats) + "`，所以使用 `" + dominant + "`。",
        "理论：`" + guide + "` 是导向目标根音 `" + target.root + "` 的倾向音之一，属七会把听感推向后一个和弦。",
        "效果：原位置从静态和弦变成有明确方向的导入和弦。"
      ].join("\n")
    ));
  }

  function addSecondaryTwoFive(suggestions, slot, next, preferFlats) {
    if (slot.duration < 1.5 || !next.chord || isDominant(next.chord)) {
      return;
    }

    var target = next.chord;
    var vPc = mod(target.rootPc + 7, 12);
    var iiPc = mod(vPc + 7, 12);
    var minorTarget = isMinorLike(target);
    var ii = pcToName(iiPc, preferFlats) + (minorTarget ? "m7b5" : "m7");
    var v = pcToName(vPc, preferFlats) + "7";
    var durations = splitDuration(slot.duration, 2);

    suggestions.push(option(
      "secondary-two-five-" + target.rootPc,
      "次级 ii-V",
      "属功能与终止",
      [event(ii, durations[0]), event(v, durations[1])],
      ii + " - " + v + " 导入 " + target.symbol + "。",
      [
        "识别：后一个目标是 `" + target.symbol + "`，当前时值足够拆成两个导入和弦。",
        "替换：先构造目标的 V7：`" + v + "`，再在它前面放对应的 ii：`" + ii + "`。",
        "理论：ii-V 是爵士里最常见的属功能预备；如果目标偏小调，ii 使用半减七 `" + ii + "` 更自然。",
        "效果：比单个次属更平滑，听感上会提前建立目标和弦的局部调性。"
      ].join("\n")
    ));
  }

  function addTritoneSubstitution(suggestions, slot, next, preferFlats) {
    var chord = slot.chord;
    if (!isDominant(chord)) {
      return;
    }

    var subPc = mod(chord.rootPc + 6, 12);
    var subRoot = pcToName(subPc, preferFlats || true);
    var sub = subRoot + "7";
    var originalThird = pcToName(mod(chord.rootPc + 4, 12), preferFlats);
    var originalSeventh = pcToName(mod(chord.rootPc + 10, 12), preferFlats);
    var subThird = pcToName(mod(subPc + 4, 12), true);
    var subSeventh = pcToName(mod(subPc + 10, 12), true);
    var targetLine = next && next.chord ? "，后面接 `" + next.chord.symbol + "`" : "";

    suggestions.push(option(
      "tritone-sub",
      "三全音替代",
      "属功能与终止",
      [event(sub, slot.duration)],
      slot.symbol + " -> " + sub + targetLine + "。",
      [
        "识别：`" + slot.symbol + "` 是属七类和弦，满足三全音替代的基本条件。",
        "替换：根音 `" + chord.root + "` 上方三全音是 `" + subRoot + "`，所以 `" + slot.symbol + "` 可替换为 `" + sub + "`。",
        "理论：原和弦的 3 音和 7 音是 `" + originalThird + "` 与 `" + originalSeventh + "`；替代和弦的 3 音和 7 音是 `" + subThird + "` 与 `" + subSeventh + "`。这两组音在听感上保留了同一个属功能张力。",
        next && next.chord ? "解决：替代属通常以半音低音线导向目标，`" + subRoot + "` 可以靠近并解决到 `" + next.chord.root + "`。" : "效果：保留属功能，但让低音运动变成更强烈的半音色彩。"
      ].filter(Boolean).join("\n")
    ));
  }

  function addAlteredDominant(suggestions, slot, next, preferFlats) {
    var chord = slot.chord;
    if (!next.chord || !isDominant(chord) || !resolvesByFifth(chord, next.chord)) {
      return;
    }

    var root = pcToName(chord.rootPc, preferFlats);
    suggestions.push(option(
      "altered-dominant-" + chord.rootPc,
      "Altered dominant",
      "属功能与终止",
      [event(root + "7alt", slot.duration)],
      root + "7alt 强化解决到 " + next.chord.symbol + "。",
      [
        "识别：`" + slot.symbol + "` 是属七，且后一个 `" + next.chord.symbol + "` 位于它下方纯五度，满足强解决条件。",
        "替换：把普通属七改成 `" + root + "7alt`。",
        "理论：altered dominant 来自旋律小调语汇，会突出 b9、#9、b13 等导向音。",
        "解决：这些张力通常以半音解决到 `" + next.chord.symbol + "` 的和弦音，因此终止感更强。"
      ].join("\n")
    ));
  }

  function addLydianDominant(suggestions, slot, next, preferFlats) {
    if (!next.chord || !isDominant(slot.chord)) {
      return;
    }

    var subPc = mod(slot.chord.rootPc + 6, 12);
    var subRoot = pcToName(subPc, true);
    var sub = subRoot + "7#11";
    suggestions.push(option(
      "lydian-dominant-subv-" + subPc,
      "Lydian dominant SubV",
      "属功能与终止",
      [event(sub, slot.duration)],
      slot.symbol + " 的替代属改成 " + sub + "。",
      [
        "识别：`" + slot.symbol + "` 是属七类和弦，可先做三全音替代。",
        "替换：三全音根音是 `" + subRoot + "`，再使用 Lydian dominant 色彩，得到 `" + sub + "`。",
        "理论：#11 是替代属上常见的亮色张力，能保留属七的 3、b7 张力，又比普通 7 更现代。",
        next.chord ? "解决：`" + sub + "` 继续导向 `" + next.chord.symbol + "`，低音有半音靠近的倾向。" : "效果：用明亮的替代属张力替代普通属七。"
      ].join("\n")
    ));
  }

  function addBackdoorOptions(suggestions, slot, next, preferFlats) {
    if (!next.chord || !isMajorLike(next.chord)) {
      return;
    }

    var target = next.chord;
    var bVII = pcToName(mod(target.rootPc - 2, 12), true);
    var iv = pcToName(mod(target.rootPc + 5, 12), true);

    suggestions.push(option(
      "backdoor-dominant-" + target.rootPc,
      "Backdoor dominant",
      "属功能与终止",
      [event(bVII + "7", slot.duration)],
      bVII + "7 从后门解决到 " + target.symbol + "。",
      [
        "识别：后一个目标 `" + target.symbol + "` 是大调稳定和弦，可使用 backdoor dominant。",
        "替换：目标根音 `" + target.root + "` 的 bVII 是 `" + bVII + "`，因此使用 `" + bVII + "7`。",
        "理论：bVII7 常来自平行小调的小下属系统，比正格 V7 更柔和。",
        "解决：`" + bVII + "7` 到 `" + target.symbol + "` 会形成带蓝调感的回家效果。"
      ].join("\n")
    ));

    if (slot.duration >= 1.5) {
      var durations = splitDuration(slot.duration, 2);
      suggestions.push(option(
        "backdoor-two-five-" + target.rootPc,
        "Backdoor ii-V",
        "属功能与终止",
        [event(iv + "m7", durations[0]), event(bVII + "7", durations[1])],
        iv + "m7 - " + bVII + "7 回到 " + target.symbol + "。",
        [
          "识别：后一个目标 `" + target.symbol + "` 是大调 I 类和弦。",
          "替换：从平行小调借小下属 `" + iv + "m7`，再接 bVII7 `" + bVII + "7`。",
          "理论：`" + iv + "m7 - " + bVII + "7` 构成 backdoor ii-V，不通过传统 V7，而是从小下属色彩回到 I。",
          "效果：比 `" + pcToName(mod(target.rootPc + 7, 12), preferFlats) + "7 -> " + target.symbol + "` 更温暖，也更有 soul/jazz ballad 味道。"
        ].join("\n")
      ));
    }
  }

  function addPassingDiminished(suggestions, slot, next, preferFlats) {
    if (!next.chord || slot.duration < 1.5) {
      return;
    }

    var distance = mod(next.chord.rootPc - slot.chord.rootPc, 12);
    if (distance !== 2 && distance !== 10) {
      return;
    }

    var dimPc = distance === 2 ? mod(slot.chord.rootPc + 1, 12) : mod(slot.chord.rootPc - 1, 12);
    var dim = pcToName(dimPc, preferFlats) + "dim7";
    var durations = splitDuration(slot.duration, 2);

    suggestions.push(option(
      "passing-dim-" + dimPc,
      "半音经过减七",
      "减七与对称",
      [event(slot.symbol, durations[0]), event(dim, durations[1])],
      "在 " + slot.symbol + " 与 " + next.chord.symbol + " 之间插入 " + dim + "。",
      [
        "识别：`" + slot.symbol + "` 与后一个 `" + next.chord.symbol + "` 的根音相差全音。",
        "替换：在中间插入半音位置的减七 `" + dim + "`。",
        "理论：减七和弦由小三度循环构成，适合当作对称的经过张力。",
        "解决：`" + dim + "` 的音会分别向 `" + next.chord.symbol + "` 的和弦音半音或全音解决。"
      ].join("\n")
    ));
  }

  function addLeadingToneDiminished(suggestions, slot, next, preferFlats) {
    if (!next.chord) {
      return;
    }

    var dimPc = mod(next.chord.rootPc - 1, 12);
    var dim = pcToName(dimPc, preferFlats) + "dim7";
    suggestions.push(option(
      "leading-tone-dim-" + next.chord.rootPc,
      "Secondary leading-tone dim",
      "减七与对称",
      [event(dim, slot.duration)],
      dim + " 半音导入 " + next.chord.symbol + "。",
      [
        "识别：后一个目标是 `" + next.chord.symbol + "`，可以用它根音下方半音的减七导入。",
        "替换：目标根音 `" + next.chord.root + "` 下方半音是 `" + pcToName(dimPc, preferFlats) + "`，所以使用 `" + dim + "`。",
        "理论：leading-tone diminished 的根音向上半音解决到目标根音，其他声部也容易半音靠近目标和弦音。",
        "效果：比直接进入目标更有古典/爵士混合的经过张力。"
      ].join("\n")
    ));
  }

  function addCommonToneDiminished(suggestions, slot, preferFlats) {
    if (slot.duration < 2.5 || (!isMajorLike(slot.chord) && !isMinorLike(slot.chord))) {
      return;
    }

    var dimPc = mod(slot.chord.rootPc + 1, 12);
    var dim = pcToName(dimPc, preferFlats) + "dim7";
    var durations = splitDuration(slot.duration, 3);
    suggestions.push(option(
      "common-tone-dim-" + slot.chord.rootPc,
      "Common-tone diminished",
      "减七与对称",
      [event(slot.symbol, durations[0]), event(dim, durations[1]), event(slot.symbol, durations[2])],
      slot.symbol + " - " + dim + " - " + slot.symbol + " 原地装饰。",
      [
        "识别：`" + slot.symbol + "` 是稳定和弦，且时值足够做原地装饰。",
        "替换：离开到相邻半音减七 `" + dim + "`，再回到 `" + slot.symbol + "`。",
        "理论：common-tone diminished 通常保留一个共同音，同时让其他声部半音移动形成张力。",
        "效果：功能不变，但静态和弦内部出现流动。"
      ].join("\n")
    ));
  }

  function addMinorPlagal(suggestions, slot, next, preferFlats) {
    if (!next.chord || !isMajorLike(next.chord)) {
      return;
    }

    var expectedIV = mod(next.chord.rootPc + 5, 12);
    if (slot.chord.rootPc !== expectedIV || !isMajorLike(slot.chord)) {
      return;
    }

    var ivMinor = pcToName(expectedIV, preferFlats) + "m6";
    suggestions.push(option(
      "minor-plagal-" + next.chord.rootPc,
      "小下属 iv 借用",
      "调式借用",
      [event(ivMinor, slot.duration)],
      slot.symbol + " -> " + ivMinor + " 再回到 " + next.chord.symbol + "。",
      [
        "识别：`" + slot.symbol + "` 是 `" + next.chord.symbol + "` 前面的 IV 类和弦。",
        "替换：把 IV 从大调色彩改成平行小调借来的 iv：`" + ivMinor + "`。",
        "理论：小下属的 b6 音会向目标 I 的 5 音半音解决，是非常经典的 jazz/pop 终止色彩。",
        "效果：比普通 IV-I 更柔和、更有 bittersweet 的回家感。"
      ].join("\n")
    ));
  }

  function addPlagalCadence(suggestions, slot, next, preferFlats) {
    if (!next.chord || !isMajorLike(next.chord)) {
      return;
    }

    var ivPc = mod(next.chord.rootPc + 5, 12);
    var iv = pcToName(ivPc, preferFlats) + "maj7";
    var iv9 = pcToName(ivPc, preferFlats) + "maj9";
    suggestions.push(option(
      "plagal-cadence-" + next.chord.rootPc,
      "变格补充终止",
      "古典功能/声部进行",
      [event(iv9, slot.duration)],
      iv9 + " 变格解决到 " + next.chord.symbol + "。",
      [
        "识别：后一个目标 `" + next.chord.symbol + "` 是稳定大和弦，可用 IV-I 变格终止补充收束。",
        "替换：目标的 IV 是 `" + pcToName(ivPc, preferFlats) + "`，扩展为 `" + iv9 + "`。",
        "理论：变格终止不靠导音强解决，而靠下属到主的柔和回归。",
        "效果：比 V-I 更平静，也适合作为正格终止后的补充色彩。"
      ].join("\n")
    ));

    if (slot.chord.rootPc === ivPc && isMajorLike(slot.chord)) {
      suggestions.push(option(
        "subdominant-ninth-" + next.chord.rootPc,
        "下属九扩展",
        "古典功能/声部进行",
        [event(iv9, slot.duration)],
        iv + " 扩展为 " + iv9 + "。",
        [
          "识别：`" + slot.symbol + "` 是 `" + next.chord.symbol + "` 前的 IV 类下属和弦。",
          "替换：加入 9 音，得到 `" + iv9 + "`。",
          "理论：下属九保留 IV-I 的温和收束，同时增加上方色彩。",
          "效果：适合 ballad、流行爵士和影视化结尾。"
        ].join("\n")
      ));
    }
  }

  function addDeceptiveResolution(suggestions, slot, next, preferFlats) {
    if (!next.chord || !isDominant(slot.chord) || !resolvesByFifth(slot.chord, next.chord) || slot.duration < 1.5) {
      return;
    }

    var target = next.chord;
    var vi = pcToName(mod(target.rootPc + 9, 12), preferFlats) + "m7";
    var bVI = pcToName(mod(target.rootPc + 8, 12), true) + "maj7";
    var durations = splitDuration(slot.duration, 2);
    suggestions.push(option(
      "deceptive-resolution-vi-" + target.rootPc,
      "阻碍终止到 vi",
      "古典功能/声部进行",
      [event(slot.symbol, durations[0]), event(vi, durations[1])],
      slot.symbol + " 不直接回 " + target.symbol + "，先到 " + vi + "。",
      [
        "识别：`" + slot.symbol + "` 是 `" + target.symbol + "` 的属七，听者会预期 V-I。",
        "替换：让属功能先转向 vi：`" + vi + "`。",
        "理论：阻碍终止保留属和弦的期待，但避开直接主和弦，使乐句延续。",
        "效果：比直接回 I 更有情绪转折，也方便后续重新推进。"
      ].join("\n")
    ));

    suggestions.push(option(
      "deceptive-resolution-flat-six-" + target.rootPc,
      "阻碍终止到 bVI",
      "古典功能/声部进行",
      [event(slot.symbol, durations[0]), event(bVI, durations[1])],
      slot.symbol + " 转向 " + bVI + " 再延迟回家。",
      [
        "识别：`" + slot.symbol + "` 原本可解决到 `" + target.symbol + "`。",
        "替换：使用平行小调色彩 `" + bVI + "` 作为阻碍目标。",
        "理论：bVI 是常见的借用和弦，和 V-I 预期形成反差。",
        "效果：更戏剧化，适合影视、流行或需要延迟终止的段落。"
      ].join("\n")
    ));
  }

  function addCadentialSixFour(suggestions, slot, next, next2, preferFlats) {
    if (!next || !next.chord || !next2 || !next2.chord || !isDominant(next.chord) || !resolvesByFifth(next.chord, next2.chord)) {
      return;
    }

    var tonic = next2.chord;
    var root = pcToName(tonic.rootPc, preferFlats);
    var bass = pcToName(next.chord.rootPc, preferFlats);
    var cad64 = root + "/" + bass;
    suggestions.push(option(
      "cadential-six-four-" + tonic.rootPc,
      "终止四六准备",
      "古典功能/声部进行",
      [event(cad64, slot.duration)],
      cad64 + " 准备 " + next.chord.symbol + " - " + tonic.symbol + "。",
      [
        "识别：后面是 `" + next.chord.symbol + " -> " + tonic.symbol + "` 的属到主终止。",
        "替换：在属和弦前放主和弦的四六形态 `" + cad64 + "`，低音保持在属音 `" + bass + "`。",
        "理论：终止四六虽然写成 I6/4，但功能上更像属前悬挂，随后解决到 V。",
        "效果：比直接进入 V-I 更庄重，也让终止位置更清晰。"
      ].join("\n")
    ));
  }

  function addAuxiliarySixFour(suggestions, slot, preferFlats) {
    if (slot.duration < 3 || !isMajorLike(slot.chord)) {
      return;
    }

    var root = pcToName(slot.chord.rootPc, preferFlats);
    var iv = pcToName(mod(slot.chord.rootPc + 5, 12), preferFlats);
    var durations = splitDuration(slot.duration, 3);
    suggestions.push(option(
      "auxiliary-six-four-" + slot.chord.rootPc,
      "辅助四六装饰",
      "古典功能/声部进行",
      [event(root, durations[0]), event(iv + "/" + root, durations[1]), event(root, durations[2])],
      root + " - " + iv + "/" + root + " - " + root + "。",
      [
        "识别：`" + slot.symbol + "` 是稳定大和弦，且时值足够原地装饰。",
        "替换：保持低音 `" + root + "`，上方和声短暂移动到 IV，形成 `" + iv + "/" + root + "`。",
        "理论：辅助四六是离开原和弦再回来的声部装饰，重点是低音保持与上方声部运动。",
        "效果：不改变大功能，但让静态位置更有古典式呼吸。"
      ].join("\n")
    ));
  }

  function inversionSuffixForChord(chord) {
    if (isDominant(chord)) {
      return chord.suffix || "7";
    }
    if (chord.quality === "major7" || chord.quality === "major9") {
      return chord.suffix;
    }
    if (chord.quality === "major6") {
      return chord.suffix;
    }
    if (chord.quality === "minor7" || chord.quality === "minor9" || chord.quality === "minor6" || chord.quality === "minorMajor7") {
      return chord.suffix;
    }
    if (chord.quality === "minor") {
      return "m";
    }
    return "";
  }

  function addChromaticDominantApproach(suggestions, slot, next, preferFlats) {
    if (!next.chord) {
      return;
    }

    var abovePc = mod(next.chord.rootPc + 1, 12);
    var belowPc = mod(next.chord.rootPc - 1, 12);
    var above = pcToName(abovePc, true) + "7";
    var below = pcToName(belowPc, preferFlats) + "7";

    suggestions.push(option(
      "chromatic-dom-above-" + next.chord.rootPc,
      "上方半音属七靠近",
      "经过与低音线",
      [event(above, slot.duration)],
      above + " 半音下行到 " + next.chord.symbol + "。",
      [
        "识别：后一个目标 `" + next.chord.symbol + "` 可以被半音属七靠近。",
        "替换：目标根音上方半音是 `" + pcToName(abovePc, true) + "`，使用 `" + above + "`。",
        "理论：这个和弦不一定是传统 V7，而是 chromatic dominant approach；它主要靠低音半音下行和属七音色制造张力。",
        "效果：适合流行、影视、neo-soul 或偏 outside 的爵士连接。"
      ].join("\n")
    ));

    if (slot.duration >= 2) {
      var durations = splitDuration(slot.duration, 2);
      suggestions.push(option(
        "chromatic-dom-squeeze-" + next.chord.rootPc,
        "双向半音属七包围",
        "经过与低音线",
        [event(below, durations[0]), event(above, durations[1])],
        below + " - " + above + " 包围 " + next.chord.symbol + "。",
        [
          "识别：目标 `" + next.chord.symbol + "` 前有足够时值做 chromatic enclosure。",
          "替换：先用下方半音属七 `" + below + "`，再用上方半音属七 `" + above + "`。",
          "理论：两个非功能属七从低音两侧包围目标根音，重点是线条和色彩，不是传统五度解决。",
          "效果：紧张、现代，适合短暂增色后落回目标。"
        ].join("\n")
      ));
    }
  }

  function addBorrowedColorApproach(suggestions, slot, next, preferFlats) {
    if (!next.chord || !isMajorLike(next.chord)) {
      return;
    }

    var target = next.chord;
    var bII = pcToName(mod(target.rootPc + 1, 12), true) + "maj7";
    var bIII = pcToName(mod(target.rootPc + 3, 12), true) + "maj7";
    var bVI = pcToName(mod(target.rootPc + 8, 12), true) + "maj7";
    var bVII = pcToName(mod(target.rootPc + 10, 12), true) + "7";

    suggestions.push(option(
      "borrowed-flat-two-" + target.rootPc,
      "bIImaj7 借用",
      "调式借用",
      [event(bII, slot.duration)],
      bII + " 半音下行到 " + target.symbol + "。",
      [
        "识别：后一个目标 `" + target.symbol + "` 是大调稳定和弦。",
        "替换：使用目标上方半音的 `" + bII + "`。",
        "理论：bIImaj7 可理解为 Phrygian/Neapolitan 色彩，不按传统属功能解决，而是靠根音半音下行。",
        "效果：比普通 V-I 更电影化，适合柔和但明确的回家。"
      ].join("\n")
    ));

    if (slot.duration >= 2) {
      var durations = splitDuration(slot.duration, 2);
      suggestions.push(option(
        "borrowed-flat-six-seven-" + target.rootPc,
        "bVImaj7-bVII7 借用链",
        "调式借用",
        [event(bVI, durations[0]), event(bVII, durations[1])],
        bVI + " - " + bVII + " 回到 " + target.symbol + "。",
        [
          "识别：目标 `" + target.symbol + "` 是大调 I 类和弦，可以借平行小调的 bVI 与 bVII。",
          "替换：使用 `" + bVI + " - " + bVII + "`。",
          "理论：bVImaj7 和 bVII7 都是常见 modal interchange 色彩，既能保留流行感，也能加深爵士/影视质感。",
          "效果：比单个 backdoor 更宽，适合段落结尾或大拍长位置。"
        ].join("\n")
      ));
      suggestions.push(option(
        "chromatic-mediants-" + target.rootPc,
        "Chromatic mediants",
        "流行/影视/色彩增色",
        [event(bIII, durations[0]), event(bVI, durations[1])],
        bIII + " - " + bVI + " 色彩连接到 " + target.symbol + "。",
        [
          "识别：目标 `" + target.symbol + "` 是稳定大和弦，前方可用同性质大三度关系增色。",
          "替换：使用 `" + bIII + " - " + bVI + "` 作为 chromatic mediants。",
          "理论：这些和弦和目标同为大七类色彩，但根音不完全来自同一调式，听感更像电影配乐或现代流行。",
          "效果：弱化功能逻辑，强化色彩跳转。"
        ].join("\n")
      ));
    }
  }

  function addColorDominantApproach(suggestions, slot, next, preferFlats) {
    if (!next.chord || !isMajorLike(next.chord)) {
      return;
    }

    var target = next.chord;
    var bVI7 = pcToName(mod(target.rootPc + 8, 12), true) + "7";
    var III7 = pcToName(mod(target.rootPc + 4, 12), preferFlats) + "7";

    suggestions.push(option(
      "flat-six-color-dom-" + target.rootPc,
      "bVI7 色彩属",
      "流行/影视/色彩增色",
      [event(bVI7, slot.duration)],
      bVI7 + " 色彩性回到 " + target.symbol + "。",
      [
        "识别：后一个目标 `" + target.symbol + "` 是稳定大和弦，可用 bVI7 做色彩性靠近。",
        "替换：目标根音的 bVI 是 `" + pcToName(mod(target.rootPc + 8, 12), true) + "`，使用 `" + bVI7 + "`。",
        "理论：这里的属七不按传统下五度解决，而是作为蓝调、gospel 或影视化的色彩属七。",
        "效果：比 bVImaj7 更有咬合感，但没有正格 V7 那么直白。"
      ].join("\n")
    ));

    suggestions.push(option(
      "third-color-dom-" + target.rootPc,
      "III7 非功能属七",
      "流行/影视/色彩增色",
      [event(III7, slot.duration)],
      III7 + " 作为非功能属七增色。",
      [
        "识别：目标 `" + target.symbol + "` 是稳定和弦，当前可尝试不按五度解决的属七色彩。",
        "替换：使用目标的 III7：`" + III7 + "`。",
        "理论：这个属七不一定要解释成 V/vi；也可以当成明亮、带蓝调张力的色彩块。",
        "效果：适合流行、R&B、影视和声中短暂提亮。"
      ].join("\n")
    ));
  }

  function addLineCliche(suggestions, slot, preferFlats) {
    if (slot.duration < 4 || !isMinorLike(slot.chord)) {
      return;
    }

    var root = pcToName(slot.chord.rootPc, preferFlats);
    var durations = splitDuration(slot.duration, 4);
    suggestions.push(option(
      "minor-line-cliche-" + slot.chord.rootPc,
      "小调 Line cliché",
      "经过与低音线",
      [
        event(root + "m", durations[0]),
        event(root + "mMaj7", durations[1]),
        event(root + "m7", durations[2]),
        event(root + "m6", durations[3])
      ],
      root + "m - " + root + "mMaj7 - " + root + "m7 - " + root + "m6。",
      [
        "识别：`" + slot.symbol + "` 是小和弦，且时值足够展开内声线。",
        "替换：保持根音 `" + root + "`，让上方音从大七度下行到小七度再到六度。",
        "理论：line cliché 的重点不是换功能，而是在同一小和弦内部制造半音惯用线。",
        "效果：非常适合 ballad、影视、流行爵士和小调段落。"
      ].join("\n")
    ));
  }

  function addBackcycling(suggestions, slot, next, preferFlats) {
    if (!next.chord || slot.duration < 4) {
      return;
    }

    var target = next.chord;
    var roots = [
      mod(target.rootPc + 4, 12),
      mod(target.rootPc + 9, 12),
      mod(target.rootPc + 2, 12),
      mod(target.rootPc + 7, 12)
    ];
    var durations = splitDuration(slot.duration, 4);
    var output = roots.map(function (pc, index) {
      return event(pcToName(pc, preferFlats) + "7", durations[index]);
    });

    suggestions.push(option(
      "backcycling-" + target.rootPc,
      "Backcycling 反向五度链",
      "属功能与终止",
      output,
      displaySequenceText(output) + " 导向 " + target.symbol + "。",
      [
        "识别：后一个目标 `" + target.symbol + "` 前有较长时值，可以用连续属七制造推进。",
        "替换：从目标根音 `" + target.root + "` 往前倒推五度链，得到 `" + displaySequenceText(output) + "`。",
        "理论：每个属七都倾向向下五度解决到下一个属七，最后落到目标。",
        "效果：比单个次属更强烈，适合 turnaround、段落结尾或需要明显推进的地方。"
      ].join("\n")
    ));
  }

  function addTurnaround(suggestions, slot, keyRoot, preferFlats) {
    var tonicPc = typeof keyRoot === "number" ? keyRoot : slot.chord.rootPc;
    var root = pcToName(tonicPc, preferFlats);
    var vi = pcToName(mod(tonicPc + 9, 12), preferFlats) + "7";
    var ii = pcToName(mod(tonicPc + 2, 12), preferFlats) + "m7";
    var v = pcToName(mod(tonicPc + 7, 12), preferFlats) + "7";
    var durations = splitDuration(slot.duration, 4);

    suggestions.push(option(
      "turnaround-1625",
      "I-VI7-ii-V 回转",
      "Turnaround",
      [
        event(root + "maj7", durations[0]),
        event(vi, durations[1]),
        event(ii, durations[2]),
        event(v, durations[3])
      ],
      root + "maj7 - " + vi + " - " + ii + " - " + v,
      [
        "识别：`" + slot.symbol + "` 位于 tonic 类稳定位置，且时值足够拆成回转。",
        "替换：使用 `" + root + "maj7 - " + vi + " - " + ii + " - " + v + "`。",
        "理论：VI7 是 ii 的次属，后半段 ii-V 会自然把乐句带回 tonic。",
        "效果：适合段落末尾或重复前，让静态 I 和弦产生继续前进的动力。"
      ].join("\n")
    ));
  }

  function uniqueOptions(options) {
    var seen = new Set();
    return options.filter(function (item) {
      var key = item.title + "|" + displaySequenceText(item.output);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  function getEffectiveChord(index) {
    if (index < 0 || index >= state.slots.length) {
      return null;
    }
    var locked = state.lockedChoices[index];
    if (locked && locked.output && locked.output[0]) {
      return {
        chord: parseChord(locked.output[0].symbol),
        duration: locked.output[0].duration
      };
    }
    return state.slots[index];
  }

  function computeOptimizedEvents() {
    var events = [];
    state.slots.forEach(function (slot, index) {
      var locked = state.lockedChoices[index];
      var output = locked ? locked.output : [event(slot.symbol, slot.duration)];
      output.forEach(function (item) {
        events.push({
          symbol: item.symbol,
          duration: item.duration,
          originIndex: index,
          sourceSymbol: slot.symbol
        });
      });
    });
    events.forEach(function (item, index) {
      item.arrangeIndex = index;
    });
    return events;
  }

  function computeArrangedEvents() {
    return computeOptimizedEvents().map(function (item, index) {
      var choice = state.arrangementChoices[index];
      if (!choice) {
        return item;
      }
      return Object.assign({}, item, {
        symbol: choice.outputSymbol || item.symbol,
        voicingMode: choice.voicingMode || "closed",
        arrangeTitle: choice.title
      });
    });
  }

  function removeLaterInvalidChoices(index) {
    Object.keys(state.lockedChoices).forEach(function (key) {
      if (Number(key) > index) {
        delete state.lockedChoices[key];
      }
    });
  }

  function renderParsedList() {
    els.parsedList.innerHTML = "";
    if (!state.slots.length) {
      els.analysisMeta.textContent = "未识别到和弦";
      return;
    }

    var totalBeats = state.slots.reduce(function (sum, slot) {
      return sum + slot.duration;
    }, 0);
    var context = getHarmonicContext();
    els.analysisMeta.textContent = state.slots.length + " 个位置 / " + formatBeats(totalBeats) + " 拍 · " + describeContext(context);

    state.slots.forEach(function (slot, index) {
      var li = document.createElement("li");
      li.dataset.slotRow = String(index);
      var degree = degreeForChord(slot.chord, context);
      li.innerHTML = [
        '<span class="parsed-number">位置 ' + (index + 1) + '</span>',
        '<div class="parsed-editor">',
        '<label class="parsed-field"><span>和弦</span><input data-slot-edit="symbol" aria-label="位置 ' + (index + 1) + ' 和弦" value="' + escapeHtml(slot.symbol) + '"></label>',
        '<label class="parsed-field"><span>时值</span><input data-slot-edit="duration" aria-label="位置 ' + (index + 1) + ' 时值" type="number" min="0.25" step="0.25" value="' + escapeHtml(formatBeats(slot.duration)) + '"></label>',
        '</div>',
        '<span class="degree-pill ' + (degree.inMode ? "" : "outside") + '" title="' + escapeHtml(degree.hint) + '">' + escapeHtml(degree.roman) + '</span>'
      ].join("");
      els.parsedList.appendChild(li);
    });
  }

  function renderTimeline() {
    els.timeline.innerHTML = "";
    if (!state.slots.length) {
      els.timeline.innerHTML = '<div class="empty-state">输入和弦或提交 MIDI 后，这里会显示每个位置的优化方案。</div>';
      return;
    }

    if (state.expandedHarmonyIndex < 0 || state.expandedHarmonyIndex >= state.slots.length) {
      state.expandedHarmonyIndex = 0;
    }

    var context = getHarmonicContext();
    var selectedSlot = state.slots[state.expandedHarmonyIndex];
    var selectedLocked = state.lockedChoices[state.expandedHarmonyIndex];
    var selectedSuggestions = state.currentSuggestions[state.expandedHarmonyIndex] || [];
    var selectedDegree = degreeForChord(selectedSlot.chord, context);
    var selectedOutput = selectedLocked ? selectedLocked.output : [event(selectedSlot.symbol, selectedSlot.duration)];
    var progressionHtml = state.slots.map(function (slot, index) {
      var locked = state.lockedChoices[index];
      var isExpanded = index === state.expandedHarmonyIndex;
      var isReplaced = Boolean(locked);
      var slotDegree = degreeForChord(slot.chord, context);
      var activeOutput = locked ? locked.output : [event(slot.symbol, slot.duration)];
      var activeType = locked ? "已替换" : "原版";
      var activeMethod = locked ? locked.title : "保持原和弦";
      var activeCategory = locked ? locked.category : "原和声";
      var activeChordNames = activeOutput.map(function (item) {
        return item.symbol;
      }).join(" - ");

      return [
        '<article class="progression-item ' + (isExpanded ? "active " : "") + (isReplaced ? "replaced" : "") + '" data-expand-index="' + index + '" data-slot-index="' + index + '" aria-expanded="' + (isExpanded ? "true" : "false") + '">',
        '<button class="mini-play-btn block-play-btn" type="button" data-play-slot-index="' + index + '" title="预览当前位置">▶</button>',
        '<span class="progression-index">#' + (index + 1) + '</span>',
        '<span class="progression-line"><span class="tiny-label">原</span><strong>' + escapeHtml(slot.symbol) + '</strong></span>',
        '<span class="degree-pill ' + (slotDegree.inMode ? "" : "outside") + '" title="' + escapeHtml(slotDegree.hint) + '">' + escapeHtml(slotDegree.roman) + '</span>',
        '<span class="progression-line current"><span class="tiny-label">当前</span><strong>' + displaySequence(activeOutput, context) + '</strong></span>',
        '<span class="progression-method"><span class="state-chip ' + (isReplaced ? "replaced-chip" : "original-chip") + '">' + activeType + '</span><span>' + escapeHtml(activeMethod) + '</span></span>',
        '<span class="progression-type">' + escapeHtml(activeCategory) + '</span>',
        '<span class="progression-chords">' + escapeHtml(activeChordNames) + '</span>',
        '</article>'
      ].join("");
    }).join("");

    var selectedLine = selectedLocked
      ? '<span class="state-chip replaced-chip">已替换</span><strong>' + displaySequence(selectedLocked.output, context) + '</strong><button class="ghost compact-btn" type="button" data-adopt-index="' + state.expandedHarmonyIndex + '" data-option-id="' + escapeHtml(selectedLocked.id) + '">取消</button>'
      : '<span class="state-chip original-chip">原版</span><strong>' + displaySequence(selectedOutput, context) + '</strong>';

    var choicesHtml = selectedSuggestions.length
      ? selectedSuggestions.map(function (choice) {
        var isLocked = selectedLocked && selectedLocked.id === choice.id;
        return [
          '<div class="choice-card ' + (isLocked ? "locked" : "") + '">',
          '<div class="choice-actions">',
          '<button type="button" data-adopt-index="' + state.expandedHarmonyIndex + '" data-option-id="' + escapeHtml(choice.id) + '">' + (isLocked ? "已采用" : "采用") + '</button>',
          '<button class="mini-play-btn" type="button" data-play-option-index="' + state.expandedHarmonyIndex + '" data-option-id="' + escapeHtml(choice.id) + '" title="预览该方案">▶</button>',
          '<button class="info-btn" type="button" data-explain-index="' + state.expandedHarmonyIndex + '" data-option-id="' + escapeHtml(choice.id) + '">i<span class="tooltip">' + escapeHtml(choice.summary) + '</span></button>',
          '</div>',
          '<div>',
          '<div class="choice-title"><span>' + escapeHtml(choice.title) + '</span><span class="tag">' + escapeHtml(choice.category) + '</span></div>',
          '<div class="choice-output">' + displaySequence(choice.output, context) + '</div>',
          '</div>',
          '</div>'
        ].join("");
      }).join("")
      : '<div class="empty-state">这个位置暂时没有高置信度方案。</div>';

    els.timeline.innerHTML = [
      '<section class="progression-board" aria-label="和弦走向">',
      '<div class="progression-board-head">',
      '<h3>和弦走向</h3>',
      '<span>每行最多 8 个位置，点击位置切换下方选项</span>',
      '</div>',
      '<div class="progression-grid">',
      progressionHtml,
      '</div>',
      '</section>',
      '<section class="options-board" aria-label="当前位置候选方案">',
      '<div class="options-board-head">',
      '<div>',
      '<h3>位置 ' + (state.expandedHarmonyIndex + 1) + ' 的候选方案</h3>',
      '<span>' + escapeHtml(selectedSlot.symbol) + ' · <span class="degree-pill ' + (selectedDegree.inMode ? "" : "outside") + '">' + escapeHtml(selectedDegree.roman) + '</span></span>',
      '</div>',
      '<div class="selected-line compact-selected">' + selectedLine + '</div>',
      '</div>',
      '<div class="choice-list options-list">' + choicesHtml + '</div>',
      '</section>'
    ].join("");
  }

  function renderArrangementPanel() {
    if (!els.arrangementPanel) {
      return;
    }

    var events = computeOptimizedEvents();
    els.arrangementPanel.innerHTML = "";
    if (!events.length) {
      els.arrangementPanel.innerHTML = '<div class="empty-state">第 1 步生成和声后，这里会显示转位和编配建议。</div>';
      return;
    }

    var rangeInfo = analyzeBassRange(events);
    var context = getHarmonicContext();
    var summary = document.createElement("div");
    summary.className = "arrangement-summary";
    summary.innerHTML = [
      '<strong>第 2 步会保持第 1 步的和声功能，只调整低音、转位或排列。</strong>',
      '<span>根位低音跨度：' + rangeInfo.span + ' 半音；最大相邻跳进：' + rangeInfo.maxLeap + ' 半音。' + (rangeInfo.needsSmoothing ? ' 已建议优先检查橙色卡片。' : ' 当前低音线相对平稳。') + '</span>',
      '<span>采用的编配方案可以随时取消；回到第 1 步修改和声后，本步会按新走向重新计算。</span>'
    ].join("");
    els.arrangementPanel.appendChild(summary);

    events.forEach(function (item, index) {
      var chord = parseChord(item.symbol);
      var degree = degreeForChord(chord, context);
      var locked = state.arrangementChoices[index];
      var options = generateArrangementOptions(events, index);
      var motion = bassMotionInfo(events, index, locked);
      var card = document.createElement("article");
      card.className = "arrange-card" + (motion.warning ? " warning" : "");
      card.dataset.arrangeIndex = String(index);

      var selectedLine = locked
        ? '<button class="mini-play-btn" type="button" data-arrange-current-play-index="' + index + '" title="预览当前编配">▶</button><strong>' + escapeHtml(locked.outputSymbol || item.symbol) + '</strong><span class="voicing-badge">' + escapeHtml(locked.title) + '</span><button class="ghost" type="button" data-arrange-adopt-index="' + index + '" data-option-id="' + escapeHtml(locked.id) + '">取消</button>'
        : '<button class="mini-play-btn" type="button" data-arrange-current-play-index="' + index + '" title="预览当前编配">▶</button><span>当前使用根位/默认排列</span>';

      var choicesHtml = options.length
        ? options.map(function (choice) {
          var isLocked = locked && locked.id === choice.id;
          return [
            '<div class="choice-card ' + (isLocked ? "locked" : "") + '">',
            '<div class="choice-actions">',
            '<button type="button" data-arrange-adopt-index="' + index + '" data-option-id="' + escapeHtml(choice.id) + '">' + (isLocked ? "已采用" : "采用") + '</button>',
            '<button class="mini-play-btn" type="button" data-arrange-play-index="' + index + '" data-option-id="' + escapeHtml(choice.id) + '" title="预览该编配">▶</button>',
            '<button class="info-btn" type="button" data-arrange-explain-index="' + index + '" data-option-id="' + escapeHtml(choice.id) + '">i<span class="tooltip">' + escapeHtml(choice.summary) + '</span></button>',
            '</div>',
            '<div>',
            '<div class="choice-title"><span>' + escapeHtml(choice.title) + '</span><span class="tag">' + escapeHtml(choice.category) + '</span></div>',
            '<div class="choice-output">' + escapeHtml(choice.outputLabel) + '</div>',
            '</div>',
            '</div>'
          ].join("");
        }).join("")
        : '<div class="empty-state">这个位置暂时没有需要处理的转位或排列建议。</div>';

      card.innerHTML = [
        '<div class="arrange-head">',
        '<div class="arrange-title">',
        '<span class="slot-index">编配位置 ' + (index + 1) + '</span>',
        '<strong>' + escapeHtml(item.symbol) + '</strong>',
        '<span class="degree-pill ' + (degree.inMode ? "" : "outside") + '">' + escapeHtml(degree.roman) + '</span>',
        '</div>',
        '<div class="motion-line">',
        '<span>转位前指向：' + motion.before + '</span>',
        '<span>' + motion.after + '</span>',
        motion.warning ? '<span><b>跳进较大，建议尝试转位或低音平滑。</b></span>' : '<span>根位低音运动可接受。</span>',
        '</div>',
        '</div>',
        '<div class="selected-line">' + selectedLine + '</div>',
        '<div class="arrange-choice-list">' + choicesHtml + '</div>'
      ].join("");

      els.arrangementPanel.appendChild(card);
    });
  }

  function generateArrangementOptions(events, index) {
    var item = events[index];
    if (!item) {
      return [];
    }

    var chord = parseChord(item.symbol);
    var options = [];
    var inversion = bestInversionOption(events, index);
    if (inversion && inversion.outputSymbol !== item.symbol) {
      options.push(inversion);
    }

    if (chord.intervals.length >= 4) {
      options.push(arrangementOption(
        "drop2-" + index,
        "Drop2 排列",
        "排列与复合",
        item.symbol,
        "Drop2",
        "把四声部中从上往下第二个音降低八度，获得更开阔的钢琴/吉他式排列。",
        [
          "识别：`" + item.symbol + "` 至少有四个核心音，适合做 Drop2。",
          "转位前指向：和弦功能与根音不变，只改变音在音域中的排列。",
          "理论：Drop2 不是换和弦，而是把密集排列打开，减少上方音域拥挤。",
          "效果：播放时会听到更宽的四声部，不会改变第 1 步确认的和声。"
        ].join("\n"),
        "drop2"
      ));
    }

    if (isDominant(chord) || isMinorLike(chord) || chord.quality === "suspended") {
      options.push(arrangementOption(
        "quartal-" + index,
        "四度排列",
        "排列与复合",
        item.symbol,
        "Quartal voicing",
        "用四度堆叠重排上方结构，适合 modal、sus、m7 或属和弦色彩。",
        [
          "识别：`" + item.symbol + "` 适合用四度排列弱化传统三度堆叠。",
          "转位前指向：根音和级数不变，变化发生在上方声部。",
          "理论：四度排列常用于 modal jazz、sus dominant 和现代钢琴 comping。",
          "效果：和声会更开放、更现代，但不会影响前一步的功能分析。"
        ].join("\n"),
        "quartal"
      ));
    }

    if (chord.intervals.length >= 4) {
      options.push(arrangementOption(
        "shell-" + index,
        "Shell + Guide tones",
        "排列与复合",
        item.symbol,
        "Shell voicing",
        "突出 3 音与 7 音，减少厚度，让连接更清楚。",
        [
          "识别：`" + item.symbol + "` 有足够信息提取 3 音和 7 音。",
          "转位前指向：根音方向不变，但播放时会突出 guide tones。",
          "理论：3 音和 7 音决定 maj7、m7、7 等功能色彩，shell voicing 能让连接更干净。",
          "效果：适合密集和弦较多、音域显得过重或混浊的段落。"
        ].join("\n"),
        "shell"
      ));
    }

    return options;
  }

  function bestInversionOption(events, index) {
    var item = events[index];
    var chord = parseChord(item.symbol);
    var candidates = inversionCandidates(chord);
    if (candidates.length < 2) {
      return null;
    }

    var prevPc = events[index - 1] ? bassPcForEvent(events[index - 1], state.arrangementChoices[index - 1]) : null;
    var nextPc = events[index + 1] ? bassPcForEvent(events[index + 1], null) : null;
    var rootPc = bassPcForEvent(item, null);
    var rootScore = inversionMovementScore(rootPc, prevPc, nextPc);
    var best = candidates.reduce(function (winner, candidate) {
      var score = inversionMovementScore(candidate.pc, prevPc, nextPc);
      return !winner || score < winner.score ? Object.assign({}, candidate, { score: score }) : winner;
    }, null);

    if (!best || best.pc === rootPc || best.score >= rootScore - 2) {
      return null;
    }

    var suffix = chord.suffix || "";
    var root = pcToName(chord.rootPc, shouldPreferFlats(chord.rootPc));
    var bass = pcToName(best.pc, shouldPreferFlats(best.pc));
    var symbol = root + suffix + "/" + bass;
    var before = bassMotionInfo(events, index, null).before;
    var after = bassMotionPreview(events, index, best.pc);

    return arrangementOption(
      "smooth-inversion-" + index + "-" + best.pc,
      "低音线转位",
      "古典功能/声部进行",
      symbol,
      symbol,
      "把低音从根音 " + root + " 改成 " + bass + "，减少相邻跳进。",
      [
        "识别：根位低音的运动跨度偏大。",
        "转位前指向：" + before,
        "替换：保留 `" + item.symbol + "` 的上方和声，把低音改成 `" + bass + "`，得到 `" + symbol + "`。",
        "转位后指向：" + after,
        "理论：转位不改变和弦功能，只改变最低音，常用于让低音线更顺。"
      ].join("\n"),
      "closed"
    );
  }

  function arrangementOption(id, title, category, outputSymbol, outputLabel, summary, explanation, voicingMode) {
    return {
      id: id,
      title: title,
      category: category,
      outputSymbol: outputSymbol,
      outputLabel: outputLabel,
      summary: summary,
      explanation: explanation,
      voicingMode: voicingMode || "closed"
    };
  }

  function findArrangementOption(index, optionId) {
    return generateArrangementOptions(computeOptimizedEvents(), index).find(function (item) {
      return item.id === optionId;
    }) || null;
  }

  function openArrangementExplanation(option) {
    els.dialogContent.innerHTML = [
      '<h3>' + escapeHtml(option.title) + '</h3>',
      '<p><strong>输出：</strong>' + escapeHtml(option.outputLabel) + '</p>',
      formatExplanation(option.explanation)
    ].join("");

    if (typeof els.explainDialog.showModal === "function") {
      els.explainDialog.showModal();
    } else {
      els.explainDialog.setAttribute("open", "open");
    }
  }

  function analyzeBassRange(events) {
    var basses = events.map(function (item) {
      return normalizeBassMidi(bassPcForEvent(item, null));
    });
    if (!basses.length) {
      return {
        span: 0,
        maxLeap: 0,
        needsSmoothing: false
      };
    }
    var span = Math.max.apply(null, basses) - Math.min.apply(null, basses);
    var maxLeap = 0;
    for (var i = 1; i < basses.length; i += 1) {
      maxLeap = Math.max(maxLeap, Math.abs(basses[i] - basses[i - 1]));
    }
    return {
      span: span,
      maxLeap: maxLeap,
      needsSmoothing: span > 14 || maxLeap > 7
    };
  }

  function bassMotionInfo(events, index, locked) {
    var item = events[index];
    var beforePc = bassPcForEvent(item, null);
    var afterPc = locked ? bassPcForEvent(item, locked) : beforePc;
    var prevPc = events[index - 1] ? bassPcForEvent(events[index - 1], state.arrangementChoices[index - 1]) : null;
    var nextPc = events[index + 1] ? bassPcForEvent(events[index + 1], null) : null;
    var before = [
      prevPc === null ? "前方无和弦" : motionText(prevPc, beforePc),
      nextPc === null ? "后方无和弦" : motionText(beforePc, nextPc)
    ].join("；");
    var after = locked
      ? "转位/排列后指向：" + [
        prevPc === null ? "前方无和弦" : motionText(prevPc, afterPc),
        nextPc === null ? "后方无和弦" : motionText(afterPc, nextPc)
      ].join("；")
      : "转位/排列后指向：尚未采用编配方案。";
    var warning = (prevPc !== null && bassMidiDistance(prevPc, beforePc) > 7) || (nextPc !== null && bassMidiDistance(beforePc, nextPc) > 7);
    return {
      before: before,
      after: after,
      warning: warning
    };
  }

  function bassMotionPreview(events, index, targetPc) {
    var prevPc = events[index - 1] ? bassPcForEvent(events[index - 1], state.arrangementChoices[index - 1]) : null;
    var nextPc = events[index + 1] ? bassPcForEvent(events[index + 1], null) : null;
    return [
      prevPc === null ? "前方无和弦" : motionText(prevPc, targetPc),
      nextPc === null ? "后方无和弦" : motionText(targetPc, nextPc)
    ].join("；");
  }

  function bassPcForEvent(item, choice) {
    var symbol = choice && choice.outputSymbol ? choice.outputSymbol : item.symbol;
    var chord = parseChord(symbol);
    if (chord.bass) {
      var bassName = chord.bass.replace(/♭/g, "b").replace(/♯/g, "#");
      if (typeof NOTE_TO_PC[bassName] === "number") {
        return NOTE_TO_PC[bassName];
      }
    }
    return chord.rootPc;
  }

  function inversionCandidates(chord) {
    var pcs = [chord.rootPc];
    chord.intervals.forEach(function (interval) {
      var simple = mod(interval, 12);
      if ([0, 3, 4, 6, 7, 8, 9, 10, 11].includes(simple)) {
        pcs.push(mod(chord.rootPc + simple, 12));
      }
    });
    return Array.from(new Set(pcs)).map(function (pc) {
      return { pc: pc };
    });
  }

  function inversionMovementScore(candidatePc, prevPc, nextPc) {
    var score = 0;
    if (prevPc !== null) {
      score += bassMidiDistance(prevPc, candidatePc);
    }
    if (nextPc !== null) {
      score += bassMidiDistance(candidatePc, nextPc);
    }
    return score;
  }

  function motionText(fromPc, toPc) {
    var diff = mod(toPc - fromPc, 12);
    var signed = diff > 6 ? diff - 12 : diff;
    var direction = signed === 0 ? "保持" : signed > 0 ? "上行" : "下行";
    var size = Math.abs(signed);
    return pcToName(fromPc, shouldPreferFlats(fromPc)) + " -> " + pcToName(toPc, shouldPreferFlats(toPc)) + " " + direction + intervalName(size) + "（" + size + " 半音）";
  }

  function intervalName(size) {
    return {
      0: "共同音",
      1: "小二度",
      2: "大二度",
      3: "小三度",
      4: "大三度",
      5: "纯四度",
      6: "三全音"
    }[size] || "较大跳进";
  }

  function shortestSemitoneDistance(fromPc, toPc) {
    var diff = Math.abs(mod(toPc - fromPc, 12));
    return Math.min(diff, 12 - diff);
  }

  function bassMidiDistance(fromPc, toPc) {
    return Math.abs(normalizeBassMidi(toPc) - normalizeBassMidi(fromPc));
  }

  function normalizeBassMidi(pc) {
    var midi = 36 + mod(pc, 12);
    while (midi < 40) {
      midi += 12;
    }
    while (midi > 55) {
      midi -= 12;
    }
    return midi;
  }

  function renderTechniqueLibrary() {
    var categories = ["全部"].concat(Array.from(new Set(techniques.map(function (item) {
      return item.category;
    }))));

    els.categoryTabs.innerHTML = categories.map(function (category) {
      return '<button type="button" class="' + (state.activeCategory === category ? "active" : "") + '" data-category="' + escapeHtml(category) + '">' + escapeHtml(category) + '</button>';
    }).join("");

    var query = els.docSearch.value.trim().toLowerCase();
    var filtered = techniques.filter(function (item) {
      var inCategory = state.activeCategory === "全部" || item.category === state.activeCategory;
      var haystack = [item.category, item.name, item.condition, item.output, item.note].join(" ").toLowerCase();
      return inCategory && (!query || haystack.includes(query));
    });

    els.techniqueDocs.innerHTML = filtered.length
      ? filtered.map(function (item) {
        return [
          '<article class="tech-card">',
          '<header><h3>' + escapeHtml(item.name) + '</h3><span class="category">' + escapeHtml(item.category) + '</span></header>',
          '<dl>',
          '<div><dt>识别条件</dt><dd>' + escapeHtml(item.condition) + '</dd></div>',
          '<div><dt>常见输出</dt><dd>' + escapeHtml(item.output) + '</dd></div>',
          '<div><dt>解释重点</dt><dd>' + escapeHtml(item.note) + '</dd></div>',
          '</dl>',
          '</article>'
        ].join("");
      }).join("")
      : '<div class="empty-state">没有匹配的技法。</div>';
  }

  function openExplanation(option) {
    var context = getHarmonicContext();
    els.dialogContent.innerHTML = [
      '<h3>' + escapeHtml(option.title) + '</h3>',
      '<p><strong>输出：</strong>' + displaySequence(option.output, context) + '</p>',
      formatExplanation(option.explanation)
    ].join("");

    if (typeof els.explainDialog.showModal === "function") {
      els.explainDialog.showModal();
    } else {
      els.explainDialog.setAttribute("open", "open");
    }
  }

  function formatExplanation(text) {
    return String(text)
      .split(/\n+/)
      .filter(Boolean)
      .map(function (line) {
        return "<p>" + inlineCode(line) + "</p>";
      })
      .join("");
  }

  function inlineCode(line) {
    return escapeHtml(line).replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  async function handleMidiUpload(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }
    handleMidiFile(file);
  }

  async function handleMidiFile(file) {
    try {
      var buffer = await file.arrayBuffer();
      var midi = parseMidi(buffer);
      var imported = midiToProgression(midi);
      if (!imported.slots.length) {
        throw new Error("MIDI 中没有识别到可归纳为和弦的音组。");
      }

      state.midiName = file.name;
      state.midiNotes = midi.notes;
      state.midiSourceActive = true;
      state.textDirty = false;
      els.midiFileName.textContent = file.name;
      if (midi.bpm) {
        els.tempoInput.value = String(Math.round(midi.bpm));
      }
      els.progressionInput.value = imported.slots.map(function (slot) {
        return slot.symbol + ":" + formatBeats(slot.duration);
      }).join(" | ");
      state.slots = imported.slots;
      state.lockedChoices = {};
      state.arrangementChoices = {};
      state.expandedHarmonyIndex = 0;
      recomputeAndRender();
      setStatus("已从 MIDI 识别 " + imported.slots.length + " 个和弦，调式估计 " + describeContext(getHarmonicContext()));
    } catch (error) {
      setStatus(error.message || "MIDI 解析失败");
    }
  }

  function parseMidi(buffer) {
    var view = new DataView(buffer);
    var pos = 0;

    function readUint8() {
      return view.getUint8(pos++);
    }

    function readUint16() {
      var value = view.getUint16(pos, false);
      pos += 2;
      return value;
    }

    function readUint32() {
      var value = view.getUint32(pos, false);
      pos += 4;
      return value;
    }

    function readString(length) {
      var out = "";
      for (var i = 0; i < length; i += 1) {
        out += String.fromCharCode(readUint8());
      }
      return out;
    }

    function readVarLen() {
      var value = 0;
      var b;
      do {
        b = readUint8();
        value = (value << 7) + (b & 0x7f);
      } while (b & 0x80);
      return value;
    }

    if (readString(4) !== "MThd") {
      throw new Error("这不是标准 MIDI 文件。");
    }

    var headerLength = readUint32();
    var format = readUint16();
    var trackCount = readUint16();
    var division = readUint16();
    pos += Math.max(0, headerLength - 6);

    if (division & 0x8000) {
      throw new Error("暂不支持 SMPTE time division 的 MIDI。");
    }

    var ppq = division;
    var notes = [];
    var tempos = [];

    for (var trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
      var chunkId = readString(4);
      var chunkLength = readUint32();
      var trackEnd = pos + chunkLength;
      if (chunkId !== "MTrk") {
        pos = trackEnd;
        continue;
      }

      var tick = 0;
      var runningStatus = null;
      var active = new Map();

      while (pos < trackEnd) {
        tick += readVarLen();
        var statusByte = view.getUint8(pos);
        var status;
        var firstData = null;

        if (statusByte < 0x80) {
          if (runningStatus === null) {
            throw new Error("MIDI running status 无法解析。");
          }
          status = runningStatus;
          firstData = readUint8();
        } else {
          status = readUint8();
          if (status < 0xf0) {
            runningStatus = status;
          }
        }

        if (status === 0xff) {
          var metaType = readUint8();
          var metaLength = readVarLen();
          if (metaType === 0x51 && metaLength === 3) {
            var mpq = (readUint8() << 16) + (readUint8() << 8) + readUint8();
            tempos.push({
              tick: tick,
              bpm: 60000000 / mpq
            });
          } else {
            pos += metaLength;
          }
          continue;
        }

        if (status === 0xf0 || status === 0xf7) {
          pos += readVarLen();
          continue;
        }

        var command = status & 0xf0;
        var channel = status & 0x0f;
        var data1 = firstData === null ? readUint8() : firstData;
        var data2 = command === 0xc0 || command === 0xd0 ? 0 : readUint8();

        if (command === 0x90 && data2 > 0) {
          var key = channel + ":" + data1;
          if (!active.has(key)) {
            active.set(key, []);
          }
          active.get(key).push({
            midi: data1,
            velocity: data2,
            startTick: tick,
            channel: channel
          });
        } else if (command === 0x80 || (command === 0x90 && data2 === 0)) {
          var offKey = channel + ":" + data1;
          var stack = active.get(offKey);
          if (stack && stack.length) {
            var started = stack.shift();
            notes.push({
              midi: started.midi,
              velocity: started.velocity,
              channel: started.channel,
              startBeat: started.startTick / ppq,
              duration: Math.max(0.05, (tick - started.startTick) / ppq)
            });
          }
        }
      }

      active.forEach(function (stack) {
        stack.forEach(function (started) {
          notes.push({
            midi: started.midi,
            velocity: started.velocity,
            channel: started.channel,
            startBeat: started.startTick / ppq,
            duration: 1
          });
        });
      });

      pos = trackEnd;
    }

    notes.sort(function (a, b) {
      return a.startBeat - b.startBeat || a.midi - b.midi;
    });

    return {
      format: format,
      ppq: ppq,
      notes: notes,
      bpm: tempos.length ? tempos[0].bpm : null
    };
  }

  function midiToProgression(midi) {
    var groups = new Map();

    midi.notes.forEach(function (note) {
      if (note.channel === 9) {
        return;
      }
      var rounded = Math.round(note.startBeat * 4) / 4;
      var key = rounded.toFixed(2);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(note);
    });

    var starts = Array.from(groups.keys()).map(Number).sort(function (a, b) {
      return a - b;
    });

    var detected = [];
    starts.forEach(function (start) {
      var notes = groups.get(start.toFixed(2)) || [];
      var uniquePcs = Array.from(new Set(notes.map(function (note) {
        return note.midi % 12;
      })));

      if (notes.length < 3 || uniquePcs.length < 3) {
        return;
      }

      var symbol = detectChordFromMidiNotes(notes);
      if (!symbol) {
        return;
      }

      var end = Math.max.apply(null, notes.map(function (note) {
        return note.startBeat + note.duration;
      }));
      detected.push({
        symbol: symbol,
        startBeat: start,
        endBeat: end
      });
    });

    var slots = detected.map(function (item, index) {
      var nextStart = detected[index + 1] ? detected[index + 1].startBeat : item.endBeat;
      var duration = Math.max(0.5, nextStart - item.startBeat || item.endBeat - item.startBeat || 4);
      var chord = parseChord(item.symbol);
      return {
        id: "midi-" + index,
        symbol: chord.symbol,
        rawSymbol: item.symbol,
        chord: chord,
        duration: Math.round(duration * 4) / 4,
        startBeat: item.startBeat
      };
    });

    return {
      slots: mergeSimilarSlots(slots)
    };
  }

  function detectChordFromMidiNotes(notes) {
    var pcs = Array.from(new Set(notes.map(function (note) {
      return note.midi % 12;
    })));
    var bassPc = notes.slice().sort(function (a, b) {
      return a.midi - b.midi;
    })[0].midi % 12;

    var qualities = [
      { suffix: "maj9", intervals: [0, 4, 7, 11, 2], weight: 11 },
      { suffix: "m9", intervals: [0, 3, 7, 10, 2], weight: 11 },
      { suffix: "13", intervals: [0, 4, 7, 10, 2, 9], weight: 10 },
      { suffix: "maj7", intervals: [0, 4, 7, 11], weight: 9 },
      { suffix: "m7", intervals: [0, 3, 7, 10], weight: 9 },
      { suffix: "7", intervals: [0, 4, 7, 10], weight: 9 },
      { suffix: "m7b5", intervals: [0, 3, 6, 10], weight: 8 },
      { suffix: "dim7", intervals: [0, 3, 6, 9], weight: 8 },
      { suffix: "6", intervals: [0, 4, 7, 9], weight: 7 },
      { suffix: "m6", intervals: [0, 3, 7, 9], weight: 7 },
      { suffix: "", intervals: [0, 4, 7], weight: 5 },
      { suffix: "m", intervals: [0, 3, 7], weight: 5 },
      { suffix: "dim", intervals: [0, 3, 6], weight: 5 },
      { suffix: "sus4", intervals: [0, 5, 7], weight: 4 }
    ];

    var best = null;
    for (var root = 0; root < 12; root += 1) {
      qualities.forEach(function (quality) {
        var required = quality.intervals.map(function (interval) {
          return mod(root + interval, 12);
        });
        var hits = required.filter(function (pc) {
          return pcs.includes(pc);
        }).length;
        var missing = required.length - hits;
        var extras = pcs.filter(function (pc) {
          return !required.includes(pc);
        }).length;
        var bassBonus = root === bassPc ? 3 : 0;
        var score = hits * 4 + quality.weight + bassBonus - missing * 5 - extras;

        if (missing > 1) {
          score -= 8;
        }

        if (!best || score > best.score) {
          best = {
            root: root,
            suffix: quality.suffix,
            score: score
          };
        }
      });
    }

    if (!best || best.score < 10) {
      return null;
    }

    return pcToName(best.root, true) + best.suffix;
  }

  function mergeSimilarSlots(slots) {
    var merged = [];
    slots.forEach(function (slot) {
      var prev = merged[merged.length - 1];
      if (prev && prev.symbol === slot.symbol && Math.abs(prev.startBeat + prev.duration - slot.startBeat) <= 0.26) {
        prev.duration = Math.round((prev.duration + slot.duration) * 4) / 4;
      } else {
        merged.push(slot);
      }
    });
    return merged;
  }

  function playOriginal() {
    stopPlayback();
    if (state.midiSourceActive && state.midiNotes && state.midiNotes.length) {
      playMidiNotes(state.midiNotes);
      setStatus("播放原始 MIDI");
      return;
    }
    if (state.textDirty || !state.slots.length) {
      analyzeFromText(false);
    }
    playChordEvents(state.slots.map(function (slot, index) {
      return {
        symbol: slot.symbol,
        duration: slot.duration,
        originIndex: index
      };
    }));
    setStatus("播放原始走向");
  }

  function playOptimized() {
    stopPlayback();
    if (state.textDirty || !state.slots.length) {
      analyzeFromText(false);
    }
    playChordEvents(computeArrangedEvents());
    setStatus(Object.keys(state.arrangementChoices).length ? "播放优化+编配走向" : "播放优化走向");
  }

  function playHarmonySlotPreview(index) {
    if (!state.slots[index]) {
      return;
    }
    stopPlayback();
    var locked = state.lockedChoices[index];
    var output = locked ? locked.output : [event(state.slots[index].symbol, state.slots[index].duration)];
    playChordEvents(output.map(function (item) {
      return {
        symbol: item.symbol,
        duration: item.duration,
        originIndex: index
      };
    }));
    setStatus("预览位置 " + (index + 1));
  }

  function playHarmonyOptionPreview(index, optionId) {
    var option = findOption(index, optionId);
    if (!option) {
      return;
    }
    stopPlayback();
    playChordEvents(option.output.map(function (item) {
      return {
        symbol: item.symbol,
        duration: item.duration,
        originIndex: index
      };
    }));
    setStatus("预览方案：" + option.title);
  }

  function playArrangementOptionPreview(index, optionId) {
    var option = findArrangementOption(index, optionId);
    var base = computeOptimizedEvents()[index];
    if (!option || !base) {
      return;
    }
    stopPlayback();
    playChordEvents([{
      symbol: option.outputSymbol || base.symbol,
      duration: base.duration,
      originIndex: base.originIndex,
      arrangeIndex: index,
      voicingMode: option.voicingMode || "closed"
    }]);
    setStatus("预览编配：" + option.title);
  }

  function playArrangementCurrentPreview(index) {
    var item = computeArrangedEvents()[index];
    if (!item) {
      return;
    }
    stopPlayback();
    playChordEvents([item]);
    setStatus("预览当前编配位置 " + (index + 1));
  }

  function ensureAudioContext() {
    if (!state.audioContext) {
      var AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      state.audioContext = new AudioContextCtor();
    }
    if (state.audioContext.state === "suspended") {
      state.audioContext.resume();
    }
    return state.audioContext;
  }

  function playChordEvents(events) {
    if (!events.length) {
      setStatus("没有可播放内容");
      return;
    }

    var ctx = ensureAudioContext();
    var beatSec = 60 / getTempo();
    var cursor = ctx.currentTime + 0.06;

    events.forEach(function (item) {
      var chord = parseChord(item.symbol);
      var voicing = chordToMidiVoicing(chord, item.voicingMode);
      var durationSec = Math.max(0.12, item.duration * beatSec * 0.92);
      voicing.forEach(function (midi, noteIndex) {
        scheduleNote(ctx, midi, cursor + noteIndex * 0.008, durationSec, 0.11);
      });
      scheduleHighlight(item.originIndex, (cursor - ctx.currentTime) * 1000, durationSec * 1000, item.arrangeIndex);
      cursor += item.duration * beatSec;
    });

    state.stopTimer = window.setTimeout(function () {
      clearHighlights();
      setStatus("播放完成");
    }, Math.max(100, (cursor - ctx.currentTime) * 1000 + 80));
  }

  function playMidiNotes(notes) {
    if (!notes.length) {
      setStatus("MIDI 没有可播放音符");
      return;
    }

    var ctx = ensureAudioContext();
    var beatSec = 60 / getTempo();
    var startTime = ctx.currentTime + 0.06;
    var lastEnd = 0;

    notes.forEach(function (note) {
      if (note.channel === 9) {
        return;
      }
      var when = startTime + note.startBeat * beatSec;
      var duration = Math.max(0.05, note.duration * beatSec * 0.92);
      var gain = Math.min(0.13, 0.05 + note.velocity / 1270);
      scheduleNote(ctx, note.midi, when, duration, gain);
      lastEnd = Math.max(lastEnd, note.startBeat * beatSec + duration);
    });

    state.stopTimer = window.setTimeout(function () {
      setStatus("播放完成");
    }, Math.max(100, lastEnd * 1000 + 120));
  }

  function scheduleNote(ctx, midi, when, duration, peakGain) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    var filter = ctx.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(midiToFrequency(midi), when);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2400, when);

    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peakGain), when + 0.018);
    gain.gain.setTargetAtTime(0.0001, when + Math.max(0.04, duration - 0.08), 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(when);
    osc.stop(when + duration + 0.2);
    state.scheduledNodes.push(osc);
  }

  function stopPlayback() {
    state.scheduledNodes.forEach(function (node) {
      try {
        node.stop();
      } catch (error) {
        // Oscillators that already stopped can be ignored.
      }
    });
    state.scheduledNodes = [];
    if (state.stopTimer) {
      window.clearTimeout(state.stopTimer);
      state.stopTimer = null;
    }
    clearHighlights();
  }

  function scheduleHighlight(index, delayMs, durationMs, arrangeIndex) {
    if (typeof index !== "number") {
      return;
    }
    var startTimer = window.setTimeout(function () {
      var card = els.timeline.querySelector('[data-slot-index="' + index + '"]');
      if (card) {
        card.classList.add("playing");
      }
      var arrangeCard = els.arrangementPanel.querySelector('[data-arrange-index="' + arrangeIndex + '"]');
      if (arrangeCard) {
        arrangeCard.classList.add("playing");
      }
    }, Math.max(0, delayMs));
    var endTimer = window.setTimeout(function () {
      var card = els.timeline.querySelector('[data-slot-index="' + index + '"]');
      if (card) {
        card.classList.remove("playing");
      }
      var arrangeCard = els.arrangementPanel.querySelector('[data-arrange-index="' + arrangeIndex + '"]');
      if (arrangeCard) {
        arrangeCard.classList.remove("playing");
      }
    }, Math.max(0, delayMs + durationMs));
    state.highlightTimers.push(startTimer, endTimer);
  }

  function clearHighlights() {
    state.highlightTimers.forEach(function (timer) {
      window.clearTimeout(timer);
    });
    state.highlightTimers = [];
    els.timeline.querySelectorAll(".playing").forEach(function (card) {
      card.classList.remove("playing");
    });
    els.arrangementPanel.querySelectorAll(".playing").forEach(function (card) {
      card.classList.remove("playing");
    });
  }

  function chordToMidiVoicing(chord, voicingMode) {
    var bassPc = chord.rootPc;
    if (chord.bass) {
      var bassName = chord.bass.replace(/♭/g, "b").replace(/♯/g, "#");
      if (typeof NOTE_TO_PC[bassName] === "number") {
        bassPc = NOTE_TO_PC[bassName];
      }
    }
    var bass = normalizeBassMidi(bassPc);
    var mode = voicingMode || "closed";

    if (mode === "quartal") {
      return [bass].concat(normalizeUpperVoicing([0, 5, 10, 15, 19].map(function (interval) {
        return 60 + chord.rootPc + interval;
      })).slice(0, 5));
    }

    var tones = normalizeUpperVoicing(chord.intervals.map(function (interval) {
      return 60 + chord.rootPc + interval;
    }));

    if (mode === "shell") {
      var shell = chord.intervals.filter(function (interval) {
        return [3, 4, 10, 11, 14, 21].includes(mod(interval, 12)) || interval === 0;
      }).map(function (interval) {
        return 60 + chord.rootPc + interval;
      });
      tones = normalizeUpperVoicing(shell.length >= 3 ? shell : chord.intervals.slice(0, 4).map(function (interval) {
        return 60 + chord.rootPc + interval;
      }));
    }

    if (mode === "drop2" && tones.length >= 4) {
      var upper = tones.slice(0, 4).sort(function (a, b) {
        return a - b;
      });
      upper[2] -= 12;
      tones = normalizeUpperVoicing(upper.concat(tones.slice(4)));
    }

    if (tones.length > 5) {
      tones = tones.slice(0, 5);
    }

    return Array.from(new Set([bass].concat(tones))).sort(function (a, b) {
      return a - b;
    });
  }

  function normalizeUpperVoicing(midis) {
    return Array.from(new Set(midis.map(function (midi) {
      var value = midi;
      while (value < 55) {
        value += 12;
      }
      while (value > 78) {
        value -= 12;
      }
      return value;
    }))).sort(function (a, b) {
      return a - b;
    });
  }

  function midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function getTempo() {
    return clamp(Number(els.tempoInput.value) || 96, 48, 220);
  }

  function getSelectedKeyRoot() {
    return getHarmonicContext().keyRoot;
  }

  function getSelectedMode() {
    return getHarmonicContext().mode;
  }

  function getHarmonicContext() {
    var inferred = inferHarmonicContext(state.slots);
    var selectedKey = els.keySelect.value;
    var selectedMode = els.modeSelect.value;
    var keyRoot = selectedKey === "auto" ? inferred.keyRoot : NOTE_TO_PC[selectedKey];
    var mode = selectedMode === "auto" ? inferred.mode : selectedMode;
    return {
      keyRoot: typeof keyRoot === "number" ? keyRoot : NOTE_TO_PC.C,
      mode: MODE_DEFS[mode] ? mode : "ionian",
      confidence: inferred.confidence,
      source: selectedKey === "auto" || selectedMode === "auto" ? "auto" : "manual"
    };
  }

  function describeContext(context) {
    var preferFlats = shouldPreferFlats(context.keyRoot);
    var confidence = Math.round((context.confidence || 0) * 100);
    var suffix = context.source === "auto" ? " · " + confidence + "%" : " · 手动";
    return pcToName(context.keyRoot, preferFlats) + " " + MODE_DEFS[context.mode].label + suffix;
  }

  function inferHarmonicContext(slots) {
    if (!slots || !slots.length) {
      return {
        keyRoot: NOTE_TO_PC.C,
        mode: "ionian",
        confidence: 0
      };
    }

    var best = null;
    var scores = [];
    for (var root = 0; root < 12; root += 1) {
      MODE_ORDER.forEach(function (mode) {
        var score = scoreHarmonicContext(slots, root, mode);
        var candidate = {
          keyRoot: root,
          mode: mode,
          score: score
        };
        scores.push(candidate);
        if (!best || score > best.score) {
          best = candidate;
        }
      });
    }

    scores.sort(function (a, b) {
      return b.score - a.score;
    });
    var second = scores[1] ? scores[1].score : best.score - 1;
    var confidence = clamp((best.score - second + 2) / 12, 0.25, 0.98);

    return {
      keyRoot: best.keyRoot,
      mode: best.mode,
      confidence: confidence
    };
  }

  function scoreHarmonicContext(slots, root, mode) {
    var def = MODE_DEFS[mode] || MODE_DEFS.ionian;
    var scale = def.intervals.map(function (interval) {
      return mod(root + interval, 12);
    });
    var score = def.common ? 1.5 : 0;

    slots.forEach(function (slot, index) {
      var chord = slot.chord;
      var weight = Math.max(0.75, Math.min(4, slot.duration || 1));
      var rel = mod(chord.rootPc - root, 12);
      var scaleIndex = def.intervals.indexOf(rel);

      if (scaleIndex >= 0) {
        score += 4 * weight;
        var expected = expectedQualityForDegree(def, scaleIndex);
        score += qualityMatchScore(chord, expected) * weight;
      } else {
        score -= 1.6 * weight;
      }

      if (chord.rootPc === root) {
        score += index === 0 || index === slots.length - 1 ? 4.5 : 1.5;
        if (tonicQualityMatches(chord, def.tonicQuality)) {
          score += 3.5;
        }
      }
    });

    score += commonProgressionBonus(slots, root, mode);
    return score;
  }

  function expectedQualityForDegree(def, index) {
    var intervals = def.intervals;
    var root = intervals[index];
    var third = mod(intervals[(index + 2) % 7] + (index + 2 >= 7 ? 12 : 0) - root, 12);
    var fifth = mod(intervals[(index + 4) % 7] + (index + 4 >= 7 ? 12 : 0) - root, 12);
    var seventh = mod(intervals[(index + 6) % 7] + (index + 6 >= 7 ? 12 : 0) - root, 12);

    if (third === 4 && fifth === 7 && seventh === 10) {
      return "dominant";
    }
    if (third === 4 && fifth === 7) {
      return "major";
    }
    if (third === 3 && fifth === 7) {
      return "minor";
    }
    if (third === 3 && fifth === 6) {
      return seventh === 10 ? "half-diminished" : "diminished";
    }
    return "color";
  }

  function qualityMatchScore(chord, expected) {
    if (expected === "major") {
      return isMajorLike(chord) || isDominant(chord) ? 2.4 : isMinorLike(chord) ? -1.2 : 0;
    }
    if (expected === "minor") {
      return isMinorLike(chord) ? 2.4 : isMajorLike(chord) ? -1 : 0;
    }
    if (expected === "dominant") {
      return isDominant(chord) ? 3 : isMajorLike(chord) ? 1 : -0.6;
    }
    if (expected === "half-diminished") {
      return chord.quality === "half-diminished" ? 3 : chord.quality === "diminished" || chord.quality === "diminished7" ? 1.6 : -0.8;
    }
    if (expected === "diminished") {
      return chord.quality === "diminished" || chord.quality === "diminished7" || chord.quality === "half-diminished" ? 2.4 : -0.8;
    }
    return 0;
  }

  function tonicQualityMatches(chord, tonicQuality) {
    if (tonicQuality === "major") {
      return isMajorLike(chord) || isDominant(chord);
    }
    if (tonicQuality === "minor") {
      return isMinorLike(chord);
    }
    if (tonicQuality === "diminished") {
      return chord.quality === "half-diminished" || chord.quality === "diminished" || chord.quality === "diminished7";
    }
    return false;
  }

  function commonProgressionBonus(slots, root, mode) {
    var roots = slots.map(function (slot) {
      return mod(slot.chord.rootPc - root, 12);
    });
    var bonus = 0;
    var isMajorMode = ["ionian", "lydian"].includes(mode);
    var isMinorMode = ["aeolian", "harmonicMinor", "dorian", "phrygian"].includes(mode);

    for (var i = 0; i < roots.length - 1; i += 1) {
      if (roots[i] === 7 && roots[i + 1] === 0) {
        bonus += 4;
      }
      if (roots[i] === 10 && roots[i + 1] === 0 && (mode === "mixolydian" || mode === "dorian" || mode === "aeolian")) {
        bonus += 3.5;
      }
      if (roots[i] === 5 && roots[i + 1] === 0) {
        bonus += 2.5;
      }
    }

    for (var j = 0; j < roots.length - 2; j += 1) {
      if (roots[j] === 2 && roots[j + 1] === 7 && roots[j + 2] === 0) {
        bonus += isMajorMode ? 8 : 5;
      }
      if (roots[j] === 5 && roots[j + 1] === 10 && roots[j + 2] === 0) {
        bonus += 5;
      }
      if (roots[j] === 2 && roots[j + 1] === 7 && roots[j + 2] === 9) {
        bonus += 2;
      }
      if (roots[j] === 8 && roots[j + 1] === 10 && roots[j + 2] === 0 && isMinorMode) {
        bonus += 5;
      }
    }

    return bonus;
  }

  function degreeForChord(chord, context) {
    if (!chord) {
      return {
        roman: "-",
        inMode: false,
        hint: "未识别"
      };
    }

    var rel = mod(chord.rootPc - context.keyRoot, 12);
    var modeDef = MODE_DEFS[context.mode] || MODE_DEFS.ionian;
    var inMode = modeDef.intervals.includes(rel);
    var base = MAJOR_DEGREE_NAMES[rel];
    var accidental = base.match(/^[b#]+/) ? base.match(/^[b#]+/)[0] : "";
    var roman = base.slice(accidental.length);
    var minorish = isMinorLike(chord) || chord.quality === "diminished" || chord.quality === "diminished7" || chord.quality === "half-diminished";
    var cased = minorish ? roman.toLowerCase() : roman;
    var suffix = degreeQualitySuffix(chord);
    var preferFlats = shouldPreferFlats(context.keyRoot, chord.rootPc);
    var keyName = pcToName(context.keyRoot, preferFlats);

    return {
      roman: accidental + cased + suffix,
      inMode: inMode,
      hint: keyName + " " + modeDef.label + (inMode ? " 调式内和弦" : " 调式外/借用色彩")
    };
  }

  function degreeQualitySuffix(chord) {
    if (chord.quality === "half-diminished") {
      return "ø7";
    }
    if (chord.quality === "diminished7") {
      return "°7";
    }
    if (chord.quality === "diminished") {
      return "°";
    }
    if (isDominant(chord)) {
      if (/alt/.test(chord.suffix)) {
        return "7alt";
      }
      if (/#11/.test(chord.suffix)) {
        return "7#11";
      }
      if (/b9/.test(chord.suffix)) {
        return "7b9";
      }
      if (/#9/.test(chord.suffix)) {
        return "7#9";
      }
      if (/13/.test(chord.suffix)) {
        return "13";
      }
      if (/9/.test(chord.suffix)) {
        return "9";
      }
      return "7";
    }
    if (chord.quality === "major7") {
      return "maj7";
    }
    if (chord.quality === "major9") {
      return "maj9";
    }
    if (chord.quality === "major6") {
      return chord.suffix === "6/9" ? "6/9" : "6";
    }
    if (chord.quality === "minor7") {
      return "7";
    }
    if (chord.quality === "minorMajor7") {
      return "Maj7";
    }
    if (chord.quality === "minor9") {
      return "9";
    }
    if (chord.quality === "minor6") {
      return "6";
    }
    if (chord.quality === "suspended") {
      return chord.suffix.includes("7") ? "7sus" : "sus";
    }
    return "";
  }

  function shouldPreferFlats(keyRoot, chordRoot) {
    var keyName = pcToName(typeof keyRoot === "number" ? keyRoot : chordRoot, true);
    return FLAT_KEYS.has(keyName) || ["Db", "Eb", "Gb", "Ab", "Bb"].includes(keyName);
  }

  function isDominant(chord) {
    return ["dominant7", "dominant9", "dominant13"].includes(chord.quality) || ["7", "9", "13", "7alt", "7b9", "7#9", "7#11"].includes(chord.suffix);
  }

  function resolvesByFifth(source, target) {
    return source && target && mod(source.rootPc - target.rootPc, 12) === 7;
  }

  function isMajorLike(chord) {
    return ["major", "major6", "major7", "major9", "add9"].includes(chord.quality);
  }

  function isMinorLike(chord) {
    return ["minor", "minorMajor7", "minor6", "minor7", "minor9", "half-diminished"].includes(chord.quality);
  }

  function isTonicLike(chord, keyRoot) {
    return typeof keyRoot === "number" && chord.rootPc === keyRoot && (isMajorLike(chord) || isMinorLike(chord));
  }

  function tech(category, name, condition, output, note) {
    return {
      category: category,
      name: name,
      condition: condition,
      output: output,
      note: note
    };
  }

  function option(id, title, category, output, summary, explanation) {
    return {
      id: id,
      title: title,
      category: category,
      output: output,
      summary: summary,
      explanation: explanation
    };
  }

  function event(symbol, duration) {
    return {
      symbol: symbol,
      duration: Math.max(0.25, Math.round(duration * 1000) / 1000)
    };
  }

  function cloneOption(item) {
    return JSON.parse(JSON.stringify(item));
  }

  function findOption(index, optionId) {
    return (state.currentSuggestions[index] || []).find(function (item) {
      return item.id === optionId;
    }) || null;
  }

  function splitDuration(duration, parts) {
    var base = duration / parts;
    var values = [];
    var used = 0;
    for (var i = 0; i < parts; i += 1) {
      var value = i === parts - 1 ? duration - used : base;
      value = Math.max(0.25, Math.round(value * 1000) / 1000);
      used += value;
      values.push(value);
    }
    return values;
  }

  function displaySequence(output, context) {
    var activeContext = context || getHarmonicContext();
    return output.map(function (item) {
      var label = escapeHtml(item.symbol + ":" + formatBeats(item.duration));
      var chord = null;
      try {
        chord = parseChord(item.symbol);
      } catch (error) {
        chord = null;
      }
      if (!chord) {
        return label;
      }
      var degree = degreeForChord(chord, activeContext);
      return label + ' <span class="sequence-degree">(' + escapeHtml(degree.roman) + ')</span>';
    }).join(" - ");
  }

  function displaySequenceText(output) {
    return output.map(function (item) {
      return item.symbol + ":" + formatBeats(item.duration);
    }).join(" - ");
  }

  function formatBeats(value) {
    var rounded = Math.round(value * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/0+$/, "").replace(/\.$/, "");
  }

  function pcToName(pc, preferFlats) {
    return (preferFlats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP)[mod(pc, 12)];
  }

  function mod(value, by) {
    return ((value % by) + by) % by;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setStatus(message) {
    els.statusBadge.textContent = message;
  }
})();
