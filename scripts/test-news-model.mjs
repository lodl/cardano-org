// Tests for src/utils/news/newsModel.js. Run with `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isRoutineSeries,
  selectLeadStory,
  selectEditorialShowcase,
  selectRecurringBeats,
  selectRecurringSeriesHistory,
  selectLatestVideos,
  filterNews,
  collectFilterOptions,
  selectRelatedNews,
  formatNewsDate,
  formatShortNewsDate,
  getPostCardImage,
} from '../src/utils/news/newsModel.js';

const makePost = (overrides) => ({
  slug: 'sample-post',
  title: 'Sample Post',
  permalink: '/news/sample-post',
  date: '2026-10-20',
  description: 'Sample description.',
  image: '/img/news-thumbs/sample.webp',
  youtubeId: null,
  externalUrl: 'https://cardano.org',
  externalHost: 'cardano.org',
  authors: [{ key: 'cf', name: 'Cardano Foundation', imageUrl: '/img/authors/cardano-foundation.png' }],
  tags: ['ecosystem'],
  ...overrides,
});

test('selectLeadStory prefers non-routine editorial posts with media', () => {
  const posts = [
    makePost({ slug: '2026-11-15-intersect-weekly-update', tags: ['governance'] }),
    makePost({ slug: '2026-11-13-weekly-development-report', tags: ['development'] }),
    makePost({ slug: '2026-11-11-community-digest', tags: ['community'] }),
    makePost({ slug: '2026-11-10-petrobras-pilot', title: 'Petrobras Pilot', tags: ['ecosystem'] }),
  ];
  assert.equal(selectLeadStory(posts).slug, '2026-11-10-petrobras-pilot');
  assert.equal(isRoutineSeries(posts[0]), true);
  assert.equal(isRoutineSeries(posts[3]), false);
});

test('selectLeadStory falls back gracefully when only development posts exist', () => {
  const posts = [
    makePost({ slug: '2026-11-13-weekly-development-report', tags: ['development'] }),
    makePost({ slug: '2026-11-06-weekly-development-report', tags: ['development'] }),
  ];
  assert.equal(selectLeadStory(posts).slug, '2026-11-13-weekly-development-report');
  assert.equal(selectLeadStory([]), null);
});

test('selectEditorialShowcase picks 1 lead and 2 category-diverse non-routine spotlights', () => {
  const posts = [
    makePost({ slug: '2026-11-15-intersect-weekly-update', tags: ['governance'] }),
    makePost({ slug: '2026-11-13-weekly-development-report', tags: ['development'] }),
    makePost({ slug: '2026-10-28-developer-survey', tags: ['development'] }),
    makePost({ slug: '2026-10-21-mica-review', tags: ['ecosystem'] }),
    makePost({ slug: '2026-10-20-hydra-v2', tags: ['development'] }),
    makePost({ slug: '2026-10-12-token2049', tags: ['events'] }),
  ];

  const showcase = selectEditorialShowcase(posts);
  assert.equal(showcase.lead.slug, '2026-10-21-mica-review');
  assert.deepEqual(
    showcase.spotlights.map((p) => p.slug),
    ['2026-10-28-developer-survey', '2026-10-12-token2049']
  );
});

test('selectRecurringBeats finds latest issue of each recurring series', () => {
  const posts = [
    makePost({ slug: '2026-11-15-intersect-weekly-update', tags: ['governance'] }),
    makePost({ slug: '2026-11-13-weekly-development-report', tags: ['development'] }),
    makePost({ slug: '2026-11-11-community-digest', tags: ['community'] }),
    makePost({ slug: '2026-11-06-weekly-development-report', tags: ['development'] }),
  ];
  const beats = selectRecurringBeats(posts);
  assert.deepEqual(
    beats.map((b) => [b.id, b.post.slug]),
    [
      ['weekly-dev', '2026-11-13-weekly-development-report'],
      ['community-digest', '2026-11-11-community-digest'],
      ['intersect-update', '2026-11-15-intersect-weekly-update'],
    ]
  );
});

test('selectRecurringSeriesHistory returns latest plus previous issues per series', () => {
  const posts = [
    makePost({ slug: '2026-11-13-weekly-development-report', date: '2026-11-13' }),
    makePost({ slug: '2026-11-06-weekly-development-report', date: '2026-11-06' }),
    makePost({ slug: '2026-10-30-weekly-development-report', date: '2026-10-30' }),
    makePost({ slug: '2026-10-23-weekly-development-report', date: '2026-10-23' }),
    makePost({ slug: '2026-11-11-community-digest', date: '2026-11-11' }),
  ];

  const history = selectRecurringSeriesHistory(posts, 3);
  assert.equal(history.length, 2);
  assert.equal(history[0].id, 'weekly-dev');
  assert.equal(history[0].latest.slug, '2026-11-13-weekly-development-report');
  assert.deepEqual(
    history[0].previous.map((p) => p.slug),
    ['2026-11-06-weekly-development-report', '2026-10-30-weekly-development-report']
  );
  assert.equal(history[1].id, 'community-digest');
  assert.equal(history[1].previous.length, 0);
});

test('selectLatestVideos returns newest video posts', () => {
  const posts = [
    makePost({ slug: 'a', youtubeId: null }),
    makePost({ slug: 'v1', youtubeId: 'KrQ4tGbw5Hg' }),
    makePost({ slug: 'v2', youtubeId: 'KXt_OrtsHc4' }),
    makePost({ slug: 'v3', youtubeId: 'vaslzZMAbog' }),
    makePost({ slug: 'v4', youtubeId: 'DgpiAHP7Et0' }),
  ];
  assert.deepEqual(
    selectLatestVideos(posts, 3).map((p) => p.slug),
    ['v1', 'v2', 'v3']
  );
});

