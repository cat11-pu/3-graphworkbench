// app.js：渲染（基线：全量渲染 + 全量边）
"use strict";

const { layout, relayout, budget } = require("./layout.js");
const { cull, edgesInView } = require("./viewport.js");

function render(nodes, edges, view) {
  const graph = layout(nodes, edges);
  const shown = cull(graph.positions, view);
  const visibleEdges = edgesInView(edges, graph.positions, view);
  const cost = budget(nodes, edges);
  return { nodes: shown.visible, edges: visibleEdges, layers: graph.layers,
           visited: cost.visited, positions: graph.positions };
}

module.exports = { render };
