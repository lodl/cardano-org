---
title: News Category Tiles
description: Category filter tiles for the news index and the tag pages on cardano.org, including counts, active state, and the mobile scroll behaviour.
---

import NewsCategoryTiles from '@site/src/components/NewsCategoryTiles';

## NewsCategoryTiles

The header block of every news listing: the one-line description of what the view holds, then the category filter row with one tile per canonical blog tag plus an "All" tile, each showing how many posts it holds.

Each tile is a plain link to the matching tag page (`/news/tags/<tag>`), so filtering works without JavaScript, every category keeps its own indexable URL, and the back button behaves as users expect. The current tile is filled with its category color and marked with `aria-current="page"`.

It renders on `/news` (through the swizzled `BlogListPage`), on every tag page (through the swizzled `BlogTagsPostsPage`), and above the article itself (through the swizzled `BlogPostPage`), so the filter stays in reach on every news route and the current category is always marked.

## Basic Usage

From `src/theme/BlogTagsPostsPage/index.js`:

```jsx
import NewsCategoryTiles from '@site/src/components/NewsCategoryTiles';
import {newsPathsFromTagPath} from '@site/src/data/newsCategories';

<NewsCategoryTiles
  intro={tag.description}
  {...newsPathsFromTagPath(tag.permalink, tag.allTagsPath)}
  activeTag="governance"
/>;
```

From `src/theme/BlogListPage/index.js`:

```jsx
import {newsPathsFromIndexPath} from '@site/src/data/newsCategories';

<NewsCategoryTiles
  intro={translate({
    id: 'news.index.intro',
    message: 'The complete Cardano feed, newest first, across every category.',
  })}
  {...newsPathsFromIndexPath(metadata.permalink)}
/>;
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `intro` | `ReactNode` | - | Lead line above the tiles. Each page passes its own (the tag description from `blog/tags.yml`, or the translated `news.index.intro` string); the article pages leave it out. |
| `activeTag` | `string` | - | Slug of the category currently being viewed. Omitted on `/news`, where "All" is the active tile. |
| `indexPath` | `string` | `/news/` | Path of the unfiltered listing, used by the "All" tile. |
| `tagsBasePath` | `string` | `/news/tags/` | Tag base path the category links are appended to. |

Both paths come from the page rather than being hardcoded, because the blog plugin hands out locale-correct paths (`/news/` in an English build, `/de/news/` in the German one) while the tiles themselves render in every locale. The helpers `newsPathsFromIndexPath` and `newsPathsFromTagPath` derive them from the page metadata and also drop the `/page/<n>/` pagination segment.

## Live Preview

<NewsCategoryTiles activeTag="governance" />

## Data

Counts and labels come from `src/data/newsCounts.json`, which `scripts/generate-recent-news.js` writes during `yarn build-news` (part of `yarn start` and `yarn build`). The file is generated, never edited by hand. It holds the counts only, so the tiles do not pull the full post index (about 330 KB) onto every news route, including all 451 article pages.

- `postCount` is the number of posts, shown on the "All" tile.
- `tagCounts` maps each tag slug to the number of posts carrying it. A post counts once per tag, so the tag counts can add up to more than the post count.

The grid reads `src/data/newsIndex.json` (the thumbnails, summaries, authors, and source URLs) instead.

The tag list itself is fixed by `blog/tags.yml`, and the blog plugin is configured with `onInlineTags: 'throw'`, so a tag outside that file fails the build. `src/data/newsCategories.js` mirrors that list and is the single source of truth for the tag order, the labels, and the category images.

## Notes

- Category colors live in the card styles (`src/components/NewsCard/styles.module.css`) and in this file. The active fill is a separate token (`--tile-active-color`) because the white label needs 4.5:1 against it: the education tile, and the "All" tile in dark mode, use a darker variant of the same hue.
- Above 996px the eight tiles share the content width in one row. Below that the row becomes a horizontal scroll-snap track, so the tiles stay readable instead of shrinking into slivers.
- The component renders the lead line and the tiles. The listing below it is `NewsGrid`, and the card is `NewsCard` (see News Cards and Grid).
