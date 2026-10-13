/**
 * ACCP/ASHP Critical Care Pharmacy Quiz App
 * Full interactivity, LocalStorage persistence, Random Quiz & Mistakes Notebook
 */

(() => {
  // 1. Data Initialization
  const rawQuestions = window.QUESTIONS_DATA || [];
  const referenceData = window.REFERENCE_DATA || { abbreviations: '', references: '' };

  // Map questions by ID
  const questionsById = {};
  rawQuestions.forEach(q => {
    questionsById[q.id] = q;
  });

  // Extract unique chapters
  const chapters = [];
  const chapterSeen = new Set();
  rawQuestions.forEach(q => {
    if (!chapterSeen.has(q.category)) {
      chapterSeen.add(q.category);
      chapters.push({
        fullName: q.category,
        name: q.category_name
      });
    }
  });

  // 2. Persistent State Management
  const STORAGE_KEY = 'accp_quiz_state_v1';
  let state = {
    answers: {},       // { [qId]: { selected: 'A', isCorrect: true, time: 12345 } }
    mistakes: [],      // array of qId
    starred: [],       // array of qId
    theme: 'light',
    lastVisitedId: 1
  };

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        state = Object.assign(state, JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load state', e);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      updateBadges();
    } catch (e) {
      console.error('Failed to save state', e);
    }
  }

  // 3. Quiz Runtime State
  let currentMode = 'all'; // 'all' | 'random' | 'mistakes' | 'starred' | 'chapter'
  let examModeType = 'instant'; // 'instant' | 'exam'
  let activeQueue = [...rawQuestions];
  let currentIndex = 0;
  let examAnswers = {}; // { [qId]: 'A' } for exam mode
  let isExamSubmitted = false;

  // DOM Elements
  const viewPractice = document.getElementById('viewPractice');
  const viewRandomHub = document.getElementById('viewRandomHub');
  const viewMistakesHub = document.getElementById('viewMistakesHub');
  const viewStarredHub = document.getElementById('viewStarredHub');
  const viewStats = document.getElementById('viewStats');
  const views = [viewPractice, viewRandomHub, viewMistakesHub, viewStarredHub, viewStats];

  // Question Card Elements
  const qCategory = document.getElementById('qCategory');
  const qNumberText = document.getElementById('qNumberText');
  const qTotalText = document.getElementById('qTotalText');
  const btnStarCurrent = document.getElementById('btnStarCurrent');
  const sharedCaseBox = document.getElementById('sharedCaseBox');
  const sharedCaseLabel = document.getElementById('sharedCaseLabel');
  const sharedCaseText = document.getElementById('sharedCaseText');
  const questionText = document.getElementById('questionText');
  const optionsContainer = document.getElementById('optionsContainer');
  const explanationBox = document.getElementById('explanationBox');
  const answerStatusBadge = document.getElementById('answerStatusBadge');
  const correctAnswerText = document.getElementById('correctAnswerText');
  const explanationText = document.getElementById('explanationText');
  const notesBox = document.getElementById('notesBox');
  const notesText = document.getElementById('notesText');
  const basisTag = document.getElementById('basisTag');
  const basisText = document.getElementById('basisText');

  // Controls
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnToggleExp = document.getElementById('btnToggleExp');
  const btnRemoveMistake = document.getElementById('btnRemoveMistake');
  const examModeBanner = document.getElementById('examModeBanner');
  const examModeTitle = document.getElementById('examModeTitle');
  const btnFinishExam = document.getElementById('btnFinishExam');

  // Badges
  const badgeMistakesTab = document.getElementById('badgeMistakesTab');
  const badgeMistakesMobile = document.getElementById('badgeMistakesMobile');
  const badgeStarredTab = document.getElementById('badgeStarredTab');
  const badgeStarredMobile = document.getElementById('badgeStarredMobile');

  // Modals
  const modalGrid = document.getElementById('modalGrid');
  const modalSearch = document.getElementById('modalSearch');
  const modalExamResult = document.getElementById('modalExamResult');

  // Toast
  const toast = document.getElementById('toast');
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  // 4. View Switching
  function switchView(viewName) {
    views.forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.tab-btn, .bottom-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
    });

    if (viewName === 'practice') {
      viewPractice.classList.add('active');
      renderCurrentQuestion();
    } else if (viewName === 'random-hub') {
      viewRandomHub.classList.add('active');
    } else if (viewName === 'mistakes-hub') {
      viewMistakesHub.classList.add('active');
      renderMistakesHub();
    } else if (viewName === 'starred-hub') {
      viewStarredHub.classList.add('active');
      renderStarredHub();
    } else if (viewName === 'stats') {
      viewStats.classList.add('active');
      renderStats();
    }
  }

  // Update badge counters
  function updateBadges() {
    const mCount = state.mistakes.length;
    badgeMistakesTab.textContent = mCount;
    badgeMistakesTab.style.display = mCount > 0 ? 'inline-block' : 'none';
    badgeMistakesMobile.textContent = mCount;
    badgeMistakesMobile.style.display = mCount > 0 ? 'inline-block' : 'none';

    const sCount = state.starred.length;
    badgeStarredTab.textContent = sCount;
    badgeStarredTab.style.display = sCount > 0 ? 'inline-block' : 'none';
    badgeStarredMobile.textContent = sCount;
    badgeStarredMobile.style.display = sCount > 0 ? 'inline-block' : 'none';
  }

  // 5. Question Rendering
  function renderCurrentQuestion() {
    if (!activeQueue || activeQueue.length === 0) {
      questionText.textContent = '此模式下目前沒有題目。';
      optionsContainer.innerHTML = '';
      explanationBox.style.display = 'none';
      sharedCaseBox.style.display = 'none';
      return;
    }

    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex >= activeQueue.length) currentIndex = activeQueue.length - 1;

    const q = activeQueue[currentIndex];
    state.lastVisitedId = q.id;

    // Meta
    qCategory.textContent = q.category_name;
    qNumberText.textContent = `第 ${q.id} 題`;
    qTotalText.textContent = `(${currentIndex + 1} / ${activeQueue.length})`;

    // Star icon state
    btnStarCurrent.classList.toggle('starred', state.starred.includes(q.id));

    // Shared Case
    if (q.shared_case && q.shared_case.trim().length > 0) {
      sharedCaseBox.style.display = 'block';
      // Format shared case title if starts with range
      const match = q.shared_case.match(/^第\s*(\d+[–-]\d+)\s*題共用病例[：:]/);
      if (match) {
        sharedCaseLabel.textContent = `第 ${match[1]} 題共用病例`;
        sharedCaseText.textContent = q.shared_case.replace(/^第\s*\d+[–-]\d+\s*題共用病例[：:]\s*/, '');
      } else {
        sharedCaseLabel.textContent = '共用病例情境';
        sharedCaseText.textContent = q.shared_case;
      }
    } else {
      sharedCaseBox.style.display = 'none';
    }

    // Question Text
    questionText.textContent = q.question;

    // Remove Mistake button visibility
    btnRemoveMistake.style.display = state.mistakes.includes(q.id) ? 'inline-flex' : 'none';

    // Check answered status
    const existingAnswer = examModeType === 'exam' && !isExamSubmitted 
      ? examAnswers[q.id] 
      : (state.answers[q.id] ? state.answers[q.id].selected : null);

    const isAnswered = existingAnswer !== null && existingAnswer !== undefined;

    // Options
    optionsContainer.innerHTML = '';
    const optionLetters = ['A', 'B', 'C', 'D'];
    
    optionLetters.forEach(letter => {
      const text = q.options[letter];
      if (!text) return;

      const optEl = document.createElement('div');
      optEl.className = 'option-item';
      optEl.dataset.letter = letter;

      const letterBadge = document.createElement('div');
      letterBadge.className = 'option-letter';
      letterBadge.textContent = letter;

      const textEl = document.createElement('div');
      textEl.className = 'option-text';
      textEl.textContent = text;

      optEl.appendChild(letterBadge);
      optEl.appendChild(textEl);

      // Status styles if answered
      if (isAnswered) {
        if (examModeType === 'exam' && !isExamSubmitted) {
          // In exam mode before submit: just highlight user selection
          if (existingAnswer === letter) {
            optEl.style.borderColor = 'var(--primary)';
            optEl.style.background = 'var(--primary-light)';
            letterBadge.style.background = 'var(--primary)';
            letterBadge.style.color = 'white';
          }
        } else {
          // Instant or Exam submitted: show correct/wrong
          optEl.classList.add('disabled');
          const isCorrectChoice = (letter === q.answer_letter);
          const isUserChoice = (existingAnswer === letter);

          if (isUserChoice) {
            if (isCorrectChoice) {
              optEl.classList.add('selected-correct');
            } else {
              optEl.classList.add('selected-wrong');
            }
          } else if (isCorrectChoice) {
            optEl.classList.add('correct-target');
          }
        }
      }

      optEl.addEventListener('click', () => handleOptionClick(q, letter));
      optionsContainer.appendChild(optEl);
    });

    // Explanation Box display
    if (isAnswered && (examModeType === 'instant' || isExamSubmitted)) {
      renderExplanationBox(q, existingAnswer);
      btnToggleExp.textContent = '隱藏解析';
    } else {
      explanationBox.style.display = 'none';
      btnToggleExp.textContent = '💡 查看解析';
    }

    // Prev / Next button states
    btnPrev.disabled = currentIndex === 0;
    btnNext.disabled = currentIndex === activeQueue.length - 1;
  }

  // 6. Option Click Handling
  function handleOptionClick(q, selectedLetter) {
    if (examModeType === 'exam') {
      if (isExamSubmitted) return; // already finished
      examAnswers[q.id] = selectedLetter;
      renderCurrentQuestion();
      return;
    }

    // Instant Feedback Mode
    const isCorrect = (selectedLetter === q.answer_letter);

    // Save user answer
    state.answers[q.id] = {
      selected: selectedLetter,
      isCorrect: isCorrect,
      time: Date.now()
    };

    // Update Mistakes list
    if (!isCorrect) {
      if (!state.mistakes.includes(q.id)) {
        state.mistakes.push(q.id);
      }
      // Haptic vibration on wrong
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } else {
      // Haptic vibration on correct
      if (navigator.vibrate) navigator.vibrate(60);
    }

    saveState();
    renderCurrentQuestion();
  }

  function renderExplanationBox(q, userSelected) {
    explanationBox.style.display = 'block';

    const isCorrect = (userSelected === q.answer_letter);
    if (userSelected) {
      if (isCorrect) {
        answerStatusBadge.className = 'status-badge status-correct';
        answerStatusBadge.textContent = '🎉 答對了！';
      } else {
        answerStatusBadge.className = 'status-badge status-wrong';
        answerStatusBadge.textContent = `⚠️ 答錯了！您選了 [${userSelected}]`;
      }
    } else {
      answerStatusBadge.className = 'status-badge';
      answerStatusBadge.textContent = '參考解答';
    }

    correctAnswerText.textContent = `正確解答：${q.answer_text || q.answer_letter}`;
    explanationText.textContent = q.explanation || '無特別解析說明。';

    if (q.notes && q.notes.trim()) {
      notesBox.style.display = 'block';
      notesText.textContent = q.notes;
    } else {
      notesBox.style.display = 'none';
    }

    if (q.basis && q.basis.trim()) {
      basisTag.style.display = 'block';
      basisText.textContent = q.basis;
    } else {
      basisTag.style.display = 'none';
    }
  }

  // 7. Event Listeners for Practice
  btnPrev.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderCurrentQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  btnNext.addEventListener('click', () => {
    if (currentIndex < activeQueue.length - 1) {
      currentIndex++;
      renderCurrentQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  btnToggleExp.addEventListener('click', () => {
    if (explanationBox.style.display === 'none' || explanationBox.style.display === '') {
      const q = activeQueue[currentIndex];
      renderExplanationBox(q, state.answers[q.id]?.selected || null);
      btnToggleExp.textContent = '隱藏解析';
    } else {
      explanationBox.style.display = 'none';
      btnToggleExp.textContent = '💡 查看解析';
    }
  });

  btnStarCurrent.addEventListener('click', () => {
    const q = activeQueue[currentIndex];
    const idx = state.starred.indexOf(q.id);
    if (idx >= 0) {
      state.starred.splice(idx, 1);
      btnStarCurrent.classList.remove('starred');
      showToast('已取消收藏');
    } else {
      state.starred.push(q.id);
      btnStarCurrent.classList.add('starred');
      showToast('已加入收藏 ⭐');
    }
    saveState();
  });

  btnRemoveMistake.addEventListener('click', () => {
    const q = activeQueue[currentIndex];
    const idx = state.mistakes.indexOf(q.id);
    if (idx >= 0) {
      state.mistakes.splice(idx, 1);
      saveState();
      btnRemoveMistake.style.display = 'none';
      showToast('已從錯題本中移除！');
    }
  });

  // 8. Random Quiz Hub
  let selectedRandomCount = 10;
  document.querySelectorAll('.btn-preset-count').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-preset-count').forEach(b => b.classList.remove('active', 'btn-primary'));
      btn.classList.add('active', 'btn-primary');
      selectedRandomCount = parseInt(btn.dataset.count, 10);
    });
  });

  // Populate chapter select dropdown
  const selectRandomChapter = document.getElementById('selectRandomChapter');
  chapters.forEach((c, idx) => {
    const opt = document.createElement('option');
    opt.value = c.fullName;
    opt.textContent = `第 ${idx + 1} 單元｜${c.name}`;
    selectRandomChapter.appendChild(opt);
  });

  document.getElementById('btnStartRandomQuiz').addEventListener('click', () => {
    const selectedChapter = selectRandomChapter.value;
    const modeTypeInput = document.querySelector('input[name="randomModeType"]:checked');
    examModeType = modeTypeInput ? modeTypeInput.value : 'instant';

    let pool = [...rawQuestions];
    if (selectedChapter !== 'ALL') {
      pool = pool.filter(q => q.category === selectedChapter);
    }

    if (pool.length === 0) {
      alert('該章節目前無題目');
      return;
    }

    // Shuffle
    pool.sort(() => Math.random() - 0.5);
    activeQueue = pool.slice(0, Math.min(selectedRandomCount, pool.length));
    currentIndex = 0;
    currentMode = 'random';
    examAnswers = {};
    isExamSubmitted = false;

    // Show Exam Banner
    examModeBanner.style.display = 'block';
    examModeTitle.textContent = examModeType === 'exam' 
      ? `📝 模擬考進行中 (${activeQueue.length} 題)` 
      : `🎲 隨機測驗 (${activeQueue.length} 題)`;
    btnFinishExam.style.display = examModeType === 'exam' ? 'block' : 'none';

    switchView('practice');
    showToast(`隨機抽取 ${activeQueue.length} 題，測驗開始！`);
  });

  // Finish Exam Button
  btnFinishExam.addEventListener('click', () => {
    finishExam();
  });

  function finishExam() {
    isExamSubmitted = true;
    let score = 0;
    let wrongList = [];

    activeQueue.forEach(q => {
      const userChoice = examAnswers[q.id];
      const isCorrect = (userChoice === q.answer_letter);
      state.answers[q.id] = {
        selected: userChoice || '',
        isCorrect: isCorrect,
        time: Date.now()
      };
      if (isCorrect) {
        score++;
      } else {
        wrongList.push(q.id);
        if (!state.mistakes.includes(q.id)) {
          state.mistakes.push(q.id);
        }
      }
    });

    saveState();

    const percentage = Math.round((score / activeQueue.length) * 100);
    document.getElementById('examScoreText').textContent = `${percentage} 分 (${score} / ${activeQueue.length})`;
    document.getElementById('examDetailText').textContent = 
      `答對 ${score} 題，答錯 ${activeQueue.length - score} 題（已自動加入錯題本）`;

    const emojiEl = document.getElementById('examResultEmoji');
    if (percentage >= 80) emojiEl.textContent = '🎉 表現優異！';
    else if (percentage >= 60) emojiEl.textContent = '💪 掌握及格，繼續加油！';
    else emojiEl.textContent = '📚 加強複習，多刷錯題！';

    const btnReviewWrong = document.getElementById('btnReviewExamMistakes');
    if (wrongList.length > 0) {
      btnReviewWrong.style.display = 'inline-block';
      btnReviewWrong.onclick = () => {
        modalExamResult.style.display = 'none';
        startMistakesQuiz(wrongList);
      };
    } else {
      btnReviewWrong.style.display = 'none';
    }

    modalExamResult.style.display = 'flex';
    renderCurrentQuestion();
  }

  document.getElementById('btnCloseExamModal').addEventListener('click', () => {
    modalExamResult.style.display = 'none';
  });

  // 9. Mistakes Hub
  function renderMistakesHub() {
    const mContainer = document.getElementById('mistakesListContainer');
    document.getElementById('mistakesCountLabel').textContent = state.mistakes.length;
    mContainer.innerHTML = '';

    if (state.mistakes.length === 0) {
      mContainer.innerHTML = `
        <div style="text-align:center; padding:30px; color:var(--text-muted);">
          <div style="font-size:32px; margin-bottom:8px;">🎉</div>
          <div>目前沒有錯題！繼續保持！</div>
        </div>
      `;
      return;
    }

    state.mistakes.forEach(qId => {
      const q = questionsById[qId];
      if (!q) return;

      const item = document.createElement('div');
      item.className = 'cat-item';
      item.innerHTML = `
        <div class="cat-info">
          <div class="cat-title">第 ${q.id} 題：${q.question.slice(0, 48)}...</div>
          <div class="cat-count" style="color:var(--danger);">${q.category_name} ｜ 正確答案: ${q.answer}</div>
        </div>
        <button class="btn btn-secondary" style="font-size:12px; padding:6px 12px;">複習</button>
      `;

      item.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        activeQueue = [q];
        currentIndex = 0;
        currentMode = 'mistakes';
        examModeType = 'instant';
        examModeBanner.style.display = 'none';
        switchView('practice');
      });

      mContainer.appendChild(item);
    });
  }

  document.getElementById('btnStartMistakesQuiz').addEventListener('click', () => {
    if (state.mistakes.length === 0) {
      showToast('目前沒有錯題可練習！');
      return;
    }
    startMistakesQuiz(state.mistakes);
  });

  function startMistakesQuiz(qIds) {
    activeQueue = qIds.map(id => questionsById[id]).filter(Boolean);
    currentIndex = 0;
    currentMode = 'mistakes';
    examModeType = 'instant';
    examModeBanner.style.display = 'block';
    examModeTitle.textContent = `❌ 錯題本複習 (${activeQueue.length} 題)`;
    btnFinishExam.style.display = 'none';
    switchView('practice');
  }

  document.getElementById('btnClearMistakes').addEventListener('click', () => {
    if (confirm('確定要清空所有錯題記錄嗎？')) {
      state.mistakes = [];
      saveState();
      renderMistakesHub();
      showToast('錯題本已清空');
    }
  });

  // 10. Starred Hub
  function renderStarredHub() {
    const sContainer = document.getElementById('starredListContainer');
    sContainer.innerHTML = '';

    if (state.starred.length === 0) {
      sContainer.innerHTML = `
        <div style="text-align:center; padding:30px; color:var(--text-muted);">
          <div style="font-size:32px; margin-bottom:8px;">⭐</div>
          <div>目前沒有收藏題目。做題時點擊 ★ 即可加入收藏！</div>
        </div>
      `;
      return;
    }

    state.starred.forEach(qId => {
      const q = questionsById[qId];
      if (!q) return;

      const item = document.createElement('div');
      item.className = 'cat-item';
      item.innerHTML = `
        <div class="cat-info">
          <div class="cat-title">第 ${q.id} 題：${q.question.slice(0, 48)}...</div>
          <div class="cat-count" style="color:var(--warning);">${q.category_name}</div>
        </div>
        <button class="btn btn-secondary" style="font-size:12px; padding:6px 12px;">複習</button>
      `;

      item.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        activeQueue = [q];
        currentIndex = 0;
        currentMode = 'starred';
        examModeType = 'instant';
        examModeBanner.style.display = 'none';
        switchView('practice');
      });

      sContainer.appendChild(item);
    });
  }

  document.getElementById('btnStartStarredQuiz').addEventListener('click', () => {
    if (state.starred.length === 0) {
      showToast('目前沒有收藏題目！');
      return;
    }
    activeQueue = state.starred.map(id => questionsById[id]).filter(Boolean);
    currentIndex = 0;
    currentMode = 'starred';
    examModeType = 'instant';
    examModeBanner.style.display = 'block';
    examModeTitle.textContent = `⭐ 收藏題本複習 (${activeQueue.length} 題)`;
    btnFinishExam.style.display = 'none';
    switchView('practice');
  });

  // 11. Stats View
  function renderStats() {
    const answeredKeys = Object.keys(state.answers);
    const totalAnswered = answeredKeys.length;
    let correctCount = 0;
    answeredKeys.forEach(k => {
      if (state.answers[k].isCorrect) correctCount++;
    });

    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    document.getElementById('statAnswered').textContent = totalAnswered;
    document.getElementById('statAccuracy').textContent = `${accuracy}%`;
    document.getElementById('statMistakes').textContent = state.mistakes.length;
    document.getElementById('statStarred').textContent = state.starred.length;

    // Chapter breakdown
    const listEl = document.getElementById('chapterProgressList');
    listEl.innerHTML = '';

    chapters.forEach((ch, idx) => {
      const chQuestions = rawQuestions.filter(q => q.category === ch.fullName);
      const totalInCh = chQuestions.length;
      let chAnswered = 0;
      let chCorrect = 0;

      chQuestions.forEach(q => {
        const a = state.answers[q.id];
        if (a) {
          chAnswered++;
          if (a.isCorrect) chCorrect++;
        }
      });

      const chPct = totalInCh > 0 ? Math.round((chCorrect / totalInCh) * 100) : 0;

      const item = document.createElement('div');
      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:600; margin-bottom:4px;">
          <span>第 ${idx + 1} 章｜${ch.name} (${chCorrect}/${totalInCh} 題)</span>
          <span style="color:var(--primary);">${chPct}%</span>
        </div>
        <div style="background:var(--border); border-radius:10px; height:8px; overflow:hidden;">
          <div style="width:${chPct}%; background:var(--primary); height:100%; transition:width 0.3s;"></div>
        </div>
      `;
      listEl.appendChild(item);
    });
  }

  // 12. Backup & Restore
  document.getElementById('btnExportData').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `accp_quiz_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast('進度資料匯出成功！');
  });

  document.getElementById('inputImportData').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported && imported.answers) {
          state = imported;
          saveState();
          showToast('進度資料匯入成功！');
          renderStats();
          updateBadges();
        } else {
          alert('匯入格式不正確');
        }
      } catch (err) {
        alert('解析檔案失敗');
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('btnResetAll').addEventListener('click', () => {
    if (confirm('警告：確定要清空所有答題進度、錯題與收藏紀錄嗎？此操作無法撤銷。')) {
      state = {
        answers: {},
        mistakes: [],
        starred: [],
        theme: state.theme,
        lastVisitedId: 1
      };
      saveState();
      renderStats();
      renderCurrentQuestion();
      showToast('所有紀錄已重置！');
    }
  });

  // 13. Question Navigator Grid Modal (1~150)
  const qGridContainer = document.getElementById('questionGridContainer');
  function buildQuestionGrid() {
    qGridContainer.innerHTML = '';
    rawQuestions.forEach(q => {
      const btn = document.createElement('button');
      btn.className = 'grid-btn';
      btn.textContent = q.id;

      const ans = state.answers[q.id];
      if (ans) {
        btn.classList.add(ans.isCorrect ? 'correct' : 'wrong');
      }
      if (state.starred.includes(q.id)) {
        btn.classList.add('starred');
      }
      if (activeQueue[currentIndex] && activeQueue[currentIndex].id === q.id) {
        btn.classList.add('current');
      }

      btn.addEventListener('click', () => {
        activeQueue = [...rawQuestions];
        currentIndex = q.id - 1;
        currentMode = 'all';
        examModeBanner.style.display = 'none';
        modalGrid.style.display = 'none';
        switchView('practice');
      });

      qGridContainer.appendChild(btn);
    });
  }

  document.getElementById('btnGrid').addEventListener('click', () => {
    buildQuestionGrid();
    modalGrid.style.display = 'flex';
  });

  // 14. Search & Abbreviations Modal
  const searchInput = document.getElementById('searchInput');
  const searchResultsList = document.getElementById('searchResultsList');
  const searchResultCount = document.getElementById('searchResultCount');
  const abbrListPanel = document.getElementById('abbrListPanel');
  const searchFilterAll = document.getElementById('searchFilterAll');
  const searchFilterAbbr = document.getElementById('searchFilterAbbr');

  function renderAbbreviations() {
    abbrListPanel.innerHTML = '';
    const rawAbbr = referenceData.abbreviations || '';
    const lines = rawAbbr.split('\n').filter(l => l.includes('｜'));
    lines.forEach(l => {
      const parts = l.split('｜');
      const row = document.createElement('div');
      row.style.padding = '8px 0';
      row.style.borderBottom = '1px solid var(--border)';
      row.innerHTML = `<strong style="color:var(--primary); font-size:14px;">${parts[0].trim()}</strong> <span>${parts.slice(1).join('｜').trim()}</span>`;
      abbrListPanel.appendChild(row);
    });
  }

  searchFilterAll.addEventListener('click', () => {
    searchFilterAll.classList.add('active');
    searchFilterAbbr.classList.remove('active');
    searchResultsList.style.display = 'flex';
    abbrListPanel.style.display = 'none';
  });

  searchFilterAbbr.addEventListener('click', () => {
    searchFilterAbbr.classList.add('active');
    searchFilterAll.classList.remove('active');
    searchResultsList.style.display = 'none';
    abbrListPanel.style.display = 'block';
    if (!abbrListPanel.hasChildNodes()) renderAbbreviations();
  });

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    searchResultsList.innerHTML = '';

    if (!query) {
      searchResultCount.textContent = '0';
      searchResultsList.innerHTML = `
        <div style="text-align:center; padding:20px; color:var(--text-muted); font-size:13px;">
          請輸入關鍵字進行搜尋
        </div>
      `;
      return;
    }

    const matched = rawQuestions.filter(q => {
      return q.question.toLowerCase().includes(query) ||
             (q.shared_case && q.shared_case.toLowerCase().includes(query)) ||
             q.explanation.toLowerCase().includes(query) ||
             Object.values(q.options).some(o => o.toLowerCase().includes(query));
    });

    searchResultCount.textContent = matched.length;

    if (matched.length === 0) {
      searchResultsList.innerHTML = `
        <div style="text-align:center; padding:20px; color:var(--text-muted); font-size:13px;">
          查無符合「${query}」的題目
        </div>
      `;
      return;
    }

    matched.slice(0, 30).forEach(q => {
      const item = document.createElement('div');
      item.className = 'cat-item';
      item.innerHTML = `
        <div class="cat-info">
          <div class="cat-title">第 ${q.id} 題：${q.question.slice(0, 45)}...</div>
          <div class="cat-count">${q.category_name}</div>
        </div>
        <button class="btn btn-secondary" style="font-size:12px; padding:6px 12px;">查看</button>
      `;

      item.querySelector('button').addEventListener('click', () => {
        activeQueue = [...rawQuestions];
        currentIndex = q.id - 1;
        currentMode = 'all';
        examModeBanner.style.display = 'none';
        modalSearch.style.display = 'none';
        switchView('practice');
      });

      searchResultsList.appendChild(item);
    });
  });

  document.getElementById('btnSearch').addEventListener('click', () => {
    modalSearch.style.display = 'flex';
    searchInput.focus();
  });

  // Close modals on click
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      modalGrid.style.display = 'none';
      modalSearch.style.display = 'none';
      modalExamResult.style.display = 'none';
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target === modalGrid) modalGrid.style.display = 'none';
    if (e.target === modalSearch) modalSearch.style.display = 'none';
    if (e.target === modalExamResult) modalExamResult.style.display = 'none';
  });

  // 15. Theme Toggle
  const btnTheme = document.getElementById('btnTheme');
  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    btnTheme.textContent = theme === 'dark' ? '☀️' : '🌙';
    saveState();
  }

  btnTheme.addEventListener('click', () => {
    setTheme(state.theme === 'dark' ? 'light' : 'dark');
  });

  // 16. Keyboard Navigation
  window.addEventListener('keydown', (e) => {
    if (modalGrid.style.display === 'flex' || modalSearch.style.display === 'flex') return;
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') return;

    if (e.key === 'ArrowLeft') {
      btnPrev.click();
    } else if (e.key === 'ArrowRight') {
      btnNext.click();
    } else if (e.key === ' ' || e.key === 'e' || e.key === 'E') {
      btnToggleExp.click();
    } else if (['1', 'a', 'A'].includes(e.key)) {
      const q = activeQueue[currentIndex];
      if (q) handleOptionClick(q, 'A');
    } else if (['2', 'b', 'B'].includes(e.key)) {
      const q = activeQueue[currentIndex];
      if (q) handleOptionClick(q, 'B');
    } else if (['3', 'c', 'C'].includes(e.key)) {
      const q = activeQueue[currentIndex];
      if (q) handleOptionClick(q, 'C');
    } else if (['4', 'd', 'D'].includes(e.key)) {
      const q = activeQueue[currentIndex];
      if (q) handleOptionClick(q, 'D');
    }
  });

  // 17. Navigation Tab Click Handlers
  document.querySelectorAll('.tab-btn, .bottom-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      const mode = btn.dataset.mode;
      if (mode === 'all') {
        activeQueue = [...rawQuestions];
        currentMode = 'all';
        examModeType = 'instant';
        examModeBanner.style.display = 'none';
      }
      switchView(view);
    });
  });

  // 18. Service Worker Registration (for PWA)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('ServiceWorker registration optional', err);
      });
    });
  }

  // 19. Initial Boot
  loadState();
  setTheme(state.theme || 'light');
  updateBadges();

  // Resume from last visited question
  if (state.lastVisitedId && state.lastVisitedId >= 1 && state.lastVisitedId <= 150) {
    currentIndex = state.lastVisitedId - 1;
  }

  renderCurrentQuestion();
})();
