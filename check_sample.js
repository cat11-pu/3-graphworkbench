import fs from "node:fs";
import { layout } from "./layout.js";
import { addEdges } from "./incremental.js";
import { render } from "./app.js";

const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/graph.json", "utf8"));
const base = layout(spec.nodes, spec.edges || []);
const grown = addEdges(spec.nodes, spec.edges || [], spec.added_edges || [], base.positions);
const view = render(spec);

console.log("每个节点的坐标 =", JSON.stringify(base.positions));
console.log("每层节点 =", JSON.stringify(base.layers));
console.log("交叉数 =", base.crossings);
console.log("重排的节点 =", JSON.stringify(grown.moved));
console.log("增量是否与全量一致 =", view.consistent);
console.log("预算消耗 =", view.budget_used);
console.log("自环的错误码 =", spec.self_loop_code);
