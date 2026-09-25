// viewport.js：视口裁剪（只返回视口高度内的节点与两端都可见的边）
"use strict";

function viewHeight(view) {
  return view && typeof view.height === "number" ? view.height : Infinity;
}

// 只返回视口高度内可见的节点（层号 < 视口高度），按名字升序。
// visited 只统计可见层内的节点，视口外的节点不计入。
function cull(positions, view) {
  const height = viewHeight(view);
  const byLayer = new Map();
  for (const name of Object.keys(positions)) {
    const layer = positions[name].layer;
    if (!byLayer.has(layer)) byLayer.set(layer, []);
    byLayer.get(layer).push(name);
  }
  const visible = [];
  let visited = 0;
  for (const entry of byLayer) {
    if (entry[0] < height) {
      visited += entry[1].length;
      for (const name of entry[1]) visible.push(name);
    }
  }
  visible.sort();
  return { visible: visible, visited: visited };
}

// 只返回两端都在可见层内的边。
function edgesInView(edges, positions, view) {
  const height = viewHeight(view);
  const visible = [];
  for (const edge of edges) {
    const from = positions[edge[0]];
    const to = positions[edge[1]];
    if (from && to && from.layer < height && to.layer < height) {
      visible.push(edge.slice());
    }
  }
  return visible;
}

module.exports = { cull, edgesInView };
