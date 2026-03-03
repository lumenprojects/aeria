import { remark } from "remark";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";
import { SKIP, visit } from "unist-util-visit";

const disallowed = new Set(["html", "yaml"]);

function stripDisallowed() {
  return (tree: any) => {
    visit(tree, (node, index, parent) => {
      if (!parent || typeof index !== "number") return;
      if (disallowed.has(node.type)) {
        parent.children.splice(index, 1);
        return [SKIP, index];
      }
      return undefined;
    });
  };
}

export async function normalizeMarkdown(markdown: string): Promise<string> {
  const file = await remark()
    .use(remarkParse)
    .use(remarkGfm)
    .use(stripDisallowed)
    .use(remarkStringify, { bullet: "-", listItemIndent: "one" })
    .process(markdown);
  return String(file).trim();
}
