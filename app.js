// app.js：渲染（分层布局 + 视口裁剪）
"use strict";

const { layout } = require("./layout.js");
const { cull, edgesInView } = require("./viewport.js");

function render(nodes, edges, view) {
  const graph = layout(nodes, edges);
  const shown = cull(graph.positions, view);
  const visibleEdges = edgesInView(edges, graph.positions, view);
  return { nodes: shown.visible, edges: visibleEdges, layers: graph.layers,
           positions: graph.positions };
}

module.exports = { render };
