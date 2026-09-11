/**
 * Tests for the text handling in scripts/generate-recent-news.js, the generator
 * behind the news card data.
 *
 * Why these three helpers
 * -----------------------
 * They decide what a card shows and where it leads, and both are invisible
 * until someone reads the page:
 *
 *   - `toExcerpt` cuts the summary that ships in newsIndex.json. It has to cut
 *     on a word boundary, because a card that ends "withdrawal o..." looks
 *     broken (the repo fixed that once already, in PR #775).
 *   - `extractSourceUrl` picks the link the card opens. The authoring guide
 *     asks for a bolded "Read more" link; when it is missing, the function
 *     falls back to the first external link in the body, which is only correct
 *     while the guide is followed. The generator warns about those posts, and
 *     these tests pin the preference order down.
 *   - `extractDescription` takes the post's first paragraph, skipping images
 *     and HTML blocks, so a card never shows an image path as its text.
 *
 * Requiring the generator also reads blog/authors.yml and the post list, since
 * that happens at module level; the tests only use the exported helpers.
 */

const assert = require('node:assert');

const {
  getPostBody,
  extractDescription,
  toExcerpt,
  extractSourceUrl,
} = require('./generate-recent-news.js');

let passed = 0;
const fails = [];

function expect(name, actual, wanted) {
  try {
    assert.deepStrictEqual(actual, wanted);
    passed += 1;
    console.log(`  ok   ${name}`);
  } catch {
    fails.push({ name, actual, wanted });
    console.log(`  FAIL ${name}`);
  }
}

const FRONTMATTER = '---\ntitle: Test\n---\n';

// ============================================================
// getPostBody
// ============================================================

console.log('\ngetPostBody');
expect(
  'drops the frontmatter',
  getPostBody(`${FRONTMATTER}Body text`).trim(),
  'Body text',
);
expect('returns empty for frontmatter only', getPostBody(FRONTMATTER).trim(), '');

// ============================================================
// extractDescription
// ============================================================

console.log('\nextractDescription');
expect(
  'takes the first paragraph',
  extractDescription(`${FRONTMATTER}First paragraph.\n\nSecond paragraph.`),
  'First paragraph.',
);
expect(
  'joins wrapped lines of one paragraph',
  extractDescription(`${FRONTMATTER}Line one\nline two.\n\nSecond.`),
  'Line one line two.',
);
expect(
  'skips an image line before the text',
  extractDescription(`${FRONTMATTER}![banner](./banner.webp)\n\nThe summary text.`),
  'The summary text.',
);
expect(
  'skips an HTML block before the text',
  extractDescription(`${FRONTMATTER}<div style={{textAlign: 'right'}}>\n\nThe summary text.`),
  'The summary text.',
);
expect(
  'strips markdown emphasis and links',
  extractDescription(`${FRONTMATTER}Text with **bold** and [a link](https://example.com).`),
  'Text with bold and a link.',
);

// ============================================================
// toExcerpt
// ============================================================

console.log('\ntoExcerpt');
expect('keeps a short text untouched', toExcerpt('Short summary.'), 'Short summary.');

const LONG_WORD = 'word';
const longText = Array.from({ length: 400 }, () => LONG_WORD).join(' ');
const excerpt = toExcerpt(longText);
expect('marks the cut', excerpt.endsWith('…'), true);
expect(
  'is a prefix of the source',
  longText.startsWith(excerpt.slice(0, -1)),
  true,
);
expect(
  'cuts at a word boundary',
  longText.charAt(excerpt.slice(0, -1).length),
  ' ',
);
expect('stays within the limit', excerpt.length <= 601, true);

// ============================================================
// extractSourceUrl
// ============================================================

console.log('\nextractSourceUrl');
expect(
  'prefers a bolded Read more link',
  extractSourceUrl(
    `${FRONTMATTER}Summary.\n\n[**Read more**](https://example.com/story)\n\n![img](./b.webp)`,
    'test-slug',
  ),
  'https://example.com/story',
);
expect(
  'prefers Read more over an earlier external link',
  extractSourceUrl(
    `${FRONTMATTER}Summary mentions [a partner](https://partner.example) first.\n\n[Read more](https://example.com/story)`,
    'test-slug',
  ),
  'https://example.com/story',
);
expect(
  'falls back to the first external link',
  extractSourceUrl(
    `${FRONTMATTER}Summary with [the source](https://example.com/story) only.`,
    'test-slug',
  ),
  'https://example.com/story',
);
expect(
  'ignores internal links in the fallback',
  extractSourceUrl(
    `${FRONTMATTER}Summary with [an internal link](/docs/go) and [the source](https://example.com/story).`,
    'test-slug',
  ),
  'https://example.com/story',
);
expect(
  'returns null when the body has no external link',
  extractSourceUrl(`${FRONTMATTER}Summary without links.`, 'test-slug'),
  null,
);

// ============================================================
// Summary
// ============================================================

console.log(`\n${'='.repeat(60)}`);
console.log(`${passed} passed, ${fails.length} failed`);
if (fails.length > 0) {
  console.log('\nFailures:');
  for (const f of fails) {
    console.log(`  - ${f.name}`);
    console.log(`      expected ${JSON.stringify(f.wanted)}`);
    console.log(`      got      ${JSON.stringify(f.actual)}`);
  }
}
process.exit(fails.length > 0 ? 1 : 0);
