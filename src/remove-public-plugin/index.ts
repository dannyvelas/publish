import { Root } from "mdast";
import { parseDocument } from "yaml";

export function removePublicFromFrontmatter() {
  return function (tree: Root) {
    for (const node of tree.children) {
      if (node.type !== "yaml") {
        continue;
      }

      const doc = parseDocument(node.value);
      doc.delete("public");
      node.value = String(doc);
    }
  };
}
