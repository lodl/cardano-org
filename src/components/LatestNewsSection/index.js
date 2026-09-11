import React from "react";
import Link from "@docusaurus/Link";
import { translate } from "@docusaurus/Translate";
import NewsCard from "@site/src/components/NewsCard";
import {
  CATEGORY_IMAGES,
  CATEGORY_LABELS,
  DEFAULT_IMAGE,
} from "@site/src/data/newsCategories";
import recentNews from "@site/src/data/recentNews.json";
import styles from "./styles.module.css";

/**
 * The homepage news section: the newest posts as cards, followed by the link to
 * the full news feed. Renders through the shared `NewsCard`, so the card looks
 * the same here and on the news pages; this section only adds the grid and
 * clamps the summary to three lines to keep the cards one height.
 */
export default function LatestNewsSection({ count = 3 }) {
  return (
    <section className={styles.newsSection}>
      <div className={styles.cardsGrid}>
        {recentNews.slice(0, count).map((post, index) => {
          const category = post.tags?.[0];
          return (
            <NewsCard
              key={post.permalink}
              // The fourth card onwards is a desktop extra: on small screens the
              // section shows the first three only.
              className={index >= 3 ? styles.desktopOnly : undefined}
              post={{
                title: post.title,
                date: post.date,
                category,
                categoryLabel: CATEGORY_LABELS[category],
                image: post.image || CATEGORY_IMAGES[category] || DEFAULT_IMAGE,
                description: post.description,
                author: post.authors?.[0],
                href: post.permalink,
                clampDescription: true,
              }}
            />
          );
        })}
      </div>

      <div className={styles.ctaWrapper}>
        <Link to="/news" className="button button--primary button--lg">
          {translate({id: "latestNews.viewAll", message: "View all news"})}
        </Link>
      </div>
    </section>
  );
}
