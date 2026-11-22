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
import SpacerBox from "@site/src/components/Layout/SpacerBox";
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
  const [visibleCount, setVisibleCount] = useState(initialCount);
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

          <header className={styles.masthead}>
            <svg
              className={styles.mastheadSvg}
              viewBox="0 0 1440 320"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <defs>
                <radialGradient id="tag-bloom" cx="84%" cy="18%" r="55%">
                  <stop offset="0%" stopColor="#6684ce" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#061334" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="tag-arc" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                  <stop offset="50%" stopColor="#ffffff" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <rect width="1440" height="320" fill="url(#tag-bloom)" />
              <g fill="none" stroke="url(#tag-arc)" strokeWidth="0.9">
                <circle cx="1180" cy="60" r="160" />
                <circle cx="1180" cy="60" r="290" />
                <circle cx="1180" cy="60" r="430" />
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
                      {categoryLabels[slug]}
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
                    className="button button--primary button--lg"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
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

          <SpacerBox size="medium" />

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
        </main>
      </Layout>
    </HtmlClassNameProvider>
  );
}
