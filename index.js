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
  this._edges = new Map();
  this._edgeKeys = [];
  this._edgeCount = 0;

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

    const list = this._edges.get(inserted);
    if (!list)
      continue;

    for (let i = list.length - 1; i >= 0; i--) {
      const link = list[i];
      if (!this._link(link.from, link.to))
        continue;

      list.splice(i, 1);
      this._edgeCount--;

      queue.push(link.from);
    }

    if (list.length !== 0)
      continue;

    this._edges.delete(inserted);
    const index = this._edgeKeys.indexOf(inserted);
    if (index !== -1)
      this._edgeKeys.splice(index, 1);
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

  if (!this.options.maximize)
    return;

  // Can't have more links than limit
  if (this._edgeCount >= this.options.maximize) {
    // Throw away "random" edge
    const keys = this._edgeKeys;
    const index = (Math.random() * (keys.length + 1)) >>> 0;

    // With a chance to not throw away
    if (index >= keys.length)
      return;

    const key = keys[index];
    const list = this._edges.get(key);
    list.shift();
    if (list.length === 0) {
      this._edges.delete(key);
      this._edgeKeys.splice(index, 1);
    }
  }

  const dangling = new Link(from, to, -1);
  let list;
  if (this._edges.has(to)) {
    list = this._edges.get(to);
  } else {
    list = [];
    this._edges.set(to, list);
    this._edgeKeys.push(to);
  }

  list.push(dangling);
  this._edgeCount++;
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
