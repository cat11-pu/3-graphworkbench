// viewport.js：视口裁剪（只保留视口高度内的层）
"use strict";

function viewHeight(view) {
  return view && typeof view.height === "number" ? view.height : Infinity;
}

function cull(positions, view) {
  var height = viewHeight(view);
  var names = Object.keys(positions);
  var visible = names.filter(function (name) {
    return positions[name].layer < height;
  }).sort();
  return { visible: visible, visited: names.length };
}

function edgesInView(edges, positions, view) {
  var height = viewHeight(view);
  return edges.filter(function (edge) {
    var a = positions[edge[0]], b = positions[edge[1]];
    return a && b && a.layer < height && b.layer < height;
  }).map(function (edge) { return edge.slice(); });
}

module.exports = { cull: cull, edgesInView: edgesInView };
