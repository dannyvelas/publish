import { GrayMatterFile } from "gray-matter";
import { ParsedPath } from "path";

export type File = ParsedPath & GrayMatterFile<string>;
