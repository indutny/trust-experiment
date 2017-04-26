'use strict';

function Link(from, to, depth) {
  this.from = from;
  this.to = to;
  this.index = depth;
}

function Graph(root, options) {
  this.options = options || {};
  this.root = root;

  this.child = new Map();
  this.edges = new Map();
}
module.exports = Graph;

Graph.prototype._add = function _add(from, to, depth) {
  const update = this.child.has(from);

  this.child.set(from, new Link(from, to, depth));
  if (!this.options.maximize && !update)
    return;

  if (!this.edges.has(from))
    return;

  // Add dangling grand edges if they are present
  const edges = this.edges.get(from);
  for (let grand of edges.entries())
    this.addLink(grand, from);
};

Graph.prototype.addLink = function addLink(from, to) {
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
    return this._add(from, to, 0);

  const target = this.child.get(to);

  // No dangling links
  if (!target)
    return;

  const old = this.child.get(from);

  // Case 3
  if (!old)
    return this._add(from, to, old.depth + 1);

  // Case 4
  if (old.depth > target.depth + 1)
    return this._add(from, to, target.depth + 1);
};
