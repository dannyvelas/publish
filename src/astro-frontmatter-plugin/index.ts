import { Root } from "mdast";
import { parseDocument } from "yaml";

// inspo from: https://github.com/orgs/remarkjs/discussions/1210
export default function () {
  return function (root: Root) {
    for (const node of root.children) {
      if (node.type !== "yaml") {
        continue;
      }

      const doc = parseDocument(node.value);

      doc.set("layout", "../../layouts/BlogLayout.astro");

      node.value = String(doc);
    }
  };
}
