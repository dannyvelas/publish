import { transformMarkdown } from "./process.js";
import { test, expect } from "vitest";
import dedent from "dedent-js";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { parseDocument } from "yaml";
import { Literal } from "mdast";

// processor used to test output markdown
const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkGfm);

test("transformMarkdown adds a layout field to the frontmatter", async () => {
  const input = dedent`---
    title: "The importance of good testing"
    date: 2024-04-17
    publish: true
    ---
    Example text`;

  const actualMd = await transformMarkdown(input, []);
  const actualCST = processor.parse(actualMd);
  expect(actualCST.children.length).toBeGreaterThan(0);

  const firstChild = actualCST.children[0];
  expect(firstChild.type).toBe("yaml");
  expect(firstChild).toHaveProperty("value");

  const parsed = parseDocument((firstChild as Literal).value).toJSON();
  expect(parsed).toHaveProperty("layout");
});

test("transformMarkdown will find a paragraph that matches obsidian tag syntax, remove it, and add its information to the frontmatter", async () => {
  const input = dedent`---
    title: "The importance of good testing"
    date: 2024-04-17
    publish: true
    ---
    Tags: [[career]], [[programming-languages]]

    Example text`;

  const actualMd = await transformMarkdown(input, []);
  const actualCST = processor.parse(actualMd);
  expect(actualCST.children.length).toBeGreaterThan(0);

  const firstChild = actualCST.children[0];
  expect(firstChild.type).toBe("yaml");
  expect(firstChild).toHaveProperty("value");

  const parsed = parseDocument((firstChild as Literal).value).toJSON();
  expect(parsed).toHaveProperty("tags");
});

test.each([
  {
    name: "transformMarkdown converts a wikilink to text when target is not in permalinks",
    input: "[[nonexisting-link|link alias]]",
    permalinks: [],
    expected: "link alias\n",
  },
  {
    name: "transformMarkdown converts a wikilink to an href when target is in permalinks",
    input: "[[existing-link|link alias]]",
    permalinks: ["existing-link"],
    expected: "[link alias](/posts/existing-link/)\n",
  },
])("$name", async ({ input, permalinks, expected }) => {
  const actualMd = await transformMarkdown(input, permalinks);
  expect(actualMd).toBe(expected);
});
