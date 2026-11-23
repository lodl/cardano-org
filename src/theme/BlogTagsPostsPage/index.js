import React, { useMemo, useState } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import Translate, { translate } from "@docusaurus/Translate";
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
} from "@docusaurus/theme-common";
import { useBlogTagsPostsPageTitle } from "@docusaurus/theme-common/internal";
import Layout from "@theme/Layout";
import SearchMetadata from "@theme/SearchMetadata";
import Unlisted from "@theme/ContentVisibility/Unlisted";
import BoundaryBox from "@site/src/components/Layout/BoundaryBox";
import Grid from "@site/src/components/Layout/Grid";
import OpenGraphInfo from "@site/src/components/Layout/OpenGraphInfo";
import PageCTA from "@site/src/components/Layout/PageCTA";
import NewsCard from "@site/src/components/News/NewsCard";
import newsIndex from "@site/src/data/newsIndex.json";
import {
  getCategoryDescriptions,
  getCategoryLabels,
} from "@site/src/utils/news/categories";
import { filterNews } from "@site/src/utils/news/newsModel";
import styles from "./styles.module.css";

const PAGE_SIZE = 12;
const NAV_CATEGORY_ORDER = [
  "ecosystem",
  "development",
  "governance",
  "community",
  "research",
  "education",
  "events",
];

function BlogTagsPostsPageMetadata({ tag }) {
  const title = useBlogTagsPostsPageTitle(tag);
  return (
    <>
      <PageMetadata title={title} description={tag.description} />
      <SearchMetadata tag="blog_tags_posts" />
    </>
  );
}

export default function BlogTagsPostsPage(props) {
  const { tag, listMetadata } = props;
  const tagKey = (tag.permalink || "").replace(/\/$/, "").split("/").pop();
  const categoryLabels = getCategoryLabels();
  const categoryDescriptions = getCategoryDescriptions();

  const label = categoryLabels[tagKey] || tag.label;
  const description = categoryDescriptions[tagKey] || tag.description;

  const matchingPosts = useMemo(
    () => filterNews(newsIndex, { category: tagKey }),
    [tagKey]
  );

  const pageNumber = listMetadata?.page || 1;
  const hasLead = pageNumber === 1 && matchingPosts.length >= 2;
  const leadPost = hasLead ? matchingPosts[0] : null;
  const restPosts = hasLead ? matchingPosts.slice(1) : matchingPosts;

  const initialCount = Math.max(1, pageNumber) * PAGE_SIZE;
  const [pagination, setPagination] = useState({
    key: tagKey,
    count: initialCount,
  });
  const visibleCount =
    pagination.key === tagKey ? pagination.count : initialCount;
  const visibleRest = restPosts.slice(0, visibleCount);
  const canLoadMore = visibleCount < restPosts.length;
  const totalShown = (leadPost ? 1 : 0) + visibleRest.length;

  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogTagPostListPage
      )}
    >
      <BlogTagsPostsPageMetadata tag={tag} />
      <Layout>
        <OpenGraphInfo pageName="cardano-news" />
        <main className={styles.main}>
          {tag.unlisted && <Unlisted />}

          <header
            className={styles.masthead}
            data-category={tagKey || "ecosystem"}
          >
            <svg
              className={styles.mastheadSvg}
              viewBox="0 0 1440 320"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <g fill="none" stroke="currentColor" className={styles.mastheadRings}>
                <circle cx="1160" cy="70" r="145" strokeOpacity="0.22" strokeWidth="1.1" />
                <circle cx="1160" cy="70" r="265" strokeOpacity="0.16" strokeWidth="1" />
                <circle cx="1160" cy="70" r="395" strokeOpacity="0.12" strokeWidth="0.9" />
                <circle cx="1160" cy="70" r="535" strokeOpacity="0.08" strokeWidth="0.85" />
              </g>
              <g fill="currentColor" className={styles.mastheadPulses}>
                <circle cx="1015" cy="70" r="3.2" />
                <circle cx="940" cy="218" r="2.6" />
                <circle cx="1290" cy="185" r="2.8" />
              </g>
            </svg>

            <BoundaryBox className={styles.mastheadInner}>
              <nav
                className={styles.breadcrumb}
                aria-label={translate({
                  id: "news.tag.breadcrumbLabel",
                  message: "News breadcrumb",
                })}
              >
                <Link to="/news" className={styles.breadcrumbLink}>
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
                  <Translate id="news.tag.allNewsLink">
                    Cardano Newsroom
                  </Translate>
                </Link>
              </nav>

              <div className={styles.heroHeadingRow}>
                <h1 className={styles.heroTitle}>{label}</h1>
                <span className={styles.countPill}>
                  <Translate
                    id="news.tag.postCount"
                    values={{ count: matchingPosts.length }}
                  >
                    {"{count} stories"}
                  </Translate>
                </span>
              </div>

              {description && <p className={styles.heroDesc}>{description}</p>}
            </BoundaryBox>
          </header>

          <div className={styles.navStrip}>
            <BoundaryBox>
              <nav
                className={styles.tabGroup}
                aria-label={translate({
                  id: "news.tag.categoriesNavLabel",
                  message: "News categories",
                })}
              >
                <Link to="/news" className={styles.navTab}>
                  <Translate id="news.tag.allCategoriesPill">All</Translate>
                </Link>
                {NAV_CATEGORY_ORDER.map((slug) => {
                  const active = slug === tagKey;
                  return (
                    <Link
                      key={slug}
                      to={`/news/tags/${slug}`}
                      className={clsx(
                        styles.navTab,
                        active && styles.navTabActive
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <span
                        className={styles.tabDot}
                        data-category={slug}
                        aria-hidden="true"
                      />
                      <span>{categoryLabels[slug]}</span>
                    </Link>
                  );
                })}
              </nav>
            </BoundaryBox>
          </div>

          <section className={styles.listSection}>
            <BoundaryBox>
              {leadPost && (
                <div className={styles.leadWrap}>
                  <NewsCard post={leadPost} variant="lead" headingLevel={2} />
                </div>
              )}

              <Grid
                minItemWidth="320px"
                gap="var(--site-space-lg)"
                stackOnMobile
                className={styles.cardsGrid}
              >
                {visibleRest.map((post) => (
                  <NewsCard
                    key={post.slug}
                    post={post}
                    variant="grid"
                    headingLevel={leadPost ? 3 : 2}
                  />
                ))}
              </Grid>

              <div className={styles.loadMoreBar}>
                {canLoadMore && (
                  <button
                    type="button"
                    className={clsx(
                      "button button--primary button--lg",
                      styles.loadMoreBtn
                    )}
                    onClick={() =>
                      setPagination({
                        key: tagKey,
                        count: visibleCount + PAGE_SIZE,
                      })
                    }
                  >
                    <Translate id="news.list.loadMore">
                      Load more articles
                    </Translate>
                  </button>
                )}
                <p className={styles.progressNote}>
                  <Translate
                    id="news.tag.progressNote"
                    values={{
                      shown: totalShown,
                      total: matchingPosts.length,
                    }}
                  >
                    {"Showing {shown} of {total} stories"}
                  </Translate>
                </p>
              </div>
            </BoundaryBox>
          </section>

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
        </main>
      </Layout>
    </HtmlClassNameProvider>
  );
}
