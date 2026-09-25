// layout.js：分层布局（基线：所有节点放在同一层，位置按下标排）
"use strict";

function layout(nodes, edges) {
  // 基线：不分层，按名字顺序平铺
  const positions = {};
  const ordered = nodes.slice().sort();
  ordered.forEach((name, index) => { positions[name] = { layer: 0, index: index }; });
  return { positions: positions, layers: [ordered] };
}

function relayout(prev, nodes, edges, added) {
  // 基线：不增量，整图重算
  return layout(nodes, edges);
}

function budget(nodes, edges) {
  // 基线：每次都算全部节点
  return { visited: nodes.length, limit: nodes.length };
}

module.exports = { layout, relayout, budget };
