import React from "react";
import clsx from "clsx";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import { useLocation } from "@docusaurus/router";
import Translate, { translate } from "@docusaurus/Translate";
import BoundaryBox from "@site/src/components/Layout/BoundaryBox";
import OpenGraphInfo from "@site/src/components/Layout/OpenGraphInfo";
import PageCTA from "@site/src/components/Layout/PageCTA";
import SpacerBox from "@site/src/components/Layout/SpacerBox";
import RelatedNews from "@site/src/components/News/RelatedNews";
import newsIndex from "@site/src/data/newsIndex.json";
import { getCategoryLabels } from "@site/src/utils/news/categories";
import styles from "./styles.module.css";

function normalizeNewsPath(pathname) {
  return pathname
    .replace(/^\/(?:ja|de|es|vi)(?=\/)/, "")
    .replace(/\/$/, "");
}

export default function BlogLayout(props) {
  const { toc, children, ...layoutProps } = props;
  const { pathname } = useLocation();

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

  return (
    <Layout {...layoutProps}>
      {/* Blog posts set og:type "article" through the theme, so leave it out here */}
      <OpenGraphInfo pageName="cardano-news" type={null} />

      <div className={styles.newsBar}>
        <BoundaryBox className={styles.newsBarInner}>
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
                  className={styles.crumbCategory}
                >
                  {primaryCategoryLabel}
                </Link>
              </>
            )}
          </nav>

          <div className={styles.barLinks}>
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
      </div>

      <BoundaryBox className={styles.contentWrap}>
        <div
          className={clsx(styles.readingGrid, hasToc && styles.readingGridToc)}
        >
          <main
            className={styles.articleBody}
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

      <SpacerBox size="medium" />

      <PageCTA
        variant="secondary"
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
    </Layout>
  );
}
