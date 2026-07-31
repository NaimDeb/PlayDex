import type { Element, Properties, Root, RootContent } from "hast";

/**
 * Assainit l'arbre produit par rehype-raw : le contenu d'une patchnote est
 * éditable par n'importe quel utilisateur, une balise collée dedans ne doit
 * jamais devenir un élément actif (script, iframe, onerror, javascript:…).
 *
 * À brancher APRÈS rehype-raw, seul plugin qui matérialise le HTML brut.
 */

type ContentNode = RootContent | Element["children"][number];

/** Balises que markdown produit lui-même ; les autres sont déballées, leur texte reste. */
const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "blockquote", "pre", "code", "span", "em", "strong", "del",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "a",
  "table", "thead", "tbody", "tr", "th", "td",
]);

/**
 * Balises retirées avec leur contenu : rien de lisible dedans, ou requête vers
 * un tiers. Une img chargée depuis un domaine quelconque livre l'IP de chaque
 * lecteur à qui a écrit la patchnote.
 */
const DROPPED_TAGS = new Set([
  "script", "style", "noscript", "template", "textarea", "title", "head", "img",
]);

/** Tout attribut absent de cette liste saute, y compris les on* et style. */
const ALLOWED_ATTRIBUTES: Record<string, ReadonlySet<string>> = {
  a: new Set(["href", "title"]),
  span: new Set(["className"]),
  code: new Set(["className"]),
  pre: new Set(["className"]),
  ol: new Set(["start"]),
  th: new Set(["align"]),
  td: new Set(["align"]),
};

/** Nos classes de coloration, plus celles dont la coloration syntaxique a besoin. */
const ALLOWED_CLASS = /^(?:buff|debuff|nerf|language-[\w+#-]+)$/;

const URL_ATTRIBUTES = new Set(["href", "src"]);

const SAFE_SCHEME = /^(?:https?|mailto):/i;

/**
 * Une URL relative est sûre ; sinon seuls http(s) et mailto passent. On ne
 * cherche pas à reconnaître le protocole (`java\nscript:` en est un pour le
 * navigateur, pas pour une regex) : tout ce qui n'est pas relatif doit prouver
 * qu'il commence par un protocole autorisé.
 */
function isSafeUrl(value: string): boolean {
  const colon = value.indexOf(":");

  if (colon === -1) return true;

  // Un ':' après le premier /, ? ou # fait partie du chemin, pas d'un protocole.
  for (const separator of ["/", "?", "#"]) {
    const position = value.indexOf(separator);
    if (position !== -1 && position < colon) return true;
  }

  return SAFE_SCHEME.test(value.trim());
}

function keptClasses(value: Properties[string]): string[] {
  const classes = Array.isArray(value) ? value : String(value ?? "").split(/\s+/);

  return classes.map(String).filter((name) => ALLOWED_CLASS.test(name));
}

function sanitizeProperties(element: Element): void {
  const allowed = ALLOWED_ATTRIBUTES[element.tagName];

  if (allowed === undefined) {
    element.properties = {};
    return;
  }

  const kept: Properties = {};

  for (const [name, value] of Object.entries(element.properties ?? {})) {
    if (!allowed.has(name)) continue;

    if (URL_ATTRIBUTES.has(name) && !isSafeUrl(String(value ?? ""))) continue;

    if (name === "className") {
      const classes = keptClasses(value);
      if (classes.length > 0) kept.className = classes;
      continue;
    }

    kept[name] = value;
  }

  element.properties = kept;
}

function sanitizeChildren(parent: { children: ContentNode[] }): void {
  const children = parent.children;

  for (let index = 0; index < children.length; index++) {
    const child = children[index];

    if (child.type !== "element") continue;

    if (DROPPED_TAGS.has(child.tagName)) {
      children.splice(index, 1);
      index--;
      continue;
    }

    // Déballage : la balise disparaît, son contenu est reparcouru à la même place.
    if (!ALLOWED_TAGS.has(child.tagName)) {
      children.splice(index, 1, ...child.children);
      index--;
      continue;
    }

    sanitizeProperties(child);
    sanitizeChildren(child);
  }
}

export default function rehypeSafeContent() {
  return (tree: Root): void => sanitizeChildren(tree);
}

/**
 * MDEditor branche rehype-raw dans sa preview sans laisser le choix : ses
 * previewOptions sont le seul endroit où glisser le filtre derrière.
 */
export const SAFE_PREVIEW_OPTIONS = { rehypePlugins: [rehypeSafeContent] };
