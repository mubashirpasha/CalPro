(function (global) {
  'use strict';
  var DEG = Math.PI / 180;
  function angle(value, mode) { return mode === 'DEG' ? value * DEG : value; }
  function fromAngle(value, mode) { return mode === 'DEG' ? value / DEG : value; }
  function factorial(value) {
    if (!Number.isFinite(value) || value < 0 || Math.floor(value) !== value) throw new Error('Factorial needs a whole number');
    if (value > 170) throw new Error('Number is too large');
    var result = 1;
    for (var i = 2; i <= value; i += 1) result *= i;
    return result;
  }
  var functions = {
    sin: function (x, mode) { return Math.sin(angle(x, mode)); },
    cos: function (x, mode) { return Math.cos(angle(x, mode)); },
    tan: function (x, mode) { return Math.tan(angle(x, mode)); },
    asin: function (x, mode) { return fromAngle(Math.asin(x), mode); },
    acos: function (x, mode) { return fromAngle(Math.acos(x), mode); },
    atan: function (x, mode) { return fromAngle(Math.atan(x), mode); },
    log: function (x) { if (x <= 0) throw new Error('Log needs a positive number'); return Math.log10(x); },
    ln: function (x) { if (x <= 0) throw new Error('Ln needs a positive number'); return Math.log(x); },
    sqrt: function (x) { if (x < 0) throw new Error('Square root needs a positive number'); return Math.sqrt(x); },
    abs: function (x) { return Math.abs(x); }
  };
  global.CalcScientific = { functions: functions, factorial: factorial };
})(window);
