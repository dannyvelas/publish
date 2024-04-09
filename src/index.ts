import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import matter from "gray-matter";
import fsp from "fs/promises";
import { wikiLinkPlugin } from "./wiki-link-plugin/index.js";
import { File } from "./types.js";
import path from "path";

const inDir = `/Users/dannyvelasquez/RemoteGit/MyGithub/notes/`;
const outDir = `/Users/dannyvelasquez/RemoteGit/MyGithub/My-Websites/my-second-website/src/pages/posts/`;

async function main() {
  // find all markdown files recursively in current directory
  const filePaths = await fsp.readdir(inDir, { recursive: true });
  const mdFilePaths = filePaths.filter((x) => x.endsWith(".md"));

  // convert markdown files to `File` objects
  const mdFiles = await Promise.all(mdFilePaths.map(newFile));
  const mdFilesOk = mdFiles.filter((x): x is File => x !== undefined);

  // if the markdown file is not public, ignore
  const publicMdFiles = mdFilesOk.filter((x) => x.data.public === true);

  // collect permalinks
  const permalinks = publicMdFiles.map((x) => x.name);

  // create array of new markdown files
  const newPosts = await Promise.all(
    publicMdFiles.map((x) => blogify(x, permalinks))
  );

  // delete all old posts to avoid the `outDir` from becoming filled with deleted files
  const oldPosts = await fsp.readdir(outDir, {
    recursive: true,
    withFileTypes: true,
  });
  for (const post of oldPosts) {
    await fsp.rm(path.join(post.path, post.name));
  }

  // write new posts to `outDir`
  for (const post of newPosts) {
    const p = path.join(outDir, post.base);
    await fsp.writeFile(p, post.content, { flag: "w" });
  }
}

async function newFile(filePath: string): Promise<File | undefined> {
  // read file at path
  const content = await fsp.readFile(filePath, { encoding: "utf8" });

  const parsedPath = path.parse(filePath);

  return { ...matter(content), ...parsedPath, content };
}

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
    .use(wikiLinkPlugin, {
      aliasDivider: "|",
      hrefTemplate: (permalink: string) => `/posts/${permalink}/`,
      permalinks,
    });

  const file = await processor.process(md);
  return file.toString();
}

main();
