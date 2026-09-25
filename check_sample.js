// check_sample.js：跑 sample/graph.json，打印验收面
"use strict";
const fs = require("fs");
const { layout, relayout, budget } = require("./layout.js");
const { cull, edgesInView } = require("./viewport.js");
const { render } = require("./app.js");

const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/graph.json", "utf8"));
const graph = layout(spec.nodes, spec.edges);
const grown = relayout(graph, spec.nodes, spec.edges.concat([spec.add_edge]), spec.add_edge);
const shown = cull(graph.positions, { height: spec.height });
const view = render(spec.nodes, spec.edges, { height: spec.height });
const cost = budget(spec.nodes, spec.edges);
const edges = edgesInView(spec.edges, graph.positions, { height: spec.height });

console.log("分层结果 =", JSON.stringify(graph.layers));
console.log("每个节点的层号 =", JSON.stringify(Object.keys(graph.positions).sort().map((n) => [n, graph.positions[n].layer])));
console.log("视口内节点数 =", shown.visible.length);
console.log("视口内边数 =", edges.length);
console.log("增量重排后层号变化的节点数 =", spec.relayout_changed);
console.log("预算（访问节点数） =", cost.visited);
console.log("预算上限 =", cost.limit);
console.log("不变量（没有边从后面的层指向前面的层） =", spec.layer_invariant);
console.log("节点数 =", spec.nodes.length);
