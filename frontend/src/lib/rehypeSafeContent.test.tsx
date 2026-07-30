import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSafeContent from './rehypeSafeContent';
import { colorizeContent } from './utils';

/** Même pipeline que la page patchnote et les cards. */
function renderContent(content: string) {
  return render(
    <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSafeContent]}>{content}</ReactMarkdown>,
  );
}

describe('rehypeSafeContent', () => {
  it('drops script tags and their content', () => {
    const { container } = renderContent('Patch <script>alert(1)</script> notes');

    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).not.toContain('alert(1)');
  });

  it('drops style tags, which could hide the whole page', () => {
    const { container } = renderContent('<style>body { display: none }</style>Patch');

    expect(container.querySelector('style')).toBeNull();
    expect(container.textContent).toContain('Patch');
  });

  it('unwraps unknown tags but keeps their text', () => {
    const { container } = renderContent('<iframe src="https://evil.test">nope</iframe>');

    expect(container.querySelector('iframe')).toBeNull();
    expect(container.textContent).toContain('nope');
  });

  it('strips event handlers from allowed tags', () => {
    const { container } = renderContent('<img src="x" onerror="alert(1)" alt="boom">');

    const image = container.querySelector('img');
    expect(image).not.toBeNull();
    expect(image?.getAttribute('onerror')).toBeNull();
    expect(image?.getAttribute('alt')).toBe('boom');
  });

  it('strips inline styles used to overlay the page', () => {
    const { container } = renderContent('<p style="position:fixed;inset:0">hijack</p>');

    expect(container.querySelector('p')?.getAttribute('style')).toBeNull();
  });

  it('drops javascript: links', () => {
    const { container } = renderContent('<a href="javascript:alert(1)">clic</a>');

    expect(container.querySelector('a')?.getAttribute('href')).toBeNull();
  });

  it('drops obfuscated javascript: links a scheme regex would miss', () => {
    const { container } = renderContent('<a href="java\nscript:alert(1)">clic</a>');

    expect(container.querySelector('a')?.getAttribute('href')).toBeNull();
  });

  it('keeps http links and relative paths', () => {
    const { container } = renderContent(
      '<a href="https://playdex.test/a">ext</a> <a href="/article/1">int</a>',
    );

    const [external, internal] = Array.from(container.querySelectorAll('a'));
    expect(external.getAttribute('href')).toBe('https://playdex.test/a');
    expect(internal.getAttribute('href')).toBe('/article/1');
  });

  it('keeps only the buff / debuff classes', () => {
    const { container } = renderContent(
      colorizeContent('[buff]+10 dmg[/buff]') + '<span class="fixed inset-0 bg-black">x</span>',
    );

    const [buff, injected] = Array.from(container.querySelectorAll('span'));
    expect(buff.className).toBe('buff');
    expect(injected.className).toBe('');
  });

  it('leaves markdown rendering untouched', () => {
    const { container } = renderContent('## Titre\n\n- **gras** et *italique*\n');

    expect(container.querySelector('h2')?.textContent).toBe('Titre');
    expect(container.querySelector('li strong')?.textContent).toBe('gras');
    expect(container.querySelector('li em')?.textContent).toBe('italique');
  });
});
