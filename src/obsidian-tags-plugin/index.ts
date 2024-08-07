import { Root, Paragraph, Yaml } from "mdast";
import { parseDocument } from "yaml";

export default function () {
  return function (root: Root) {
    // find ymlNode
    const ymlNode = root.children.find(
      (node): node is Yaml => node.type === "yaml",
    );
    if (!ymlNode) return;

    // create document from yml
    const frontmatter = parseDocument(ymlNode.value);

    // find paragraph that starts with `tags:` (case-insensitive)
    const tagsParagraphIndex = root.children.findIndex(
      (node): node is Paragraph => {
        if (node.type !== "paragraph" || node.children.length === 0) {
          return false;
        }
        const firstChild = node.children[0];
        if (firstChild.type !== "text") {
          return false;
        }
        return firstChild.value.toLowerCase().startsWith("tags:");
      },
    );
    if (tagsParagraphIndex === -1) {
      return;
    }

    // get all of the wiki link nodes from that paragraph
    const tagsParagraphNode = root.children[tagsParagraphIndex] as Paragraph;
    const wikiLinkNodes = tagsParagraphNode.children.filter(
      // @ts-ignore: hack: the `Paragraph` type doesn't recognize that it can have `wikiLink` node children
      (node) => node.type === "wikiLink",
    );

    // extract text from these wiki link nodes
    const textTags = wikiLinkNodes.map((node): string => (node as any).value);

    // save new property to yml node with those text tags
    frontmatter.set("tags", textTags);

    // update yaml node
    ymlNode.value = frontmatter.toString();

    // remove tagsParagraphNode from root.children. its not needed anymore
    root.children.splice(tagsParagraphIndex, 1);
  };
}
