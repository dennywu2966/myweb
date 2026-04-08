import { visit } from 'unist-util-visit';
import type { Root, Text, Link, PhrasingContent } from 'mdast';
import type { Parent } from 'unist';

const WIKILINK_RE = /\[\[([^\]]+?)\]\]/g;

export function remarkWikilinks() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (index === undefined || index === null || !parent) return;

      const value = node.value;
      if (!value.includes('[[')) return;

      const children: PhrasingContent[] = [];
      let lastIndex = 0;

      WIKILINK_RE.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = WIKILINK_RE.exec(value)) !== null) {
        const fullMatch = match[0];
        const inner = match[1];
        const matchStart = match.index;

        // Text before this wikilink
        if (matchStart > lastIndex) {
          children.push({
            type: 'text',
            value: value.slice(lastIndex, matchStart),
          } as Text);
        }

        // Parse inner content: [[page-name]] or [[page-name|Display Text]]
        const pipeIndex = inner.indexOf('|');
        let pageName: string;
        let displayText: string;

        if (pipeIndex !== -1) {
          pageName = inner.slice(0, pipeIndex).trim();
          displayText = inner.slice(pipeIndex + 1).trim();
        } else {
          pageName = inner.trim();
          displayText = pageName;
        }

        // Create link node
        const linkNode: Link = {
          type: 'link',
          url: `/digest/${pageName}`,
          children: [{ type: 'text', value: displayText } as Text],
        };

        children.push(linkNode);
        lastIndex = matchStart + fullMatch.length;
      }

      // No wikilinks found
      if (children.length === 0) return;

      // Remaining text after last wikilink
      if (lastIndex < value.length) {
        children.push({
          type: 'text',
          value: value.slice(lastIndex),
        } as Text);
      }

      // Replace the original text node with the new nodes
      (parent as Parent & { children: PhrasingContent[] }).children.splice(
        index,
        1,
        ...children,
      );

      // Return the index to skip re-visiting the nodes we just inserted
      return index + children.length;
    });
  };
}
