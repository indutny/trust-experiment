'use strict';

const binarySearch = require('binary-search');

const DEFAULT_MAX_DEPTH = 5;

function Link(from, to, depth) {
  this.from = from;
  this.to = to;
  this.depth = depth;
}

Link.compare = function compare(a, b) {
  return a.to - b.to;
};

Link.lookup = function lookup(a, needle) {
  return a.to - needle;
};

function Graph(root, options) {
  this.options = Object.assign({
    maxDepth: DEFAULT_MAX_DEPTH
  }, options);
  this.root = root;

  this.child = new Map();
  this.edges = [];

  this._maximizing = false;
}
module.exports = Graph;

Graph.prototype._add = function _add(from, to, depth) {
  if (depth > this.options.maxDepth)
    return false;

  const update = this.child.has(from);

  this.child.set(from, new Link(from, to, depth));
  if (!this.options.maximize && !update)
    return true;

  // Prevent recursion
  if (this._maximizing)
    return true;
  this._maximizing = true;

  const queue = [ from ];
  while (queue.length !== 0) {
    const inserted = queue.pop();

    const index = binarySearch(this.edges, inserted, Link.lookup);
    if (index < 0)
      continue;

    for (let i = index; i < this.edges.length; i++) {
      const link = this.edges[index];
      if (link.to !== inserted)
        break;

      if (!this._link(link.from, link.to))
        continue;

      this.edges.splice(i, 1);
      queue.push(link.from);
      break;
    }
  }

  this._maximizing = false;

  return true;
};

Graph.prototype._link = function _link(from, to) {
  // Case 0
  if (from === this.root)
    return false;

  // Case 1 and Case 2
  if (to === this.root)
    return this._add(from, to, 1);

  const target = this.child.get(to);

  // No dangling links
  if (!target)
    return false;

  const old = this.child.get(from);

  // Case 3
  if (!old)
    return this._add(from, to, target.depth + 1);

  // Case 4
  if (old.depth > target.depth + 1)
    return this._add(from, to, target.depth + 1);

  return false;
};

Graph.prototype.link = function link(from, to) {
  if (this._link(from, to))
    return;

  if (this.options.maximize && this.edges.length < this.options.maximize) {
    const dangling = new Link(from, to, -1);
    let index = binarySearch(this.edges, dangling, Link.compare);
    if (index < 0)
      index = -1 - index;
    this.edges.splice(index, 0, dangling);
  }
};

Graph.prototype.build = function build(from) {
  if (from === this.root)
    return [];
  if (!this.child.has(from))
    return false;

  const queue = [];
  let current = from;
  while (current !== this.root) {
    queue.push(current);
    current = this.child.get(current).to;
  }
  return queue;
};
