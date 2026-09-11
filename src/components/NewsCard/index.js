import React, { useLayoutEffect, useRef } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import { useBaseUrlUtils } from "@docusaurus/useBaseUrl";
import { translate } from "@docusaurus/Translate";
import styles from "./styles.module.css";

// Both consumers render through this component - the homepage section
// (LatestNewsSection) and the news listing (NewsGrid) - so the card markup and
// the category colors exist once instead of twice. They differ only in the props
// they pass: the homepage clamps the summary to three lines and links to the
// post's own page, the listing prints the whole summary and links to the
// original article on the publisher's site.

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * One news card: banner thumbnail, date and category badge, headline, summary,
 * and a footer naming the author next to where the card leads.
 *
 * @param {{post: {
 *   title: string,
 *   date: string,
 *   category?: string,
 *   categoryLabel?: string,
 *   image?: string,
 *   description?: string,
 *   author?: {name: string, imageUrl?: string} | null,
 *   href: string,
 *   external?: boolean,
 *   clampDescription?: boolean,
 * }, className?: string}} props
 *   `external` opens the link in a new tab and marks it with an arrow; it is
 *   false on the homepage, which links to the post's own page inside the site.
 *   `clampDescription` cuts the summary to three lines, for grids with a fixed
 *   card height.
 */
export default function NewsCard({ post, className }) {
  const { withBaseUrl } = useBaseUrlUtils();
  const {
    title,
    date,
    category,
    categoryLabel,
    image,
    description,
    author,
    href,
    external = false,
    clampDescription = false,
  } = post;

  const descriptionRef = useRef(null);

  // The CSS clamp cuts at the line edge, which lands mid-word ("withdrawal o...").
  // For the clamped variant, trim to whole words instead, measured against the
  // rendered height. The server-rendered HTML keeps the full text, so nothing is
  // lost when JavaScript is off.
  useLayoutEffect(() => {
    const el = descriptionRef.current;
    if (!clampDescription || !el || !description) return undefined;
    const full = description;
    el.textContent = full;
    const lineHeight = parseFloat(window.getComputedStyle(el).lineHeight) || 0;
    const maxHeight = lineHeight * 3 + 1;
    if (lineHeight && el.scrollHeight > maxHeight) {
      const words = full.split(/\s+/);
      let low = 0;
      let high = words.length;
      while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        el.textContent = `${words.slice(0, mid).join(" ")}…`;
        if (el.scrollHeight <= maxHeight) {
          low = mid;
        } else {
          high = mid - 1;
        }
      }
      el.textContent = `${words.slice(0, low).join(" ")}…`;
    }
    return () => {
      el.textContent = full;
    };
  }, [description, clampDescription]);

  const content = (
    <>
      <div className={styles.cardImageWrapper}>
        {image && (
          <img
            src={withBaseUrl(image)}
            alt=""
            className={styles.cardImage}
            loading="lazy"
          />
        )}
      </div>
      <div className={styles.cardMeta}>
        <span className={styles.cardDate}>{formatDate(date)}</span>
        {categoryLabel && (
          <span className={styles.categoryBadge} data-category={category}>
            {categoryLabel}
          </span>
        )}
      </div>
      <h3 className={styles.cardTitle}>{title}</h3>
      {description && (
        <p
          ref={descriptionRef}
          className={clsx(
            styles.cardDescription,
            clampDescription && styles.clamped,
          )}
        >
          {description}
        </p>
      )}
      <div className={styles.cardFooter}>
        <span className={styles.authorInfo}>
          {author?.name && (
            <>
              {author.imageUrl && (
                <img
                  src={withBaseUrl(author.imageUrl)}
                  alt=""
                  className={styles.authorAvatar}
                  loading="lazy"
                />
              )}
              <span className={styles.authorName}>{author.name}</span>
            </>
          )}
        </span>
        <span className={styles.cardSource}>
          {translate({ id: "latestNews.readMore", message: "Read more" })}
          {external && <span aria-hidden="true"> ↗</span>}
        </span>
      </div>
    </>
  );

  // The homepage card stays an internal link so Docusaurus keeps handling the
  // navigation; only cards that lead to another site become plain anchors.
  if (external) {
    return (
      <a
        className={clsx(styles.card, className)}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  return (
    <Link className={clsx(styles.card, className)} to={href}>
      {content}
    </Link>
  );
}