test('filterNews combines category, author, format, year, scope, and diacritic-insensitive query', () => {
  const posts = [
    makePost({
      slug: 'leios-post',
      title: 'Ouroboros Leios rollout milestone',
      date: '2026-10-20',
      tags: ['development', 'research'],
      authors: [{ key: 'iog', name: 'Input Output Global', imageUrl: '/x.png' }],
      externalHost: 'iog.io',
    }),
    makePost({
      slug: '2026-11-13-weekly-development-report',
      title: 'Weekly development report',
      date: '2026-11-13',
      tags: ['development'],
      authors: [{ key: 'iog', name: 'Input Output Global', imageUrl: '/x.png' }],
    }),
    makePost({
      slug: 'video-gov',
      title: 'Constitutional Committee Café Roundtable',
      date: '2026-07-16',
      image: null,
      youtubeId: 'KrQ4tGbw5Hg',
      tags: ['governance'],
      authors: [{ key: 'community', name: 'Cardano Community', imageUrl: '/y.png' }],
    }),
    makePost({
      slug: 'old-eco',
      title: '2024 Summit Recap',
      date: '2024-10-25',
      tags: ['events'],
      authors: [{ key: 'cf', name: 'Cardano Foundation', imageUrl: '/z.png' }],
    }),
  ];

  assert.equal(filterNews(posts, { category: 'research' }).length, 1);
  assert.equal(filterNews(posts, { author: 'iog', year: '2026' }).length, 2);
  assert.deepEqual(
    filterNews(posts, { scope: 'editorial' }).map((p) => p.slug),
    ['leios-post', 'video-gov', 'old-eco']
  );
  assert.deepEqual(
    filterNews(posts, { scope: 'briefings' }).map((p) => p.slug),
    ['2026-11-13-weekly-development-report']
  );
  assert.deepEqual(
    filterNews(posts, { format: 'video' }).map((p) => p.slug),
    ['video-gov']
  );
  assert.deepEqual(
    filterNews(posts, { format: 'article' }).map((p) => p.slug),
    ['leios-post', '2026-11-13-weekly-development-report', 'old-eco']
  );
  assert.deepEqual(
    filterNews(posts, { query: 'cafe committee' }).map((p) => p.slug),
    ['video-gov']
  );
});

test('collectFilterOptions aggregates tag counts, sorted authors, years, and videos', () => {
  const posts = [
    makePost({
      date: '2026-10-20',
      tags: ['development', 'research'],
      authors: [{ key: 'iog', name: 'Input Output Global', imageUrl: '/a.png' }],
    }),
    makePost({
      date: '2026-07-16',
      youtubeId: 'KrQ4tGbw5Hg',
      tags: ['governance'],
      authors: [{ key: 'cf', name: 'Cardano Foundation', imageUrl: '/b.png' }],
    }),
    makePost({
      date: '2025-05-01',
      tags: ['governance'],
      authors: [{ key: 'cf', name: 'Cardano Foundation', imageUrl: '/b.png' }],
    }),
  ];

  const opts = collectFilterOptions(posts);
  assert.equal(opts.totalCount, 3);
  assert.equal(opts.videoCount, 1);
  assert.deepEqual(opts.years, ['2026', '2025']);
  assert.equal(opts.categoryCounts.governance, 2);
  assert.equal(opts.categoryCounts.research, 1);
  assert.equal(opts.authors[0].key, 'cf');
  assert.equal(opts.authors[0].count, 2);
});

test('selectRelatedNews excludes current post and prioritizes matching primary tag', () => {
  const posts = [
    makePost({ slug: 'current', tags: ['governance'] }),
    makePost({ slug: 'unrelated', tags: ['events'] }),
    makePost({ slug: 'secondary-match', tags: ['community', 'governance'] }),
    makePost({ slug: 'primary-match', tags: ['governance'] }),
  ];

  const related = selectRelatedNews(posts, 'current', ['governance'], 2);
  assert.deepEqual(
    related.map((p) => p.slug),
    ['primary-match', 'secondary-match']
  );
});

test('getPostCardImage uses image, then YouTube thumbnail, then category fallback', () => {
  const fallbacks = { governance: '/img/og/governance.jpg' };
  assert.deepEqual(
    getPostCardImage(makePost({ image: '/img/news-thumbs/a.webp', youtubeId: 'KrQ4tGbw5Hg', tags: ['governance'] }), fallbacks, '/img/og/default.jpg'),
    { primarySrc: '/img/news-thumbs/a.webp', fallbackSrc: '/img/og/governance.jpg' }
  );
  assert.deepEqual(
    getPostCardImage(makePost({ image: null, youtubeId: 'KrQ4tGbw5Hg', tags: ['governance'] }), fallbacks, '/img/og/default.jpg'),
    { primarySrc: 'https://i.ytimg.com/vi/KrQ4tGbw5Hg/hqdefault.jpg', fallbackSrc: '/img/og/governance.jpg' }
  );
  assert.deepEqual(
    getPostCardImage(makePost({ image: null, youtubeId: null, tags: ['unknown'] }), fallbacks, '/img/og/default.jpg'),
    { primarySrc: '/img/og/default.jpg', fallbackSrc: '/img/og/default.jpg' }
  );
});

test('formatNewsDate and formatShortNewsDate format YYYY-MM-DD cleanly', () => {
  assert.equal(formatNewsDate('2026-10-20', 'en-US'), 'October 20, 2026');
  assert.equal(formatShortNewsDate('2026-11-15', 'en-US'), 'Nov 15');
});
