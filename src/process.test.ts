import { transformMarkdown } from "./process.js";
import { test, expect } from "vitest";
import dedent from "dedent-js";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { parseDocument } from "yaml";
import { Literal, Paragraph, Text } from "mdast";

// processor used to test output markdown
const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkGfm);

test.each([
  {
    name: "transformMarkdown adds a layout field to the frontmatter",
    input: dedent`---
      title: "The importance of good testing"
      date: 2024-04-17
      publish: true
      ---
      Example text`,
    expectedProperty: "layout",
  },
  {
    name: "transformMarkdown will find a paragraph that matches obsidian tag syntax and add its information to the frontmatter",
    input: dedent`---
      title: "The importance of good testing"
      date: 2024-04-17
      publish: true
      ---
      Tags: [[career]], [[programming-languages]]

      Example text`,
    expectedProperty: "tags",
  },
])("$name", async ({ input, expectedProperty }) => {
  const actualMd = await transformMarkdown(input, []);
  const actualCST = processor.parse(actualMd);
  expect(actualCST.children.length).toBeGreaterThan(0);

  const firstChild = actualCST.children[0];
  expect(firstChild.type).toBe("yaml");
  expect(firstChild).toHaveProperty("value");

  const parsed = parseDocument((firstChild as Literal).value).toJSON();
  expect(parsed).toHaveProperty(expectedProperty);
});

test.each([
  {
    name: "transformMarkdown converts a wikilink to text when target is not in permalinks",
    input: "[[nonexisting-link|link alias]]",
    permalinks: [],
    expected: "link alias",
  },
  {
    name: "transformMarkdown converts a wikilink to an href when target is in permalinks",
    input: "[[existing-link|link alias]]",
    permalinks: ["existing-link"],
    expected: "[link alias](/posts/existing-link/)",
  },
])("$name", async ({ input, permalinks, expected }) => {
  const actualMd = await transformMarkdown(input, permalinks);
  expect(actualMd.trim()).toBe(expected);
});

test("transformMarkdown removes first paragraph if it starts with Tags:", async () => {
  const input = dedent`---
    title: "The importance of good testing"
    date: 2024-04-17
    publish: true
    ---
    Tags: [[career]], [[programming-languages]]

    Example text`;

  const actualMd = await transformMarkdown(input, []);
  const actualCST = processor.parse(actualMd);
  expect(actualCST.children.length).toBeGreaterThan(1);

  const secondChild = actualCST.children[1];
  expect(secondChild.type).toBe("paragraph");
  expect(secondChild).toHaveProperty("children");

  const paragraph = secondChild as Paragraph;
  expect(paragraph.children.length).toBeGreaterThan(0);

  const pgraphFirstChild = paragraph.children[0] as Text;
  expect(pgraphFirstChild.type).toBe("text");
  
  expect(pgraphFirstChild).toHaveProperty("value");
  expect(pgraphFirstChild.value).toBe("Example text");
});
