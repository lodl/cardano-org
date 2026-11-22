import React from "react";
import Link from "@docusaurus/Link";
import Translate, { translate } from "@docusaurus/Translate";
import Grid from "@site/src/components/Layout/Grid";
import NewsCard from "@site/src/components/News/NewsCard";
import newsIndex from "@site/src/data/newsIndex.json";
import { selectRelatedNews } from "@site/src/utils/news/newsModel";
import styles from "./styles.module.css";

/**
 * Renders up to three related news articles at the bottom of a single news post.
 *
 * @param {object} props
 * @param {string} props.currentSlug Slug of the currently displayed post.
 * @param {string[]} [props.tags=[]] Tags of the currently displayed post.
 */
export default function RelatedNews({ currentSlug, tags = [] }) {
  const related = selectRelatedNews(newsIndex, currentSlug, tags, 3);
  if (related.length === 0) return null;

  return (
    <section
      className={styles.section}
      aria-labelledby="related-news-heading"
    >
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            <Translate id="news.related.eyebrow">Keep Reading</Translate>
          </p>
          <h2 id="related-news-heading" className={styles.heading}>
            <Translate id="news.related.heading">
              More from Cardano News
            </Translate>
          </h2>
        </div>
        <Link to="/news" className={styles.allLink}>
          <Translate id="news.related.viewAll">View all news</Translate>
        </Link>
      </div>

      <Grid
        minItemWidth="260px"
        gap="var(--site-space-lg)"
        stackOnMobile
        className={styles.grid}
      >
        {related.map((post) => (
          <NewsCard
            key={post.slug}
            post={post}
            variant="grid"
            headingLevel={3}
          />
        ))}
      </Grid>
    </section>
  );
}
