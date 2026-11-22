import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import { useBaseUrlUtils } from "@docusaurus/useBaseUrl";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { translate } from "@docusaurus/Translate";
import useImageFallback from "@site/src/utils/useImageFallback";
import {
  CATEGORY_IMAGES,
  DEFAULT_IMAGE,
  getCategoryLabels,
} from "@site/src/utils/news/categories";
import { formatNewsDate, getPostCardImage } from "@site/src/utils/news/newsModel";
import styles from "./styles.module.css";

const VARIANT_CLASSES = {
  grid: styles.cardGrid,
  lead: styles.cardLead,
  spotlight: styles.cardSpotlight,
  row: styles.cardRow,
  cinema: styles.cardCinema,
};

function CtaChevron() {
  return (
    <svg
      className={styles.ctaChevron}
      viewBox="0 0 14 14"
      width="13"
      height="13"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 3L9 7L5 11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Editorial news card supporting grid, lead, spotlight, wire row, and cinema
 * video variants.
 *
 * @param {object} props
 * @param {object} props.post News entry from newsIndex.json.
 * @param {"grid"|"lead"|"spotlight"|"row"|"cinema"} [props.variant="grid"] Card layout variant.
 * @param {boolean} [props.featured=false] Shorthand to render the lead variant.
 * @param {number} [props.headingLevel=3] Heading level for the card title (2 or 3).
 * @param {string} [props.className] Extra class on the card link.
 */
export default function NewsCard({
  post,
  variant = "grid",
  featured = false,
  headingLevel = 3,
  className,
}) {
  const activeVariant = featured ? "lead" : variant;
  const { withBaseUrl } = useBaseUrlUtils();
  const { i18n } = useDocusaurusContext();
  const { ref, onError, hasFailed } = useImageFallback();

  const dateLocale =
    i18n.localeConfigs[i18n.currentLocale]?.htmlLang || i18n.currentLocale;
  const categoryLabels = getCategoryLabels();
  const primaryCategory = post.tags?.[0];
  const categoryLabel = primaryCategory ? categoryLabels[primaryCategory] : null;

  const { primarySrc, fallbackSrc } = getPostCardImage(
    post,
    CATEGORY_IMAGES,
    DEFAULT_IMAGE
  );
  const resolvedPrimary = /^https?:\/\//.test(primarySrc)
    ? primarySrc
    : withBaseUrl(primarySrc);
  const resolvedFallback = withBaseUrl(fallbackSrc);
  const displaySrc = hasFailed(resolvedPrimary) ? resolvedFallback : resolvedPrimary;

  const primaryAuthor = post.authors?.[0];
  const TitleTag = headingLevel === 2 ? "h2" : "h3";
  const formattedDate = formatNewsDate(post.date, dateLocale);
  const ctaText = post.youtubeId
    ? translate({ id: "news.card.watchVideo", message: "Watch video" })
    : activeVariant === "lead"
      ? translate({ id: "news.card.readStory", message: "Read story" })
      : translate({ id: "news.card.readMore", message: "Read summary" });

  if (activeVariant === "row") {
    return (
      <Link
        to={post.permalink}
        data-category={primaryCategory || undefined}
        className={clsx(styles.card, styles.cardRow, className)}
      >
        <div className={styles.rowDateCol}>
          <time className={styles.rowDate} dateTime={post.date}>
            {formattedDate}
          </time>
          {primaryAuthor && (
            <span className={styles.rowAuthor}>{primaryAuthor.name}</span>
          )}
        </div>

        <div className={styles.rowMainCol}>
          <div className={styles.eyebrow}>
            {categoryLabel && (
              <span
                className={styles.catPill}
                data-category={primaryCategory || undefined}
              >
                <span className={styles.catDot} aria-hidden="true" />
                <span className={styles.catLabel}>{categoryLabel}</span>
              </span>
            )}
            {post.youtubeId && (
              <span className={styles.inlineVideoTag}>
                {translate({ id: "news.card.video", message: "Video" })}
              </span>
            )}
          </div>
          <TitleTag className={styles.rowTitle}>{post.title}</TitleTag>
          {post.description && (
            <p className={styles.rowDesc}>{post.description}</p>
          )}
          <span className={styles.rowSource}>
            <span>{post.externalHost || ctaText}</span>
            <CtaChevron />
          </span>
        </div>

        <div className={styles.rowThumb} ref={ref}>
          <img
            src={displaySrc}
            alt=""
            className={styles.mediaImg}
            loading="lazy"
            onError={onError}
          />
          {post.youtubeId && (
            <span className={styles.miniPlay} aria-hidden="true">
              <svg viewBox="0 0 12 12" width="10" height="10">
                <polygon points="2,1 11,6 2,11" fill="currentColor" />
              </svg>
            </span>
          )}
        </div>
      </Link>
    );
  }

  const isCinema = activeVariant === "cinema";
  const isLead = activeVariant === "lead";

  return (
    <Link
      to={post.permalink}
      data-category={primaryCategory || undefined}
      className={clsx(
        styles.card,
        VARIANT_CLASSES[activeVariant] || styles.cardGrid,
        className
      )}
    >
      <div className={styles.media} ref={ref}>
        <img
          src={displaySrc}
          alt=""
          className={styles.mediaImg}
          loading={isLead ? "eager" : "lazy"}
          onError={onError}
        />
        {isCinema ? (
          <span className={styles.playOverlay} aria-hidden="true">
            <svg viewBox="0 0 20 20" width="18" height="18">
              <polygon points="6,4 16,10 6,16" fill="currentColor" />
            </svg>
          </span>
        ) : (
          post.youtubeId && (
            <span className={styles.videoBadge}>
              <svg
                className={styles.videoIcon}
                viewBox="0 0 12 12"
                width="10"
                height="10"
                aria-hidden="true"
              >
                <polygon points="2,1 11,6 2,11" fill="currentColor" />
              </svg>
              {translate({ id: "news.card.video", message: "Video" })}
            </span>
          )
        )}
      </div>

      <div className={styles.body}>
        {isLead && (
          <span className={styles.leadKicker}>
            {translate({ id: "news.card.featured", message: "Featured story" })}
          </span>
        )}

        <div className={styles.eyebrow}>
          {categoryLabel && (
            <span
              className={styles.catPill}
              data-category={primaryCategory || undefined}
            >
              <span className={styles.catDot} aria-hidden="true" />
              <span className={styles.catLabel}>{categoryLabel}</span>
            </span>
          )}
          <time className={styles.date} dateTime={post.date}>
            {formattedDate}
          </time>
        </div>

        <TitleTag className={styles.title}>{post.title}</TitleTag>

        {post.description && (
          <p className={styles.description}>{post.description}</p>
        )}

        <div className={styles.footer}>
          <div className={styles.authorInfo}>
            {primaryAuthor && (
              <>
                <img
                  src={withBaseUrl(primaryAuthor.imageUrl)}
                  alt={primaryAuthor.name}
                  className={styles.authorAvatar}
                  loading="lazy"
                />
                <span className={styles.authorName}>{primaryAuthor.name}</span>
              </>
            )}
          </div>
          <span className={styles.cta}>
            <span>
              {isLead
                ? ctaText
                : post.externalHost
                  ? post.externalHost
                  : ctaText}
            </span>
            <CtaChevron />
          </span>
        </div>
      </div>
    </Link>
  );
}
