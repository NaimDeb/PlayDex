import { describe, it, expect } from 'vitest';
import { steamBbcodeToMarkdown, formatPatchnoteContent } from './patchnoteContent';

describe('steamBbcodeToMarkdown', () => {
  it('removes images, URL included', () => {
    expect(
      steamBbcodeToMarkdown('Avant [img]{STEAM_CLAN_IMAGE}/40/banner.png[/img] apres'),
    ).toBe('Avant  apres');
  });

  it('removes an image inside a list without leaving its URL', () => {
    expect(
      steamBbcodeToMarkdown('[list][*][img]https://a.test/pixel.gif[/img]un[/list]').trim(),
    ).toBe('- un');
  });

  it('still rewrites the Steam placeholder found in a link', () => {
    expect(steamBbcodeToMarkdown('[url={STEAM_CLAN_IMAGE}/40/a.png]voir[/url]')).toBe(
      '[voir](https://clan.cloudflare.steamstatic.com/images/40/a.png)',
    );
  });

  it('converts headings', () => {
    expect(steamBbcodeToMarkdown('[h2]Nouveautés[/h2]').trim()).toBe('## Nouveautés');
  });

  it('converts bold and italic', () => {
    expect(steamBbcodeToMarkdown('[b]gras[/b] et [i]italique[/i]')).toBe('**gras** et *italique*');
  });

  it('converts a bullet list', () => {
    expect(steamBbcodeToMarkdown('[list][*]un[*]deux[/list]').trim()).toBe('- un\n- deux');
  });

  it('numbers an ordered list', () => {
    expect(steamBbcodeToMarkdown('[olist][*]un[*]deux[/olist]').trim()).toBe('1. un\n1. deux');
  });

  it('converts both link forms', () => {
    expect(steamBbcodeToMarkdown('[url=https://a.test]site[/url]')).toBe('[site](https://a.test)');
    expect(steamBbcodeToMarkdown('[url]https://a.test[/url]')).toBe(
      '[https://a.test](https://a.test)',
    );
  });

  it('turns a youtube preview into a link', () => {
    expect(steamBbcodeToMarkdown('[previewyoutube=abc-123;full][/previewyoutube]').trim()).toBe(
      '[youtu.be/abc-123](https://youtu.be/abc-123)',
    );
  });

  it('converts quotes and code blocks', () => {
    expect(steamBbcodeToMarkdown('[quote=dev]merci[/quote]').trim()).toBe('> merci');
    expect(steamBbcodeToMarkdown('[code]npm i[/code]').trim()).toBe('```\nnpm i\n```');
  });

  it('turns [p] paragraphs into real line breaks', () => {
    expect(steamBbcodeToMarkdown('[p]Premier[/p][p]Second[/p]').trim()).toBe('Premier\n\nSecond');
  });

  it('keeps a list item on one line, [p] and [/*] included', () => {
    expect(steamBbcodeToMarkdown('[list][*][p]un[/p][/*][*][p]deux[/p][/*][/list]').trim()).toBe(
      '- un\n- deux',
    );
  });

  // Contenu réel d'une mise à jour Counter-Strike 2 : tout tient sur une ligne.
  it('structures a real steam patchnote written on a single line', () => {
    const steam =
      '[p]\\[ MAP SCRIPTING ][/p][list][*][p]Fixed a bug where scripts would fail to load.[/p][/*][/list][p][/p]' +
      '[p]Boulder[/p][list][*][p]Updated from the Workshop ([url="https://steamcommunity.com/a"]Update Notes[/url])[/p][/*][/list]';

    expect(steamBbcodeToMarkdown(steam)).toBe(
      '\\[ MAP SCRIPTING ]\n\n' +
        '- Fixed a bug where scripts would fail to load.\n\n' +
        'Boulder\n\n' +
        '- Updated from the Workshop ([Update Notes](https://steamcommunity.com/a))',
    );
  });

  it('removes leftover steam-only tags without eating the text', () => {
    expect(steamBbcodeToMarkdown('[spoiler]secret[/spoiler] [expand type=a]suite[/expand]')).toBe(
      'secret suite',
    );
  });

  it('leaves bracketed text that is not a steam tag alone', () => {
    expect(steamBbcodeToMarkdown('[PC] correctif [1.2.3]')).toBe('[PC] correctif [1.2.3]');
  });

  it('leaves our own buff / debuff markers to colorizeContent', () => {
    expect(formatPatchnoteContent('[b]Fusil[/b] : [buff]+10 dmg[/buff]')).toBe(
      '**Fusil** : <span class="buff">+10 dmg</span>',
    );
  });
});
