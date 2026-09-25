// tests/run.js：基线用例
"use strict";
const assert = require("assert");
const { layout } = require("../layout.js");
const { cull } = require("../viewport.js");
const { render } = require("../app.js");

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok   " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("layout returns positions", () => {
  const graph = layout(["a", "b"], []);
  assert.strictEqual(Object.keys(graph.positions).length, 2);
});

check("layout groups into layers", () => {
  assert.ok(Array.isArray(layout(["a"], []).layers));
});

check("cull returns visible nodes", () => {
  assert.deepStrictEqual(cull({ a: { layer: 0, index: 0 } }, { height: 3 }).visible, ["a"]);
});

check("render exposes edges", () => {
  assert.ok(Array.isArray(render(["a"], [["a", "a"]], { height: 2 }).edges));
});

check("render keeps positions", () => {
  assert.ok(render(["a"], [], { height: 2 }).positions.a);
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
