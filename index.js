'use strict';

const DEFAULT_MAX_DEPTH = 5;

function Link(from, to, depth) {
  this.from = from;
  this.to = to;
  this.depth = depth;
}

function Graph(root, options) {
  this.options = Object.assign({
    maxDepth: DEFAULT_MAX_DEPTH
  }, options);
  this.root = root;

  this.child = new Map();
  this.edges = [];
}
module.exports = Graph;

Graph.prototype._add = function _add(from, to, depth) {
  if (depth > this.options.maxDepth)
    return false;

  const update = this.child.has(from);

  this.child.set(from, new Link(from, to, depth));
  if (!this.options.maximize && !update)
    return true;

  const matches = [];
  for (let i = this.edges.length - 1; i >= 0; i--) {
    const link = this.edges[i];
    if (link.to !== from)
      continue;

    this.edges.splice(i, 1);
    matches.push(link);
  }

  // Add dangling grand edges if they are present
  for (let i = 0; i < matches.length; i++) {
    const link = matches[i];
    this.link(link.from, link.to);
  }

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

  if (this.options.maximize) {
    this.edges.unshift(new Link(from, to, -1));
    if (this.edges.length >= this.options.maximize)
      this.edges.pop();
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
