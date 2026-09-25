// layout.js：分层布局（最长路径分层 + 增量重排 + 预算）
"use strict";

// 预算上限的写死倍数：visited 不得超过 limit = LIMIT_FACTOR * 节点数
var LIMIT_FACTOR = 2;

function buildGraph(nodes, edges) {
  var adj = new Map();
  var indeg = new Map();
  nodes.forEach(function (n) { adj.set(n, []); indeg.set(n, 0); });
  edges.forEach(function (edge) {
    var u = edge[0], v = edge[1];
    if (!adj.has(u) || !adj.has(v)) return;
    adj.get(u).push(v);
    indeg.set(v, indeg.get(v) + 1);
  });
  return { adj: adj, indeg: indeg };
}

// Tarjan 强连通分量：有回边时把环缩成同一层，保证不变量可满足
function stronglyConnectedComponents(nodes, adj) {
  var index = new Map();
  var low = new Map();
  var onStack = new Set();
  var stack = [];
  var sccs = [];
  var counter = 0;
  function visit(v) {
    index.set(v, counter); low.set(v, counter); counter += 1;
    stack.push(v); onStack.add(v);
    adj.get(v).forEach(function (w) {
      if (!index.has(w)) {
        visit(w);
        low.set(v, Math.min(low.get(v), low.get(w)));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v), index.get(w)));
      }
    });
    if (low.get(v) === index.get(v)) {
      var scc = [];
      var w;
      do { w = stack.pop(); onStack.delete(w); scc.push(w); } while (w !== v);
      sccs.push(scc);
    }
  }
  nodes.forEach(function (n) { if (!index.has(n)) visit(n); });
  return sccs;
}

// 核心：返回每个节点的层号与本趟布局访问的节点数
function computeLayers(nodes, edges) {
  var graph = buildGraph(nodes, edges);
  var adj = graph.adj;
  var sccs = stronglyConnectedComponents(nodes, adj);
  var compOf = new Map();
  sccs.forEach(function (scc, id) {
    scc.forEach(function (n) { compOf.set(n, id); });
  });
  var compAdj = sccs.map(function () { return new Set(); });
  var compIndeg = sccs.map(function () { return 0; });
  edges.forEach(function (edge) {
    var cu = compOf.get(edge[0]), cv = compOf.get(edge[1]);
    if (cu === undefined || cv === undefined || cu === cv) return;
    if (!compAdj[cu].has(cv)) { compAdj[cu].add(cv); compIndeg[cv] += 1; }
  });
  // 在缩点后的 DAG 上按最长路径定层
  var compLayer = sccs.map(function () { return 0; });
  var queue = [];
  compIndeg.forEach(function (d, id) { if (d === 0) queue.push(id); });
  var head = 0;
  while (head < queue.length) {
    var c = queue[head]; head += 1;
    compAdj[c].forEach(function (nxt) {
      if (compLayer[nxt] < compLayer[c] + 1) compLayer[nxt] = compLayer[c] + 1;
      compIndeg[nxt] -= 1;
      if (compIndeg[nxt] === 0) queue.push(nxt);
    });
  }
  var layerOf = {};
  nodes.forEach(function (n) { layerOf[n] = compLayer[compOf.get(n)]; });
  return { layerOf: layerOf, indeg: graph.indeg, visited: nodes.length };
}

// 由层号表构建 positions 与 layers（层内按入度升序、再按名字升序）
function buildResult(nodes, layerOf, indeg) {
  var byLayer = new Map();
  nodes.forEach(function (n) {
    var l = layerOf[n];
    if (!byLayer.has(l)) byLayer.set(l, []);
    byLayer.get(l).push(n);
  });
  var keys = Array.from(byLayer.keys()).sort(function (a, b) { return a - b; });
  var positions = {};
  var layers = [];
  keys.forEach(function (l) {
    var names = byLayer.get(l).sort(function (a, b) {
      if (indeg.get(a) !== indeg.get(b)) return indeg.get(a) - indeg.get(b);
      return a < b ? -1 : a > b ? 1 : 0;
    });
    var layerNames = [];
    names.forEach(function (n, i) {
      positions[n] = { layer: l, index: i };
      layerNames.push(n);
    });
    layers.push(layerNames);
  });
  return { positions: positions, layers: layers };
}

function layout(nodes, edges) {
  var computed = computeLayers(nodes, edges);
  return buildResult(nodes, computed.layerOf, computed.indeg);
}

function relayout(prev, nodes, edges, added) {
  var graph = buildGraph(nodes, edges);
  var layerOf = {};
  nodes.forEach(function (n) {
    layerOf[n] = prev && prev.positions && prev.positions[n] ? prev.positions[n].layer : 0;
  });
  var changed = new Set();
  if (added) {
    var u = added[0], v = added[1];
    if (layerOf[u] !== undefined && layerOf[v] !== undefined && layerOf[v] < layerOf[u] + 1) {
      // 只从受影响节点出发做前向传播，其余节点层号不动
      layerOf[v] = layerOf[u] + 1;
      changed.add(v);
      var queue = [v];
      var head = 0;
      var cap = nodes.length + 1;
      var overflow = false;
      while (head < queue.length && !overflow) {
        var x = queue[head]; head += 1;
        if (layerOf[x] > cap) { overflow = true; break; } // 出现回边，退化为全量重算
        graph.adj.get(x).forEach(function (y) {
          if (layerOf[y] < layerOf[x] + 1) {
            layerOf[y] = layerOf[x] + 1;
            changed.add(y);
            queue.push(y);
          }
        });
      }
      if (overflow) {
        var full = layout(nodes, edges);
        full.reordered = nodes.length;
        return full;
      }
    }
  }
  var result = buildResult(nodes, layerOf, graph.indeg);
  result.reordered = changed.size;
  return result;
}

function budget(nodes, edges) {
  var computed = computeLayers(nodes, edges);
  return { visited: computed.visited, limit: LIMIT_FACTOR * nodes.length };
}

module.exports = { layout: layout, relayout: relayout, budget: budget };
