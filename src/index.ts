import fsp from "fs/promises";
import path from "path";
import { deleteOldPostsIfNecessary, transformMarkdown, newFile } from './process.js'
import type { File } from './process.js';

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
  console.log(JSON.stringify(mdFiles))
  const mdFilesOk = mdFiles.filter((x): x is File => x !== undefined);

  // if the markdown file is not public, ignore
  const publicMdFiles = mdFilesOk.filter((x) => x.data.publish === true);

  // collect permalinks
  const permalinks = publicMdFiles.map((x) => x.name);

  // create array of new markdown files
  const newPosts = await Promise.all(
    publicMdFiles.map(async (x) => ({ ...x, content: await transformMarkdown(x.content, permalinks) }))
  );

  deleteOldPostsIfNecessary(newPosts, outDir);

  // write new posts to `outDir`
  for (const post of newPosts) {
    const p = path.join(outDir, post.base);
    await fsp.writeFile(p, post.content, { flag: "w" });
  }
}

main();
