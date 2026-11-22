import React, { useId } from "react";
import clsx from "clsx";
import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import { useLocation } from "@docusaurus/router";
import Translate, { translate } from "@docusaurus/Translate";
import BoundaryBox from "@site/src/components/Layout/BoundaryBox";
import OpenGraphInfo from "@site/src/components/Layout/OpenGraphInfo";
import PageCTA from "@site/src/components/Layout/PageCTA";
import RelatedNews from "@site/src/components/News/RelatedNews";
import newsIndex from "@site/src/data/newsIndex.json";
import { getCategoryLabels } from "@site/src/utils/news/categories";
import useCopyToClipboard from "@site/src/utils/useCopyToClipboard";
import styles from "./styles.module.css";

function normalizeNewsPath(pathname) {
  return pathname
    .replace(/^\/(?:ja|de|es|vi)(?=\/)/, "")
    .replace(/\/$/, "");
}

export default function BlogLayout(props) {
  const { toc, children, ...layoutProps } = props;
  const { pathname } = useLocation();
  const [copied, copyLink] = useCopyToClipboard({ resetAfter: 1800 });

  const normalizedPath = normalizeNewsPath(pathname);
  const currentPost = newsIndex.find(
    (item) => item.permalink.replace(/\/$/, "") === normalizedPath
  );
  const categoryLabels = getCategoryLabels();
  const primaryCategory = currentPost?.tags?.[0];
  const primaryCategoryLabel = primaryCategory
    ? categoryLabels[primaryCategory]
    : null;
  const hasToc = Boolean(toc);

  const rawId = useId().replace(/:/g, "");
  const arcGradId = `article-meridian-arc-${rawId}`;
  const formatOrSource = currentPost?.youtubeId
    ? translate({ id: "news.card.video", message: "Video" })
    : currentPost?.externalHost || null;

  const handleCopy = () => {
    if (!ExecutionEnvironment.canUseDOM) return;
    copyLink(window.location.href);
  };

  return (
    <Layout {...layoutProps}>
      {/* Blog posts set og:type "article" through the theme, so leave it out here */}
      <OpenGraphInfo pageName="cardano-news" type={null} />

      <div className={styles.newsPage}>
        <header
          className={styles.articleHero}
          data-category={primaryCategory || "ecosystem"}
        >
          <svg
            className={styles.heroSvg}
            viewBox="0 0 1440 280"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id={arcGradId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#C7C2E6" stopOpacity="0" />
                <stop offset="50%" stopColor="#FFFAF3" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#2FB7A8" stopOpacity="0.06" />
              </linearGradient>
            </defs>
            <g fill="none" stroke={`url(#${arcGradId})`} strokeWidth="1">
              <circle cx="1180" cy="40" r="135" />
              <circle cx="1180" cy="40" r="245" />
              <circle cx="1180" cy="40" r="365" />
            </g>
            <g fill="currentColor" className={styles.heroPulses}>
              <circle cx="1045" cy="40" r="3" />
              <circle cx="962" cy="182" r="2.5" />
            </g>
          </svg>

          <BoundaryBox className={styles.heroInner}>
            <nav
              className={styles.breadcrumbNav}
              aria-label={translate({
                id: "news.article.breadcrumbLabel",
                message: "Newsroom navigation",
              })}
            >
              <Link to="/news" className={styles.backLink}>
                <svg
                  viewBox="0 0 16 16"
                  width="14"
                  height="14"
                  aria-hidden="true"
                >
                  <path
                    d="M10 3.5L5.5 8L10 12.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <Translate id="news.article.backToNews">
                  Cardano Newsroom
                </Translate>
              </Link>

              {primaryCategory && primaryCategoryLabel && (
                <>
                  <span className={styles.crumbSep} aria-hidden="true">
                    /
                  </span>
                  <Link
                    to={`/news/tags/${primaryCategory}`}
                    data-category={primaryCategory}
                    className={styles.crumbCategory}
                  >
                    <span className={styles.crumbDot} aria-hidden="true" />
                    <span>{primaryCategoryLabel}</span>
                  </Link>
                </>
              )}
            </nav>

            <div className={styles.heroUtils}>
              {formatOrSource && (
                <span className={styles.sourceBadge}>{formatOrSource}</span>
              )}

              {currentPost && (
                <button
                  type="button"
                  className={clsx(
                    styles.copyBtn,
                    copied && styles.copyBtnDone
                  )}
                  onClick={handleCopy}
                >
                  <svg
                    viewBox="0 0 16 16"
                    width="13"
                    height="13"
                    fill="none"
                    aria-hidden="true"
                  >
                    {copied ? (
                      <path
                        d="M3.5 8.5L6.5 11.5L12.5 5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : (
                      <>
                        <rect
                          x="5.5"
                          y="5.5"
                          width="8"
                          height="8"
                          rx="1.5"
                          stroke="currentColor"
                          strokeWidth="1.4"
                        />
                        <path
                          d="M10.5 5.5V3.5C10.5 2.67 9.83 2 9 2H3.5C2.67 2 2 2.67 2 3.5V9C2 9.83 2.67 10.5 3.5 10.5H5.5"
                          stroke="currentColor"
                          strokeWidth="1.4"
                        />
                      </>
                    )}
                  </svg>
                  <span>
                    {copied
                      ? translate({
                          id: "news.article.copied",
                          message: "Copied",
                        })
                      : translate({
                          id: "news.article.copyLink",
                          message: "Copy link",
                        })}
                  </span>
                </button>
              )}

              <Link to="/news/tags" className={styles.barLink}>
                <Translate id="news.article.allCategories">
                  All Categories
                </Translate>
              </Link>
              <Link to="/news/archive" className={styles.barLink}>
                <Translate id="news.article.archive">Archive</Translate>
              </Link>
            </div>
          </BoundaryBox>
        </header>

        <BoundaryBox className={styles.contentWrap}>
          <div
            className={clsx(
              styles.readingGrid,
              hasToc && styles.readingGridToc
            )}
          >
            <main
              data-category={primaryCategory || undefined}
              className={clsx(
                styles.articleBody,
                !currentPost && styles.listCard
              )}
              itemScope
              itemType="https://schema.org/Blog"
            >
              {children}
            </main>
            {hasToc && <aside className={styles.tocCol}>{toc}</aside>}
          </div>

          {currentPost && (
            <RelatedNews
              currentSlug={currentPost.slug}
              tags={currentPost.tags}
            />
          )}
        </BoundaryBox>

        <div className={styles.ctaWrap}>
          <PageCTA
            variant="primary"
            title={translate({
              id: "news.cta.title",
              message: "Have a Cardano story to share?",
            })}
            description={translate({
              id: "news.cta.description",
              message:
                "Cardano News is curated by the community. Submit a concise article summary or subscribe to the bi-weekly Community Digest.",
            })}
            href="/docs/get-involved/create-a-news-article"
            buttonText={translate({
              id: "news.cta.submitButton",
              message: "Submit a News Article",
            })}
            secondaryButton={{
              href: "/newsletter",
              label: translate({
                id: "news.cta.newsletterButton",
                message: "Subscribe to Newsletter",
              }),
            }}
          />
        </div>
      </div>
    </Layout>
  );
}
