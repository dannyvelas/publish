import { GrayMatterFile } from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import matter from "gray-matter";
import { ParsedPath } from "path";
import readline from "readline/promises";
import wikiLinkPlugin from "./wiki-link-plugin/index.js";
import astroFrontmatterPlugin from "./astro-frontmatter-plugin/index.js";
import obsidianTagsPlugin from "./obsidian-tags-plugin/index.js";
import { Dirent } from "fs";
import path from "path";
import fsp from "fs/promises";

export type File = ParsedPath & GrayMatterFile<string>;

export async function newFile(dirent: Dirent): Promise<File | undefined> {
  const fullPath = path.join(dirent.path, dirent.name);

  // read file at path
  const content = await fsp.readFile(fullPath, { encoding: "utf8" });

  // translate path to an object with useful fields such as `base, ext, dir`
  const parsedPath = path.parse(fullPath);

  return { ...matter(content), ...parsedPath, content };
}

export async function deleteOldPostsIfNecessary(
  newPosts: File[],
  outDir: string,
) {
  // get old posts
  const oldPosts = await fsp.readdir(outDir, {
    recursive: true,
    withFileTypes: true,
  });

  // postsToDelete = posts that are in set of `oldPosts` that are not in the set of `newPosts`
  const newPostsSet = new Set(newPosts.map((x) => x.base));
  const postsToDelete = oldPosts.filter((x) => !newPostsSet.has(x.name));

  // if all old posts are also new posts, we can safely return early
  if (postsToDelete.length === 0) {
    return;
  }

  // otherwise, initialize rl interface so that we can ask user if we want to delete old files
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // for each post, make sure user is consenting to delete the old post
  for (const post of postsToDelete) {
    const ans = await rl.question(`delete ${post.name}? `);
    const lowerCaseAns = ans.toLowerCase();
    if (lowerCaseAns === "y" || lowerCaseAns === "yes") {
      await fsp.rm(path.join(post.path, post.name));
    }
  }
  rl.close();
}

// runs markdown transformations and returns the transformed markdown
export async function transformMarkdown(
  md: string,
  permalinks: string[],
): Promise<string> {
  const processor = unified()
    // this plugin configures unified to read markdown
    .use(remarkParse)

    // this plugin configures unified to output markdown
    .use(remarkStringify, { bullet: "-" })

    // this plugin makes remark recognize that a yaml section at the top is frontmatter and
    // not a thematic break with markdown inside of it
    .use(remarkFrontmatter)

    // this plugin makes remark recognize tables, footnotes, and other cool gfm-specific things as
    // their own entities, instead of paragraphs
    .use(remarkGfm)

    // this plugin adds astro-specific settings to front-matter
    .use(astroFrontmatterPlugin)

    // this plugin converts wiki links to normal markdown links if their target is found inside of
    // `permalinks`. otherwise, they are converted to text
    .use(wikiLinkPlugin, {
      aliasDivider: "|",
      hrefTemplate: (permalink: string) => `/posts/${permalink}/`,
      permalinks,
    })

    // this plugin will search for a paragraph that matches tag syntax in
    // obsidian, remove it, and add its information to the frontmatter
    .use(obsidianTagsPlugin);

  const transformedVFile = await processor.process(md);

  return transformedVFile.toString();
}
