//import { transformMarkdown } from "../src/process.js";
//
//const sampleMd = `---\ntitle: "The importance of good testing"\ndate: 2024-04-17\npublish: true\n---\n\nExample text`
//
//test.each([
//  {
//    name: "transformMarkdown adds a layout field to the frontmatter",
//    input: sampleMd,
//    expected: '---\ntitle: "The importance of good testing"\ndate: 2024-04-17\npublish: true\n---\n\nExample text',
//  },
//  {
//    name: "transformMarkdown converts a wikilink to text when target is not in permalinks",
//  },
//  {
//    name: "transformMarkdown converts a wikilink to an href when target is in permalinks",
//  },
//  {
//    name: "transformMarkdown will find a paragraph that matches obsidian tag syntax, remove it, and add its information to the frontmatter",
//  },
//  {
//    name: "transformMarkdown wont add tags if no paragraph matches obsidian tag syntax",
//  },
//])("hi there", (name, input, expected) => {});
