'use strict';

const Graph = require('../');

const g = new Graph(0, {
  maximize: 1000
});

const COUNT = 1e9;

const start = process.hrtime();
for (var i = 0; i < COUNT; i++)
  g.link(1, i + 2);
const delta = process.hrtime(start);

const ms = delta[0] + delta[1] * 1e-9;
console.log('%d', (COUNT / ms).toFixed(2));
