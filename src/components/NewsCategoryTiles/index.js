import React from "react";
import Link from "@docusaurus/Link";
import { translate } from "@docusaurus/Translate";
import {
  CATEGORY_LABELS,
  CATEGORY_SLUGS,
  categoryPath,
} from "@site/src/data/newsCategories";
import newsIndex from "@site/src/data/newsIndex.json";
import styles from "./styles.module.css";

// Label of a category comes from blog/tags.yml through CATEGORY_LABELS; the
// translation id is derived from the slug so each label can be translated.
// Exported because the category pages use it as their heading.
export function categoryLabel(slug) {
  const message = CATEGORY_LABELS[slug] || slug;
  return translate({ id: `news.category.${slug}`, message });
}

/**
 * Header block of a news view: the one-line description of what the view holds,
 * directly above the category tiles. Each page passes its own line (the tag
 * description from blog/tags.yml on a category page, the blog description from
 * docusaurus.config.js on the news index), so the line lives here instead of
 * being repeated in every page.
 *
 * @param {{intro?: React.ReactNode, activeTag?: string, indexPath?: string, tagsBasePath?: string}} props
 *   `intro` is optional: the article pages render the tiles without it.
 *   `activeTag` is a category slug, or undefined on the unfiltered list page.
 *   `indexPath` and `tagsBasePath` come from the page (see
 *   `newsPathsFromIndexPath` and `newsPathsFromTagPath`); the defaults fit the
 *   English build.
 */
export default function NewsCategoryTiles({
  intro,
  activeTag,
  indexPath = "/news/",
  tagsBasePath = "/news/tags/",
}) {
  const counts = newsIndex.tagCounts || {};

  const tiles = [
    {
      slug: "all",
      label: translate({ id: "news.category.all", message: "All" }),
      to: indexPath,
      count: newsIndex.posts.length,
      active: !activeTag,
    },
    ...CATEGORY_SLUGS.map((slug) => ({
      slug,
      label: categoryLabel(slug),
      to: categoryPath(tagsBasePath, slug),
      count: counts[slug] || 0,
      active: activeTag === slug,
    })),
  ];

  return (
    <div className={styles.section}>
      {intro && <p className={styles.intro}>{intro}</p>}
      <nav
        className={styles.tiles}
        aria-label={translate({
          id: "news.categories.navLabel",
          message: "Filter news by category",
        })}
      >
        {tiles.map((tile) => (
          <Link
            key={tile.slug}
            to={tile.to}
            className={styles.tile}
            data-category={tile.slug}
            data-active={tile.active ? "true" : undefined}
            aria-current={tile.active ? "page" : undefined}
          >
            <span className={styles.tileLabel}>{tile.label}</span>
            <span className={styles.tileCount}>
              {tile.count}
              <span className={styles.srOnly}>
                {" "}
                {translate({
                  id: "news.category.postCount",
                  message: "posts",
                })}
              </span>
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
