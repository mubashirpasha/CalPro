(function (global) {
  'use strict';
  var units = {
    length: { label: 'Length', items: { meter: ['Meter', 1], kilometer: ['Kilometer', 1000], centimeter: ['Centimeter', .01], millimeter: ['Millimeter', .001], mile: ['Mile', 1609.344], yard: ['Yard', .9144], foot: ['Foot', .3048], inch: ['Inch', .0254] } },
    weight: { label: 'Weight', items: { kilogram: ['Kilogram', 1], gram: ['Gram', .001], pound: ['Pound', .45359237], ounce: ['Ounce', .028349523125] } },
    temperature: { label: 'Temperature', items: { celsius: ['Celsius', 'celsius'], fahrenheit: ['Fahrenheit', 'fahrenheit'], kelvin: ['Kelvin', 'kelvin'] } },
    time: { label: 'Time', items: { seconds: ['Seconds', 1], minutes: ['Minutes', 60], hours: ['Hours', 3600], days: ['Days', 86400] } }
  };
  function convertTemperature(value, from, to) {
    var celsius = from === 'fahrenheit' ? (value - 32) * 5 / 9 : from === 'kelvin' ? value - 273.15 : value;
    return to === 'fahrenheit' ? celsius * 9 / 5 + 32 : to === 'kelvin' ? celsius + 273.15 : celsius;
  }
  function convertUnit(value, category, from, to) {
    var numeric = Number(value);
    if (!Number.isFinite(numeric)) throw new Error('Please enter a valid value');
    if (category === 'temperature') return convertTemperature(numeric, from, to);
    var catalog = units[category];
    if (!catalog || !catalog.items[from] || !catalog.items[to]) throw new Error('Please choose valid units');
    return numeric * catalog.items[from][1] / catalog.items[to][1];
  }
  function calculatePercentage(rate, value) {
    var a = Number(rate), b = Number(value);
    if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error('Please enter a valid value');
    return a / 100 * b;
  }
  function calculateTip(bill, rate, people) {
    var amount = Number(bill), percent = Number(rate), count = Number(people);
    if (!Number.isFinite(amount) || !Number.isFinite(percent) || !Number.isFinite(count) || amount < 0 || percent < 0 || count <= 0) throw new Error('Please enter valid values');
    var tip = amount * percent / 100;
    return { tip: tip, total: amount + tip, tipEach: tip / count, totalEach: (amount + tip) / count };
  }
  function calculateBMI(weight, height) {
    var kg = Number(weight), centimeters = Number(height);
    if (!Number.isFinite(kg) || !Number.isFinite(centimeters) || kg <= 0 || centimeters <= 0) throw new Error('Please enter valid values');
    var bmi = kg / Math.pow(centimeters / 100, 2);
    var category = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy range' : bmi < 30 ? 'Overweight' : 'Obesity range';
    return { value: bmi, category: category };
  }
  function calculateAge(birthText, asOfText) {
    if (!birthText || !asOfText) throw new Error('Please enter both dates');
    var birth = new Date(birthText + 'T12:00:00');
    var asOf = new Date(asOfText + 'T12:00:00');
    if (Number.isNaN(birth.getTime()) || Number.isNaN(asOf.getTime()) || birth > asOf) throw new Error('Please enter a valid date range');
    var years = asOf.getFullYear() - birth.getFullYear();
    var anniversary = new Date(birth);
    anniversary.setFullYear(birth.getFullYear() + years);
    if (anniversary > asOf) { years -= 1; anniversary = new Date(birth); anniversary.setFullYear(birth.getFullYear() + years); }
    var months = 0;
    var cursor = new Date(anniversary);
    while (true) { var next = new Date(cursor); next.setMonth(cursor.getMonth() + 1); if (next > asOf) break; months += 1; cursor = next; }
    var days = Math.floor((asOf - cursor) / 86400000);
    return { years: years, months: months, days: days };
  }
  global.CalcConverters = { units: units, convertUnit: convertUnit, calculatePercentage: calculatePercentage, calculateTip: calculateTip, calculateBMI: calculateBMI, calculateAge: calculateAge };
})(window);
