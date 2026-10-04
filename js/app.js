(function () {
  'use strict';
  var storage = window.CalcStorage;
  var parser = window.CalcParser;
  var converters = window.CalcConverters;
  var state = {
    mode: storage.get('calcpro-mode', 'standard'),
    theme: storage.get('calcpro-theme', 'dark'),
    angleMode: storage.get('calcpro-angle', 'DEG'),
    expression: '',
    lastExpression: '',
    result: '0',
    error: '',
    history: storage.getJSON('calcpro-history', [])
  };
  var modeLabels = { standard: 'Standard calculator', scientific: 'Scientific calculator', percentage: 'Percentage calculator', tip: 'Tip calculator', bmi: 'BMI calculator', age: 'Age calculator', unit: 'Unit converter' };
  var view = document.getElementById('calculatorView');
  var modeSelect = document.getElementById('modeSelect');
  var themeToggle = document.getElementById('themeToggle');
  var themeIcon = document.getElementById('themeIcon');
  var historyPanel = document.getElementById('historyPanel');
  var historyList = document.getElementById('historyList');
  var historyEmpty = document.getElementById('historyEmpty');
  var historyCount = document.getElementById('historyCount');
  var historyToggle = document.getElementById('historyToggle');
  var toast = document.getElementById('toast');
  var toastTimer;
  if (!modeLabels[state.mode]) state.mode = 'standard';
  if (state.theme !== 'light' && state.theme !== 'dark') state.theme = 'dark';
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    themeIcon.textContent = state.theme === 'dark' ? '☼' : '☾';
    themeToggle.setAttribute('aria-label', state.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  function saveState() {
    storage.set('calcpro-mode', state.mode); storage.set('calcpro-theme', state.theme); storage.set('calcpro-angle', state.angleMode); storage.setJSON('calcpro-history', state.history.slice(0, 40));
  }
  function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200); }
  function displayNumber(value) { return parser.format(Number(value)); }
  function render() {
    document.getElementById('workspaceTitle').textContent = modeLabels[state.mode];
    modeSelect.value = state.mode;
    if (state.mode === 'standard' || state.mode === 'scientific') renderCalculator();
    else if (state.mode === 'percentage') renderPercentage();
    else if (state.mode === 'tip') renderTip();
    else if (state.mode === 'bmi') renderBMI();
    else if (state.mode === 'age') renderAge();
    else renderUnit();
    renderHistory();
  }
  function renderCalculator() {
    var scientific = state.mode === 'scientific';
    var keys = scientific ? [
      ['sin(', 'function'], ['cos(', 'function'], ['tan(', 'function'], ['asin(', 'function'], ['acos(', 'function'],
      ['atan(', 'function'], ['log(', 'function'], ['ln(', 'function'], ['sqrt(', 'function'], ['^2', 'function'],
      ['π', 'function'], ['e', 'function'], ['!', 'function'], ['(', 'operator'], [')', 'operator'],
      ['AC', 'utility'], ['DEL', 'utility'], ['%', 'operator'], ['÷', 'operator'],
      ['7', ''], ['8', ''], ['9', ''], ['×', 'operator'], ['4', ''], ['5', ''], ['6', ''], ['−', 'operator'],
      ['1', ''], ['2', ''], ['3', ''], ['+', 'operator'], ['0', 'zero'], ['.', ''], ['xʸ', 'function'], ['=', 'equals']
    ] : [
      ['AC', 'utility'], ['DEL', 'utility'], ['(', 'operator'], [')', 'operator'],
      ['7', ''], ['8', ''], ['9', ''], ['÷', 'operator'], ['4', ''], ['5', ''], ['6', ''], ['×', 'operator'],
      ['1', ''], ['2', ''], ['3', ''], ['−', 'operator'], ['±', 'utility'], ['0', 'zero'], ['.', ''], ['+', 'operator'],
      ['%', 'operator'], ['x²', 'function'], ['π', 'function'], ['=', 'equals']
    ];
    var keyHtml = keys.map(function (item) { var label = item[0]; var key = label === 'AC' ? 'clear' : label === 'DEL' ? 'backspace' : label === '±' ? 'plusminus' : label === '=' ? 'equals' : label; return '<button type="button" class="key ' + item[1] + '" data-key="' + key.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '" aria-label="' + label + '">' + label + '</button>'; }).join('');
    view.innerHTML = '<div class="calc-card"><div class="calc-main"><div class="display-card" aria-live="polite"><div class="display-expression" id="displayExpression">Ready when you are</div><div class="display-value" id="displayValue">0</div></div><div class="calc-toolbar">' + (scientific ? '<div class="angle-toggle" role="group" aria-label="Angle mode"><button type="button" data-angle="DEG">DEG</button><button type="button" data-angle="RAD">RAD</button></div>' : '<span class="calc-hint">Keyboard ready · Try 2 + 2</span>') + '<span class="calc-hint">' + (scientific ? 'Functions evaluate safely in-browser' : 'Your work stays on this device') + '</span></div><div class="keypad ' + (scientific ? 'scientific-keypad' : '') + '">' + keyHtml + '</div></div><aside class="scientific-panel"><span class="section-kicker">' + (scientific ? 'SCIENTIFIC MODE' : 'STANDARD MODE') + '</span><h3>' + (scientific ? 'More range, same calm.' : 'Simple by design.') + '</h3><p>' + (scientific ? 'Trigonometry, logarithms, powers and constants, with a quick DEG/RAD switch.' : 'A focused keypad for the calculations you make every day.') + '</p><div class="quick-facts"><div class="fact"><span>Parser</span><strong>Safe</strong></div><div class="fact"><span>History</span><strong>Local</strong></div><div class="fact"><span>Mode</span><strong>' + (scientific ? 'DEG / RAD' : 'Standard') + '</strong></div></div></aside></div>';
    updateCalculatorDisplay();
    if (scientific) updateAngleButtons();
  }
  function updateCalculatorDisplay() {
    var expressionEl = document.getElementById('displayExpression'); var valueEl = document.getElementById('displayValue');
    if (!expressionEl || !valueEl) return;
    expressionEl.textContent = state.lastExpression || (state.expression ? 'Current expression' : 'Ready when you are');
    valueEl.textContent = state.error || state.expression || state.result || '0';
    valueEl.classList.toggle('error', Boolean(state.error));
    valueEl.scrollLeft = valueEl.scrollWidth;
  }
  function updateAngleButtons() { document.querySelectorAll('[data-angle]').forEach(function (button) { button.classList.toggle('active', button.getAttribute('data-angle') === state.angleMode); }); }
  function renderModeCard(kicker, title, description, symbol, form) { view.innerHTML = '<div class="mode-card"><div class="mode-card-header"><div><span class="section-kicker">' + kicker + '</span><h3>' + title + '</h3><p>' + description + '</p></div><span class="mode-symbol" aria-hidden="true">' + symbol + '</span></div>' + form + '</div>'; }
  function renderPercentage() {
    renderModeCard('QUICK MATH', 'Percentage, made clear.', 'Find a percentage of a value in one focused step.', '%', '<div class="form-layout"><form class="form-panel" data-form="percentage"><div class="field-grid"><div class="field"><label for="percentageRate">Percentage</label><input id="percentageRate" type="number" inputmode="decimal" step="any" placeholder="15" required></div><div class="field"><label for="percentageValue">Of value</label><input id="percentageValue" type="number" inputmode="decimal" step="any" placeholder="240" required></div></div><button class="primary-action" type="submit">Calculate percentage <span aria-hidden="true">→</span></button></form><div class="result-panel"><div><span class="result-label">Result</span><div id="formResult" class="form-result" role="status" aria-live="polite">—</div><p id="formDetail" class="result-detail" aria-live="polite">Enter two values to see the result.</p></div><span class="result-mark" aria-hidden="true">∿</span></div></div>');
  }
  function renderTip() { renderModeCard('EVERYDAY DECISIONS', 'Split the good stuff.', 'Work out a tip, total, and per-person share without mental math.', '✦', '<div class="form-layout"><form class="form-panel" data-form="tip"><div class="field-grid"><div class="field"><label for="tipBill">Bill amount</label><input id="tipBill" type="number" inputmode="decimal" min="0" step="any" placeholder="86.50" required></div><div class="field"><label for="tipRate">Tip percentage</label><input id="tipRate" type="number" inputmode="decimal" min="0" step="any" placeholder="18" required></div><div class="field full"><label for="tipPeople">People splitting</label><input id="tipPeople" type="number" inputmode="numeric" min="1" step="1" value="1" required></div></div><button class="primary-action" type="submit">Calculate tip <span aria-hidden="true">→</span></button></form><div class="result-panel"><div><span class="result-label">Your total</span><div id="formResult" class="form-result" role="status" aria-live="polite">—</div><p id="formDetail" class="result-detail" aria-live="polite">Tip and per-person totals will appear here.</p></div><span class="result-mark" aria-hidden="true">⌁</span></div></div>'); }
  function renderBMI() { renderModeCard('WELLNESS SNAPSHOT', 'A better baseline.', 'Calculate BMI from metric height and weight. Use it as a starting point, not a diagnosis.', '◒', '<div class="form-layout"><form class="form-panel" data-form="bmi"><div class="field-grid"><div class="field"><label for="bmiWeight">Weight (kg)</label><input id="bmiWeight" type="number" inputmode="decimal" min="0" step="any" placeholder="68" required></div><div class="field"><label for="bmiHeight">Height (cm)</label><input id="bmiHeight" type="number" inputmode="decimal" min="0" step="any" placeholder="172" required></div></div><button class="primary-action" type="submit">Calculate BMI <span aria-hidden="true">→</span></button></form><div class="result-panel"><div><span class="result-label">BMI score</span><div id="formResult" class="form-result" role="status" aria-live="polite">—</div><p id="formDetail" class="result-detail" aria-live="polite">Enter height and weight for a snapshot.</p></div><span class="result-mark" aria-hidden="true">◌</span></div></div>'); }
  function renderAge() { var today = new Date().toISOString().slice(0, 10); renderModeCard('LIFE MILESTONES', 'Time, in perspective.', 'See your exact age in years, months, and days as of any date.', '◷', '<div class="form-layout"><form class="form-panel" data-form="age"><div class="field-grid"><div class="field"><label for="birthDate">Date of birth</label><input id="birthDate" type="date" max="' + today + '" required></div><div class="field"><label for="asOfDate">Calculate as of</label><input id="asOfDate" type="date" value="' + today + '" required></div></div><button class="primary-action" type="submit">Calculate age <span aria-hidden="true">→</span></button></form><div class="result-panel"><div><span class="result-label">Your age</span><div id="formResult" class="form-result small" role="status" aria-live="polite">—</div><p id="formDetail" class="result-detail" aria-live="polite">Choose your dates to see the result.</p></div><span class="result-mark" aria-hidden="true">◒</span></div></div>'); }
  function renderUnit() { var categories = Object.keys(converters.units).map(function (key) { return '<option value="' + key + '">' + converters.units[key].label + '</option>'; }).join(''); renderModeCard('CONVERT WITH CONFIDENCE', 'Make units make sense.', 'Convert length, weight, temperature, and time with accurate browser-side formulas.', '⇄', '<div class="form-layout"><div class="form-panel"><div class="field"><label for="unitCategory">Category</label><select id="unitCategory">' + categories + '</select></div><div class="converter-grid"><div class="field"><label for="unitAmount">Value</label><input id="unitAmount" type="number" inputmode="decimal" step="any" value="1"></div><div class="unit-switch" aria-hidden="true">↔</div><div class="field"><label for="unitResultValue">Converted value</label><input id="unitResultValue" type="text" readonly value="1"></div></div><div class="converter-grid"><div class="field"><label for="unitFrom">From</label><select id="unitFrom"></select></div><div></div><div class="field"><label for="unitTo">To</label><select id="unitTo"></select></div></div><button class="primary-action" id="saveUnit" type="button">Save conversion <span aria-hidden="true">→</span></button></div><div class="result-panel"><div><span class="result-label">Conversion</span><div id="formResult" class="form-result small" role="status" aria-live="polite">1</div><p id="formDetail" class="result-detail" aria-live="polite">Choose a category and units.</p></div><span class="result-mark" aria-hidden="true">⇢</span></div></div>'); populateUnitSelects(); updateUnitResult(); }
  function populateUnitSelects() { var category = document.getElementById('unitCategory'); if (!category) return; var data = converters.units[category.value]; var from = document.getElementById('unitFrom'); var to = document.getElementById('unitTo'); from.innerHTML = ''; to.innerHTML = ''; Object.keys(data.items).forEach(function (key, index) { var optionA = new Option(data.items[key][0], key); var optionB = new Option(data.items[key][0], key); if (index === 0) optionB.selected = false; if (index === 1) optionB.selected = true; from.add(optionA); to.add(optionB); }); }
  function updateUnitResult() { var category = document.getElementById('unitCategory'); var amount = document.getElementById('unitAmount'); var from = document.getElementById('unitFrom'); var to = document.getElementById('unitTo'); if (!category || !from || !to) return; var result = document.getElementById('formResult'); var resultInput = document.getElementById('unitResultValue'); var detail = document.getElementById('formDetail'); try { var value = converters.convertUnit(amount.value, category.value, from.value, to.value); var formatted = displayNumber(value); result.textContent = formatted; resultInput.value = formatted; detail.textContent = from.options[from.selectedIndex].text + ' → ' + to.options[to.selectedIndex].text; } catch (error) { result.textContent = '—'; resultInput.value = ''; detail.textContent = error.message; detail.classList.add('error-note'); return; } detail.classList.remove('error-note'); }
  function clearCalculator() { state.expression = ''; state.lastExpression = ''; state.result = '0'; state.error = ''; }
  function appendInput(key) { if (state.error) clearCalculator(); var expression = state.expression; var operators = '+×÷'; if (key === 'sqrt(' || /^(sin|cos|tan|asin|acos|atan|log|ln)\($/.test(key)) { if (expression && /[\dπe)]$/.test(expression)) expression += '×'; state.expression = expression + key; }
    else if (key === 'π' || key === 'e') { if (expression && /[\dπe)]$/.test(expression)) expression += '×'; state.expression = expression + key; }
    else if (key === '^2') state.expression = expression + '^2';
    else if (key === '^') state.expression = expression + '^';
    else if (key === '!') state.expression = expression + '!';
    else if (key === '(') { if (expression && /[\dπe)]$/.test(expression)) expression += '×'; state.expression = expression + '('; }
    else if (key === ')') state.expression = expression + ')';
    else if (key === '.') state.expression = expression + (expression && /\d$/.test(expression) ? '.' : '0.');
    else if (operators.indexOf(key) !== -1) { if (!expression && key !== '−') state.expression = key === '−' ? '−' : ''; else if (/[+×÷]$/.test(expression) && key !== '−') state.expression = expression.slice(0, -1) + key; else state.expression = expression + key; }
    else state.expression = expression + key;
    state.lastExpression = ''; state.result = state.expression || '0';
  }
  function toggleSign() { if (!state.expression) { state.expression = '−'; return; } if (/^−/.test(state.expression)) state.expression = state.expression.slice(1); else if (/^[\d.]+$/.test(state.expression)) state.expression = '−' + state.expression; else state.expression = '−(' + state.expression + ')'; state.result = state.expression; }
  function evaluateExpression() { if (!state.expression) { state.error = 'Please enter a valid value'; render(); return; } try { var original = state.expression; var value = parser.evaluate(original, state.angleMode); var result = parser.format(value); state.lastExpression = original; state.expression = result; state.result = result; state.error = ''; addHistory(original, result, state.mode); } catch (error) { state.error = error.message || 'Invalid expression'; state.result = ''; } render(); }
  function handleKey(key) { if (key === 'clear') clearCalculator(); else if (key === 'backspace') { if (state.error) clearCalculator(); else state.expression = state.expression.slice(0, -1); state.result = state.expression || '0'; } else if (key === 'plusminus') toggleSign(); else if (key === 'equals') { evaluateExpression(); return; } else appendInput(key); render(); }
  function addHistory(expression, result, mode, data) { state.history.unshift({ id: String(Date.now()) + Math.random().toString(16).slice(2), expression: expression, result: result, mode: modeLabels[mode] || mode, modeKey: mode, data: data || null, timestamp: Date.now() }); state.history = state.history.slice(0, 40); saveState(); }
  function renderHistory() {
    historyList.innerHTML = '';
    var items = state.history;
    historyCount.textContent = items.length + (items.length === 1 ? ' calculation' : ' calculations');
    historyEmpty.hidden = items.length > 0;
    items.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'history-item';
      var reuse = document.createElement('button');
      reuse.className = 'history-item-main';
      reuse.type = 'button';
      reuse.dataset.historyId = item.id;
      reuse.setAttribute('aria-label', 'Reuse calculation ' + item.expression);
      var expression = document.createElement('div');
      expression.className = 'history-item-expression';
      expression.textContent = item.expression;
      var result = document.createElement('div');
      result.className = 'history-item-result';
      result.textContent = item.result;
      var meta = document.createElement('div');
      meta.className = 'history-item-meta';
      var metaMode = document.createElement('span');
      metaMode.textContent = item.mode || 'Calculator';
      var metaDate = document.createElement('span');
      metaDate.textContent = new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      meta.appendChild(metaMode);
      meta.appendChild(metaDate);
      reuse.appendChild(expression);
      reuse.appendChild(result);
      reuse.appendChild(meta);
      var del = document.createElement('button');
      del.className = 'delete-history';
      del.type = 'button';
      del.dataset.deleteHistory = item.id;
      del.setAttribute('aria-label', 'Delete calculation ' + item.expression);
      del.textContent = '×';
      card.appendChild(reuse);
      card.appendChild(del);
      historyList.appendChild(card);
    });
  }
  function reuseHistory(id) {
    var item = state.history.find(function (entry) { return entry.id === id; });
    if (!item) return;
    var mode = item.modeKey;
    if (!mode) mode = item.mode === modeLabels.scientific ? 'scientific' : item.mode === modeLabels.standard ? 'standard' : 'standard';
    state.mode = mode;
    if (mode === 'standard' || mode === 'scientific') {
      state.expression = item.expression;
      state.lastExpression = '';
      state.error = '';
      state.result = item.result;
      saveState();
      render();
    } else {
      clearCalculator();
      state.result = item.result;
      saveState();
      render();
      var data = item.data || {};
      if (mode === 'unit') {
        var category = document.getElementById('unitCategory');
        var amount = document.getElementById('unitAmount');
        var from = document.getElementById('unitFrom');
        var to = document.getElementById('unitTo');
        if (category && data.category) category.value = data.category;
        populateUnitSelects();
        if (amount && data.amount !== undefined) amount.value = data.amount;
        if (from && data.from) from.value = data.from;
        if (to && data.to) to.value = data.to;
        updateUnitResult();
      } else {
        var form = document.querySelector('form[data-form="' + mode + '"]');
        if (form) {
          if (mode === 'percentage') { document.getElementById('percentageRate').value = data.rate || ''; document.getElementById('percentageValue').value = data.value || ''; }
          if (mode === 'tip') { document.getElementById('tipBill').value = data.bill || ''; document.getElementById('tipRate').value = data.rate || ''; document.getElementById('tipPeople').value = data.people || '1'; }
          if (mode === 'bmi') { document.getElementById('bmiWeight').value = data.weight || ''; document.getElementById('bmiHeight').value = data.height || ''; }
          if (mode === 'age') { document.getElementById('birthDate').value = data.birth || ''; document.getElementById('asOfDate').value = data.asOf || ''; }
          handleForm(form, false);
        }
      }
    }
    closeHistory();
    showToast('Calculation ready to reuse');
  }
  function syncHistoryA11y() {
    var mobile = window.matchMedia('(max-width: 680px)').matches;
    var open = historyPanel.classList.contains('is-open');
    historyPanel.setAttribute('aria-hidden', mobile && !open ? 'true' : 'false');
    historyToggle.setAttribute('aria-expanded', mobile ? String(open) : 'true');
  }
  function closeHistory() { historyPanel.classList.remove('is-open'); syncHistoryA11y(); }
  function openHistory() { historyPanel.classList.add('is-open'); syncHistoryA11y(); }
  function formResult(result, detail, isError) { var output = document.getElementById('formResult'); var note = document.getElementById('formDetail'); if (!output || !note) return; output.textContent = result; note.textContent = detail; note.classList.toggle('error-note', Boolean(isError)); }
  function saveUnitHistory() {
    var category = document.getElementById('unitCategory');
    var amount = document.getElementById('unitAmount');
    var from = document.getElementById('unitFrom');
    var to = document.getElementById('unitTo');
    try {
      var value = converters.convertUnit(amount.value, category.value, from.value, to.value);
      var result = displayNumber(value);
      var expression = amount.value + ' ' + from.options[from.selectedIndex].text + ' → ' + to.options[to.selectedIndex].text;
      addHistory(expression, result, 'unit', { type: 'unit', category: category.value, amount: amount.value, from: from.value, to: to.value });
      renderHistory();
      showToast('Conversion added to history');
    } catch (error) {
      formResult('—', error.message || 'Please enter a valid value', true);
    }
  }
  function handleForm(form, recordHistory) {
    var type = form.dataset.form;
    try {
      if (type === 'percentage') {
        var rate = document.getElementById('percentageRate').value;
        var value = document.getElementById('percentageValue').value;
        var percentage = converters.calculatePercentage(rate, value);
        var pResult = displayNumber(percentage);
        formResult(pResult, rate + '% of ' + value + (recordHistory === false ? '' : ' · saved to history'));
        if (recordHistory !== false) addHistory(rate + '% of ' + value, pResult, 'percentage', { type: 'percentage', rate: rate, value: value });
      }
      if (type === 'tip') {
        var bill = document.getElementById('tipBill').value;
        var tipRate = document.getElementById('tipRate').value;
        var people = document.getElementById('tipPeople').value;
        var tip = converters.calculateTip(bill, tipRate, people);
        var tipResult = displayNumber(tip.total);
        formResult(tipResult, 'Tip ' + displayNumber(tip.tip) + ' · ' + displayNumber(tip.totalEach) + ' per person');
        if (recordHistory !== false) addHistory('Tip on ' + bill, tipResult, 'tip', { type: 'tip', bill: bill, rate: tipRate, people: people });
      }
      if (type === 'bmi') {
        var weight = document.getElementById('bmiWeight').value;
        var height = document.getElementById('bmiHeight').value;
        var bmi = converters.calculateBMI(weight, height);
        var bmiResult = displayNumber(bmi.value);
        formResult(bmiResult, bmi.category);
        if (recordHistory !== false) addHistory('BMI · ' + weight + 'kg / ' + height + 'cm', bmiResult, 'bmi', { type: 'bmi', weight: weight, height: height });
      }
      if (type === 'age') {
        var birth = document.getElementById('birthDate').value;
        var asOf = document.getElementById('asOfDate').value;
        var age = converters.calculateAge(birth, asOf);
        var ageResult = age.years + 'y ' + age.months + 'm ' + age.days + 'd';
        formResult(ageResult, 'Completed calendar years, months, and days');
        if (recordHistory !== false) addHistory('Age from ' + birth, ageResult, 'age', { type: 'age', birth: birth, asOf: asOf });
      }
      saveState();
      renderHistory();
      if (recordHistory !== false) showToast('Result added to history');
    } catch (error) {
      formResult('—', error.message || 'Please enter a valid value', true);
    }
  }
  view.addEventListener('click', function (event) { var key = event.target.closest('[data-key]'); if (key) { handleKey(key.dataset.key); return; } var angle = event.target.closest('[data-angle]'); if (angle) { state.angleMode = angle.dataset.angle; saveState(); updateAngleButtons(); return; } if (event.target.closest('#saveUnit')) { saveUnitHistory(); return; } });
  view.addEventListener('submit', function (event) { event.preventDefault(); handleForm(event.target); });
  view.addEventListener('input', function (event) { if (event.target.id === 'unitAmount') updateUnitResult(); });
  view.addEventListener('change', function (event) { if (event.target.id === 'unitCategory') { populateUnitSelects(); updateUnitResult(); } if (event.target.id === 'unitFrom' || event.target.id === 'unitTo') updateUnitResult(); });
  document.addEventListener('keydown', function (event) { var tag = event.target.tagName.toLowerCase(); if (tag === 'input' || tag === 'select' || tag === 'textarea') return; if (state.mode !== 'standard' && state.mode !== 'scientific') return; var map = { '*': '×', '/': '÷', '-': '−', '+': '+', '.': '.', '%': '%', '(': '(', ')': ')' }; if (/^\d$/.test(event.key)) { event.preventDefault(); handleKey(event.key); } else if (map[event.key]) { event.preventDefault(); handleKey(map[event.key]); } else if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); handleKey('equals'); } else if (event.key === 'Backspace') { event.preventDefault(); handleKey('backspace'); } else if (event.key === 'Escape') { event.preventDefault(); handleKey('clear'); } });
  modeSelect.addEventListener('change', function () { state.mode = modeSelect.value; clearCalculator(); saveState(); render(); });
  themeToggle.addEventListener('click', function () { state.theme = state.theme === 'dark' ? 'light' : 'dark'; applyTheme(); saveState(); showToast(state.theme === 'dark' ? 'Dark theme on' : 'Light theme on'); });
  document.getElementById('historyToggle').addEventListener('click', function () { if (historyPanel.classList.contains('is-open')) closeHistory(); else openHistory(); });
  document.getElementById('closeHistory').addEventListener('click', closeHistory);
  document.getElementById('clearHistory').addEventListener('click', function () { if (!state.history.length) return; state.history = []; saveState(); renderHistory(); showToast('History cleared'); });
  historyList.addEventListener('click', function (event) { var del = event.target.closest('[data-delete-history]'); if (del) { event.stopPropagation(); state.history = state.history.filter(function (item) { return item.id !== del.dataset.deleteHistory; }); saveState(); renderHistory(); return; } var card = event.target.closest('[data-history-id]'); if (card) reuseHistory(card.dataset.historyId); });
  historyList.addEventListener('keydown', function (event) { if (event.target.closest('[data-delete-history]')) return; if ((event.key === 'Enter' || event.key === ' ') && event.target.closest('[data-history-id]')) { event.preventDefault(); reuseHistory(event.target.closest('[data-history-id]').dataset.historyId); } });
  window.addEventListener('resize', syncHistoryA11y);
  applyTheme(); render(); syncHistoryA11y();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('service-worker.js').catch(function () {});
})();
