import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import matter from "gray-matter";
import fsp from "fs/promises";
import { Dirent } from "fs";
import { File } from "./types.js";
import path from "path";
import readline from "readline/promises";
import wikiLinkPlugin from "./wiki-link-plugin/index.js";
import astroFrontmatterPlugin from "./astro-frontmatter-plugin/index.js";

const inDir = `/Users/dannyvelasquez/RemoteGit/MyGithub/notes/`;
const outDir = `/Users/dannyvelasquez/RemoteGit/MyGithub/My-Websites/my-second-website/src/pages/posts/`;

async function main() {
  // find all markdown files recursively in current directory
  const filePaths = await fsp.readdir(inDir, {
    recursive: true,
    withFileTypes: true,
  });
  const mdFilePaths = filePaths.filter((x) => x.name.endsWith(".md"));

  // convert markdown files to `File` objects
  const mdFiles = await Promise.all(mdFilePaths.map(newFile));
  const mdFilesOk = mdFiles.filter((x): x is File => x !== undefined);

  // if the markdown file is not public, ignore
  const publicMdFiles = mdFilesOk.filter((x) => x.data.publish === true);

  // collect permalinks
  const permalinks = publicMdFiles.map((x) => x.name);

  // create array of new markdown files
  const newPosts = await Promise.all(
    publicMdFiles.map((x) => blogify(x, permalinks))
  );

  deleteOldPostsIfNecessary(newPosts);

  // write new posts to `outDir`
  for (const post of newPosts) {
    const p = path.join(outDir, post.base);
    await fsp.writeFile(p, post.content, { flag: "w" });
  }
}

async function newFile(dirent: Dirent): Promise<File | undefined> {
  const fullPath = path.join(dirent.path, dirent.name);

  // read file at path
  const content = await fsp.readFile(fullPath, { encoding: "utf8" });

  // translate path to an object with useful fields such as `base, ext, dir`
  const parsedPath = path.parse(fullPath);

  return { ...matter(content), ...parsedPath, content };
}

// blogify takes a file and returns the same exact file, except content will be the
// transformed markdown
async function blogify(file: File, permalinks: string[]): Promise<File> {
  return {
    ...file,
    content: await transformMarkdown(file.content, permalinks),
  };
}

// transform new md to have links to website posts instead of wikilinks.
async function transformMarkdown(
  md: string,
  permalinks: string[]
): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkStringify, { bullet: "-" })
    .use(remarkFrontmatter) // this plugin makes remark recognize that a yaml section at the top is frontmatter and not a thematic break with markdown inside of it
    .use(remarkGfm) // this plugin makes remark recognize tables, footnotes, and other cool gfm-specific things as their own entities, instead of paragraphs
    .use(astroFrontmatterPlugin)
    .use(wikiLinkPlugin, {
      aliasDivider: "|",
      hrefTemplate: (permalink: string) => `/posts/${permalink}/`,
      permalinks,
    });

  const file = await processor.process(md);
  return file.toString();
}

async function deleteOldPostsIfNecessary(newPosts: File[]) {
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

main();
