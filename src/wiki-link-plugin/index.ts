import { Parents } from "mdast";
import { syntax } from "micromark-extension-wiki-link";
import {
  State,
  Info,
  Handle,
  Handlers,
  Options,
  Unsafe,
} from "mdast-util-to-markdown";
import { fromMarkdown } from "mdast-util-wiki-link";
import { Processor } from "unified";

// A lot of inspiration for this plugin came from https://github.com/landakram/remark-wiki-link
export function wikiLinkPlugin(this: Processor, opts = {}) {
  const data = this.data();

  data.toMarkdownExtensions = append(data.toMarkdownExtensions, toMarkdown());
  data.fromMarkdownExtensions = append(
    data.fromMarkdownExtensions,
    fromMarkdown(opts)
  );
  data.micromarkExtensions = append(data.micromarkExtensions, syntax(opts));
}

function toMarkdown(): Options {
  const unsafe: Unsafe[] = [
    {
      character: "[",
      inConstruct: ["phrasing", "label", "reference"],
    },
    {
      character: "]",
      inConstruct: ["label", "reference"],
    },
  ];

  const handler: Handle = (
    node: any,
    _parents: Parents | undefined,
    state: State,
    _info: Info
  ) => {
    const exit = state.enter("wikiLink");

    // TODO: change this to be "safe"
    const nodeAlias = node.data.alias;

    // if `node.data.hProperties.href` exits, convert wiki link to a markdown link
    // otherwise convert wiki link to plain text
    const value =
      node.data.exists === true
        ? `[${nodeAlias}](${node.data.hProperties.href})`
        : nodeAlias;

    exit();

    return value;
  };

  type WikiLinkHandler = { wikiLink: Handle } & Handlers;
  const handlers: Partial<WikiLinkHandler> = { wikiLink: handler };

  return { unsafe, handlers };
}

function append<T>(xs: T[] | undefined, x: T): T[] {
  if (xs === undefined) {
    return [x];
  }

  return [...xs, x];
}
