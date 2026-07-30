import { colorizeContent } from "./utils";

/**
 * Les patchnotes importées de Steam sont écrites en BBCode : sans conversion,
 * les [img], [list] et compagnie s'affichent tels quels dans le rendu markdown.
 */

/** Steam sert les images de ses patchnotes derrière ce placeholder. */
const STEAM_IMAGE_HOST = "https://clan.cloudflare.steamstatic.com/images";

/** Balises Steam sans équivalent markdown, ou restées orphelines : seul le contenu est gardé. */
const LEFTOVER_TAGS =
  /\[\/?(?:b|i|u|strike|noparse|spoiler|code|quote|url|img|list|olist|table|tr|th|td|expand|carousel|dynamiclink|previewyoutube|p|h[1-6])(?:[=\s][^\]]*)?\]/gi;

/**
 * Steam écrit tout sur une seule ligne et délimite ses paragraphes par [p] :
 * c'est cette balise qui porte la structure du texte, pas les retours à la ligne.
 */
function unwrapParagraphs(text: string): string {
  return text.replace(/\[p\]/gi, "").replace(/\[\/p\]/gi, "\n");
}

/** Un item de liste ou une ligne de citation tient sur une ligne, paragraphes compris. */
function toInlineText(text: string): string {
  return unwrapParagraphs(text).replace(/\s+/g, " ").trim();
}

/** Steam ouvre un item par [*] et le ferme par [/*]. */
function toListBlock(items: string, marker: string): string {
  const lines = items
    .split(/\[\/?\*\]/)
    .map((item) => toInlineText(item))
    .filter(Boolean)
    .map((item) => `${marker} ${item}`);

  return `\n\n${lines.join("\n")}\n\n`;
}

export function steamBbcodeToMarkdown(content: string): string {
  return content
    .replace(/\{STEAM_CLAN(?:_LOC)?_IMAGE\}/g, STEAM_IMAGE_HOST)
    .replace(
      /\[h([1-6])\]([\s\S]*?)\[\/h\1\]/gi,
      (_match, level: string, text: string) => `\n\n${"#".repeat(Number(level))} ${text.trim()}\n\n`,
    )
    .replace(/\[olist\]([\s\S]*?)\[\/olist\]/gi, (_match, items: string) => toListBlock(items, "1."))
    .replace(/\[list\]([\s\S]*?)\[\/list\]/gi, (_match, items: string) => toListBlock(items, "-"))
    .replace(/\[quote(?:=[^\]]*)?\]([\s\S]*?)\[\/quote\]/gi, (_match, text: string) => {
      const lines = unwrapParagraphs(text)
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      return `\n\n> ${lines.join("\n> ")}\n\n`;
    })
    .replace(
      /\[code\]([\s\S]*?)\[\/code\]/gi,
      (_match, code: string) => `\n\n\`\`\`\n${unwrapParagraphs(code).trim()}\n\`\`\`\n\n`,
    )
    // Après les blocs : dedans, [p] est une ligne, dehors c'est un paragraphe.
    .replace(/\[p\]([\s\S]*?)\[\/p\]/gi, (_match, text: string) => `\n\n${text.trim()}\n\n`)
    .replace(/\[img\]\s*([^[\]]*?)\s*\[\/img\]/gi, "\n\n![]($1)\n\n")
    .replace(/\[url=["']?([^\]"']+)["']?\]([\s\S]*?)\[\/url\]/gi, "[$2]($1)")
    .replace(/\[url\]\s*([^[\]]*?)\s*\[\/url\]/gi, "[$1]($1)")
    .replace(
      /\[previewyoutube=([\w-]+)[^\]]*\]\s*(?:\[\/previewyoutube\])?/gi,
      "\n\n[youtu.be/$1](https://youtu.be/$1)\n\n",
    )
    .replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "**$1**")
    .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "*$1*")
    .replace(/\[hr\]\s*(?:\[\/hr\])?/gi, "\n\n---\n\n")
    .replace(/\s*\[\*\]\s*/g, "\n- ")
    .replace(/\[\/\*\]/g, "")
    .replace(LEFTOVER_TAGS, "")
    // Chaque bloc pose ses propres sauts de ligne : on retombe sur un paragraphe.
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Rendu complet d'une patchnote : BBCode Steam puis nos marqueurs [buff]/[debuff]. */
export function formatPatchnoteContent(content: string): string {
  return colorizeContent(steamBbcodeToMarkdown(content));
}
