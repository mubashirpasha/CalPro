(function (global) {
  'use strict';
  function calcError(message) { var error = new Error(message); error.calcError = true; return error; }
  function tokenize(input) {
    var source = String(input || '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/√/g, 'sqrt');
    var tokens = [];
    var index = 0;
    while (index < source.length) {
      var char = source[index];
      if (/\s/.test(char)) { index += 1; continue; }
      var rest = source.slice(index);
      var numberMatch = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
      if (numberMatch) {
        if (tokens.length && tokens[tokens.length - 1].type === 'number') throw calcError('Invalid expression');
        tokens.push({ type: 'number', value: Number(numberMatch[0]) }); index += numberMatch[0].length; continue;
      }
      if (/[a-zA-Zπ]/.test(char)) {
        var nameMatch = rest.match(/^(?:[a-zA-Z]+|π)/);
        var name = nameMatch[0].toLowerCase();
        tokens.push({ type: 'name', value: name }); index += nameMatch[0].length; continue;
      }
      if ('+-*/^%!()'.indexOf(char) !== -1) { tokens.push({ type: 'operator', value: char }); index += 1; continue; }
      throw calcError('Invalid expression');
    }
    return tokens;
  }
  function evaluate(expression, angleMode) {
    if (!String(expression || '').trim()) throw calcError('Please enter a valid value');
    var tokens = tokenize(expression);
    var position = 0;
    function peek() { return tokens[position]; }
    function take(value) { if (peek() && peek().value === value) { position += 1; return true; } return false; }
    function ensure(value) {
      if (!Number.isFinite(value)) throw calcError('Result is too large');
      return value;
    }
    function implicitStart(token) { return token && (token.type === 'number' || token.type === 'name' || token.value === '('); }
    function parseExpression() {
      var value = parseTerm();
      while (peek() && (peek().value === '+' || peek().value === '-')) { var operator = peek().value; position += 1; var right = parseTerm(); value = ensure(operator === '+' ? value + right : value - right); }
      return value;
    }
    function parseTerm() {
      var value = parseUnary();
      while (peek() && (peek().value === '*' || peek().value === '/' || implicitStart(peek()))) {
        var operator = '*';
        if (peek().value === '*' || peek().value === '/') { operator = peek().value; position += 1; }
        var right = parseUnary();
        if (operator === '/' && right === 0) throw calcError('Cannot divide by zero');
        value = ensure(operator === '*' ? value * right : value / right);
      }
      return value;
    }
    function parsePower() {
      var value = parsePostfix();
      if (take('^')) { value = ensure(Math.pow(value, parseUnary())); }
      return value;
    }
    function parseUnary() {
      if (take('+')) return parseUnary();
      if (take('-')) return ensure(-parseUnary());
      return parsePower();
    }
    function parsePostfix() {
      var value = parsePrimary();
      while (peek() && (peek().value === '%' || peek().value === '!')) {
        var operator = peek().value; position += 1;
        if (operator === '%') value = ensure(value / 100);
        else value = ensure(global.CalcScientific.factorial(value));
      }
      return value;
    }
    function parsePrimary() {
      var token = peek();
      if (!token) throw calcError('Invalid expression');
      if (token.type === 'number') { position += 1; return ensure(token.value); }
      if (token.value === '(') { position += 1; var grouped = parseExpression(); if (!take(')')) throw calcError('Invalid expression'); return grouped; }
      if (token.type === 'name') {
        position += 1;
        if (token.value === 'pi' || token.value === 'π') return Math.PI;
        if (token.value === 'e') return Math.E;
        if (!take('(')) throw calcError('Invalid expression');
        var argument = parseExpression();
        if (!take(')')) throw calcError('Invalid expression');
        var fn = global.CalcScientific.functions[token.value];
        if (!fn) throw calcError('Unknown function');
        try { return ensure(fn(argument, angleMode)); } catch (error) { throw calcError(error.message || 'Invalid expression'); }
      }
      throw calcError('Invalid expression');
    }
    var result = ensure(parseExpression());
    if (position !== tokens.length) throw calcError('Invalid expression');
    return result;
  }
  function format(value) {
    if (!Number.isFinite(value)) return 'Error';
    if (Object.is(value, -0)) value = 0;
    var rounded = Math.abs(value) >= 1e12 || (Math.abs(value) > 0 && Math.abs(value) < 1e-8) ? value.toPrecision(10) : String(Number(value.toFixed(10)));
    return rounded.replace(/e\+?(-?)0+(\d+)/i, 'e$1$2');
  }
  global.CalcParser = { evaluate: evaluate, format: format };
})(window);
