'use strict';

const Graph = require('../');

const g = new Graph(0, {
  maximize: 200000
});

const COUNT = 3e5;

const start = process.hrtime();
for (var i = 0; i < COUNT; i++)
  g.link(1, i + 2);
const delta = process.hrtime(start);

const ms = delta[0] + delta[1] * 1e-9;
console.log('%d', (COUNT / ms).toFixed(2));
