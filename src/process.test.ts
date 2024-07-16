import { transformMarkdown } from "./process.js";
import { test, expect } from 'vitest';
import dedent from "dedent-js";

test.each([
  {
    name: "transformMarkdown adds a layout field to the frontmatter",
    input: `---
title: "The importance of good testing"
date: 2024-04-17
publish: true
---
Example text`,
    expected: `---
title: "The importance of good testing"
date: 2024-04-17
publish: true
layout: ../../layouts/BlogLayout.astro

---

Example text
`,
  },
  {
    name: "transformMarkdown will find a paragraph that matches obsidian tag syntax, remove it, and add its information to the frontmatter",
    input: `---
title: "The importance of good testing"
date: 2024-04-17
publish: true
---
Tags: [[career]], [[programming-languages]]

Example text`,
    expected: `---
title: "The importance of good testing"
date: 2024-04-17
publish: true
layout: ../../layouts/BlogLayout.astro
tags:
  - career
  - programming-languages

---

Example text
`,
  },
])("$name", async ({ input, expected }) => {
  const actualMd = await transformMarkdown(input, []);
  expect(actualMd).toBe(expected);
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
