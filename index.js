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
  this.edges = new Map();
}
module.exports = Graph;

Graph.prototype._add = function _add(from, to, depth) {
  if (depth > this.options.maxDepth)
    return;

  const update = this.child.has(from);

  this.child.set(from, new Link(from, to, depth));
  if (!this.options.maximize && !update)
    return;

  if (!this.edges.has(from))
    return;

  // Add dangling grand edges if they are present
  const edges = this.edges.get(from);
  for (let grand of edges.entries())
    this.link(grand, from);
};

Graph.prototype.link = function link(from, to) {
  if (this.options.maximize) {
    if (!this.edges.has(to))
      this.edges.set(to, new Set());
    this.edges.get(to).add(from);
  }

  // Case 0
  if (from === this.root)
    return;

  // Case 1 and Case 2
  if (to === this.root)
    return this._add(from, to, 1);

  const target = this.child.get(to);

  // No dangling links
  if (!target)
    return;

  const old = this.child.get(from);

  // Case 3
  if (!old)
    return this._add(from, to, target.depth + 1);

  // Case 4
  if (old.depth > target.depth + 1)
    return this._add(from, to, target.depth + 1);
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
