/**
 * Markdown serialization with YAML frontmatter
 * Obsidian-compatible format
 */
import matter from 'gray-matter';
import yaml from 'js-yaml';
import type { KnowledgeNode } from './types.js';
import { InvalidNodeError } from '../utils/errors.js';
import { KnowledgeNodeSchema } from '../utils/validation.js';

/**
 * Parse a markdown file with YAML frontmatter into a KnowledgeNode
 */
export function parseNode(content: string): KnowledgeNode {
  try {
    const { data, content: markdownContent } = matter(content, {
      // Prevent gray-matter from parsing dates
      engines: {
        yaml: {
          parse: (str: string) => {
            // Use JSON parse to avoid date parsing
            return yaml.load(str, { schema: yaml.JSON_SCHEMA }) as Record<string, unknown>;
          },
        },
      },
    });

    // Validate frontmatter structure
    const node = KnowledgeNodeSchema.parse({
      ...data,
      content: markdownContent.trim(),
    });

    return node;
  } catch (error) {
    if (error instanceof Error) {
      throw new InvalidNodeError(`Failed to parse node: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Serialize a KnowledgeNode to Obsidian-compatible markdown
 */
export function serializeNode(node: KnowledgeNode): string {
  // Extract frontmatter fields
  const frontmatter = {
    id: node.id,
    type: node.type,
    title: node.title,
    created: node.created,
    modified: node.modified,
    session: node.session,
    source: node.source,
    tags: node.tags,
    confidence: node.confidence,
    status: node.status,
    ...(node.references.length > 0 && { references: node.references }),
    ...(node.relations.length > 0 && {
      relations: node.relations.map((r) => {
        if (r.description !== undefined) {
          return {
            type: r.type,
            target: r.target,
            description: r.description,
            confidence: r.confidence,
          };
        }
        return {
          type: r.type,
          target: r.target,
          confidence: r.confidence,
        };
      }),
    }),
  };

  // Generate markdown content
  let markdown = node.content;

  // Append wiki-style links to related nodes
  if (node.relations.length > 0) {
    markdown += '\n\n---\n\n';
    markdown += '## Related\n\n';

    for (const relation of node.relations) {
      const relationLabel = formatRelationType(relation.type);
      markdown += `- ${relationLabel}: [[${relation.target}]]`;
      if (relation.description) {
        markdown += ` - ${relation.description}`;
      }
      markdown += '\n';
    }
  }

  // Clean frontmatter to remove undefined values
  const cleanedFrontmatter = Object.fromEntries(
    Object.entries(frontmatter).filter(([_, v]) => v !== undefined),
  );

  // Use gray-matter to serialize
  const result = matter.stringify(markdown, cleanedFrontmatter);
  return result;
}

/**
 * Format relation type for human-readable display
 */
function formatRelationType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extract wiki-style links from markdown content
 * Returns array of linked node IDs
 */
export function extractWikiLinks(content: string): string[] {
  const linkRegex = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    if (match[1]) {
      links.push(match[1]);
    }
  }

  return links;
}

/**
 * Create a wiki-style link
 */
export function createWikiLink(nodeId: string, label?: string): string {
  if (label) {
    return `[[${nodeId}|${label}]]`;
  }
  return `[[${nodeId}]]`;
}
