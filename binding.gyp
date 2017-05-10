{
  "targets": [{
    "target_name": "graph",
    "include_dirs": [
      "src",
      "<!(node -e \"require('nan')\")",
    ],
    "sources": [
      "src/graph.cc",
    ],
  }],
}
