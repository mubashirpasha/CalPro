(function (global) {
  'use strict';
  var memory = Object.create(null);
  var available = false;
  try {
    var probe = '__calcpro_probe__';
    global.localStorage.setItem(probe, '1');
    global.localStorage.removeItem(probe);
    available = true;
  } catch (error) {
    available = false;
  }
  function get(key, fallback) {
    try {
      var value = available ? global.localStorage.getItem(key) : memory[key];
      return value === null || value === undefined ? fallback : value;
    } catch (error) {
      return memory[key] === undefined ? fallback : memory[key];
    }
  }
  function set(key, value) {
    try {
      if (available) global.localStorage.setItem(key, value);
      else memory[key] = value;
      return true;
    } catch (error) {
      memory[key] = value;
      return false;
    }
  }
  function remove(key) {
    try {
      if (available) global.localStorage.removeItem(key);
      delete memory[key];
    } catch (error) {
      delete memory[key];
    }
  }
  function getJSON(key, fallback) {
    try { return JSON.parse(get(key, JSON.stringify(fallback))); } catch (error) { return fallback; }
  }
  function setJSON(key, value) { return set(key, JSON.stringify(value)); }
  global.CalcStorage = { available: available, get: get, set: set, remove: remove, getJSON: getJSON, setJSON: setJSON };
})(window);
