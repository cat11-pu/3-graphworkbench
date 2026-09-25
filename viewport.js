// viewport.js：视口裁剪（基线：全部元素都渲染）
"use strict";

function cull(positions, view) {
  // 基线：不做裁剪，原样返回
  const visible = Object.keys(positions).sort();
  return { visible: visible, visited: visible.length };
}

function edgesInView(edges, positions, view) {
  // 基线：所有边都返回
  return edges.map((edge) => edge.slice());
}

module.exports = { cull, edgesInView };
