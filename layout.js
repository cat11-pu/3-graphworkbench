// layout.js：分层布局（最长路径分层 + 增量重排 + 预算）
"use strict";

// Tarjan 强连通分量（迭代版，避免深递归），回边两端归入同一层，
// 保证分层后不存在从后面层指向前面层的边。
function stronglyConnectedComponents(nodes, adj) {
  const indexOf = new Map();
  const lowlink = new Map();
  const onStack = new Set();
  const stack = [];
  const compOf = new Map();
  let nextIndex = 0;
  let compCount = 0;

  for (const root of nodes) {
    if (indexOf.has(root)) continue;
    const work = [[root, 0]];
    while (work.length > 0) {
      const frame = work[work.length - 1];
      const node = frame[0];
      if (frame[1] === 0) {
        indexOf.set(node, nextIndex);
        lowlink.set(node, nextIndex);
        nextIndex += 1;
        stack.push(node);
        onStack.add(node);
      }
      const neighbors = adj.get(node) || [];
      if (frame[1] < neighbors.length) {
        const target = neighbors[frame[1]];
        frame[1] += 1;
        if (!indexOf.has(target)) {
          work.push([target, 0]);
        } else if (onStack.has(target)) {
          lowlink.set(node, Math.min(lowlink.get(node), indexOf.get(target)));
        }
      } else {
        work.pop();
        if (work.length > 0) {
          const parent = work[work.length - 1][0];
          lowlink.set(parent, Math.min(lowlink.get(parent), lowlink.get(node)));
        }
        if (lowlink.get(node) === indexOf.get(node)) {
          let member;
          do {
            member = stack.pop();
            onStack.delete(member);
            compOf.set(member, compCount);
          } while (member !== node);
          compCount += 1;
        }
      }
    }
  }
  return { compOf: compOf, compCount: compCount };
}

// 最长路径分层：层号 = 从任意根到该节点的最长路径长度。
// 在凝聚图上做 Kahn 拓扑松弛，每个节点恰好定层一次（visited 可观测）。
function computeLayering(nodes, edges) {
  const adj = new Map();
  for (const name of nodes) adj.set(name, []);
  for (const edge of edges) {
    if (!adj.has(edge[0])) continue;
    adj.get(edge[0]).push(edge[1]);
  }

  const scc = stronglyConnectedComponents(nodes, adj);
  const compOf = scc.compOf;
  const compCount = scc.compCount;

  const compAdj = [];
  const compIndegree = new Array(compCount).fill(0);
  for (let i = 0; i < compCount; i++) compAdj.push(new Set());
  for (const edge of edges) {
    const from = compOf.get(edge[0]);
    const to = compOf.get(edge[1]);
    if (from === undefined || to === undefined || from === to) continue;
    if (!compAdj[from].has(to)) {
      compAdj[from].add(to);
      compIndegree[to] += 1;
    }
  }

  const compMembers = new Map();
  for (const name of nodes) {
    const comp = compOf.get(name);
    if (!compMembers.has(comp)) compMembers.set(comp, []);
    compMembers.get(comp).push(name);
  }

  const compLayer = new Array(compCount).fill(0);
  const indegree = compIndegree.slice();
  const queue = [];
  for (let i = 0; i < compCount; i++) if (indegree[i] === 0) queue.push(i);

  const layerOf = {};
  let visited = 0;
  let head = 0;
  while (head < queue.length) {
    const comp = queue[head];
    head += 1;
    const members = compMembers.get(comp) || [];
    for (const member of members) {
      layerOf[member] = compLayer[comp];
      visited += 1;
    }
    for (const next of compAdj[comp]) {
      if (compLayer[next] < compLayer[comp] + 1) compLayer[next] = compLayer[comp] + 1;
      indegree[next] -= 1;
      if (indegree[next] === 0) queue.push(next);
    }
  }
  return { layerOf: layerOf, visited: visited };
}

// 由层号构建 positions 与 layers：层内按入度升序、再按名字升序。
function buildResult(nodes, edges, layerOf, visited) {
  const indegree = new Map();
  for (const name of nodes) indegree.set(name, 0);
  for (const edge of edges) {
    if (indegree.has(edge[1])) indegree.set(edge[1], indegree.get(edge[1]) + 1);
  }

  const byLayer = new Map();
  for (const name of nodes) {
    const layer = layerOf[name] || 0;
    if (!byLayer.has(layer)) byLayer.set(layer, []);
    byLayer.get(layer).push(name);
  }

  const layers = [];
  const positions = {};
  const keys = Array.from(byLayer.keys()).sort((a, b) => a - b);
  for (const key of keys) {
    const group = byLayer.get(key).sort((a, b) => {
      const diff = indegree.get(a) - indegree.get(b);
      if (diff !== 0) return diff;
      return a < b ? -1 : a > b ? 1 : 0;
    });
    group.forEach((name, index) => { positions[name] = { layer: key, index: index }; });
    layers.push(group);
  }
  return { positions: positions, layers: layers, visited: visited };
}

function layout(nodes, edges) {
  const core = computeLayering(nodes, edges);
  return buildResult(nodes, edges, core.layerOf, core.visited);
}

// 增量重排：从新增边的终点前向传播，只提升受影响节点的层号。
// 若传播中层号超过节点数（说明新边成环），回退到整图最长路径重算到稳定。
function relayout(prev, nodes, edges, added) {
  const layerOf = {};
  for (const name of nodes) {
    layerOf[name] = prev && prev.positions && prev.positions[name] ? prev.positions[name].layer : 0;
  }

  const adj = new Map();
  for (const name of nodes) adj.set(name, []);
  for (const edge of edges) {
    if (!adj.has(edge[0])) continue;
    adj.get(edge[0]).push(edge[1]);
  }

  const changed = new Set();
  let overflow = false;
  if (added) {
    const source = added[0];
    const target = added[1];
    if (layerOf[source] === undefined) layerOf[source] = 0;
    if (layerOf[target] === undefined) layerOf[target] = 0;
    const queue = [];
    if (layerOf[target] < layerOf[source] + 1) {
      layerOf[target] = layerOf[source] + 1;
      changed.add(target);
      queue.push(target);
    }
    let head = 0;
    while (head < queue.length && !overflow) {
      const node = queue[head];
      head += 1;
      if (layerOf[node] > nodes.length) { overflow = true; break; }
      for (const next of adj.get(node) || []) {
        if (layerOf[next] < layerOf[node] + 1) {
          layerOf[next] = layerOf[node] + 1;
          changed.add(next);
          queue.push(next);
        }
      }
    }
  }

  if (overflow) {
    const full = layout(nodes, edges);
    let reordered = 0;
    for (const name of nodes) {
      const before = prev && prev.positions && prev.positions[name] ? prev.positions[name].layer : -1;
      if (full.positions[name].layer !== before) reordered += 1;
    }
    full.reordered = reordered;
    return full;
  }

  const result = buildResult(nodes, edges, layerOf, nodes.length);
  result.reordered = changed.size;
  return result;
}

// 预算：visited 为本次布局实际定层的节点数，limit 为写死上限（每节点至多访问 2 次）。
function budget(nodes, edges) {
  const core = computeLayering(nodes, edges);
  return { visited: core.visited, limit: 2 * nodes.length };
}

module.exports = { layout, relayout, budget };
