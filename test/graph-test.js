'use strict';

const assert = require('assert');

const Graph = require('../');

describe('Graph', () => {
  let g;
  beforeEach(() => {
    g = new Graph(0);
  });

  it('should build route to root', () => {
    assert.deepEqual(g.build(0), []);
  });

  it('should do case 0', () => {
    g.link(0, 1);
    assert.equal(g.build(1), false);
  });

  it('should do case 1', () => {
    g.link(1, 0);
    assert.deepEqual(g.build(1), [ 1 ]);
  });

  it('should do case 2', () => {
    g.link(1, 0);
    g.link(1, 2);
    assert.deepEqual(g.build(1), [ 1 ]);
  });

  it('should do case 3', () => {
    g.link(1, 0);
    g.link(2, 1);
    g.link(3, 1);
    assert.deepEqual(g.build(2), [ 2, 1 ]);
    assert.deepEqual(g.build(3), [ 3, 1 ]);
  });

  it('should do case 4', () => {
    // 0 - 1 - 2 - 3
    //  \         /
    //    -  4  -
    g.link(1, 0);
    g.link(2, 1);
    g.link(3, 2);
    g.link(4, 0);
    g.link(3, 4);

    assert.deepEqual(g.build(3), [ 3, 4 ]);
    assert.deepEqual(g.build(2), [ 2, 1 ]);
  });

  it('should do case 4 in reverse', () => {
    // 0 - 1 - 2 - 3
    //  \         /
    //    -  4  -
    g.link(4, 0);
    g.link(3, 4);

    g.link(1, 0);
    g.link(2, 1);
    g.link(3, 2);

    assert.deepEqual(g.build(3), [ 3, 4 ]);
    assert.deepEqual(g.build(2), [ 2, 1 ]);
  });

  it('should limit depth', () => {
    g.link(1, 0);
    g.link(2, 1);
    g.link(3, 2);
    g.link(4, 3);
    g.link(5, 4);
    g.link(6, 5);

    assert.equal(g.build(6), false);
    assert.deepEqual(g.build(5), [ 5, 4, 3, 2, 1 ]);
  });

  it('should build tree from dangling links', () => {
    const g = new Graph(0, { maximize: 5 });
    // 0 - 1 - 2 - 3
    g.link(2, 1);
    g.link(3, 2);
    g.link(5, 4);
    g.link(4, 3);
    g.link(1, 0);

    assert.deepEqual(g.build(3), [ 3, 2, 1 ]);
    assert.deepEqual(g.build(4), [ 4, 3, 2, 1 ]);
    assert.deepEqual(g.build(5), [ 5, 4, 3, 2, 1 ]);
  });

  it('should not build tree from dangling links when limit is reached', () => {
    const g = new Graph(0, { maximize: 1 });
    // 0 - 1 - 2 - 3
    g.link(2, 1);
    g.link(3, 2);
    g.link(1, 0);

    assert.equal(g.build(3), false);
    assert.deepEqual(g.build(2), [ 2, 1 ]);
  });
});
