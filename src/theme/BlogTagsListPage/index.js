import React, { useMemo } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import { useBaseUrlUtils } from "@docusaurus/useBaseUrl";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Translate, { translate } from "@docusaurus/Translate";
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
  translateTagsPageTitle,
} from "@docusaurus/theme-common";
import Layout from "@theme/Layout";
import SearchMetadata from "@theme/SearchMetadata";
import BoundaryBox from "@site/src/components/Layout/BoundaryBox";
import Grid from "@site/src/components/Layout/Grid";
import OpenGraphInfo from "@site/src/components/Layout/OpenGraphInfo";
import PageCTA from "@site/src/components/Layout/PageCTA";
import newsIndex from "@site/src/data/newsIndex.json";
import {
  CATEGORY_IMAGES,
  DEFAULT_IMAGE,
  getCategoryDescriptions,
  getCategoryLabels,
} from "@site/src/utils/news/categories";
import { formatShortNewsDate } from "@site/src/utils/news/newsModel";
import styles from "./styles.module.css";

const NAV_CATEGORY_ORDER = [
  "ecosystem",
  "development",
  "governance",
  "community",
  "research",
  "education",
  "events",
];

function ChevronIcon() {
  return (
    <svg
      className={styles.exploreIcon}
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

export default function BlogTagsListPage({ tags = [] }) {
  const title = translateTagsPageTitle();
  const { withBaseUrl } = useBaseUrlUtils();
  const { i18n } = useDocusaurusContext();
  const dateLocale =
    i18n.localeConfigs[i18n.currentLocale]?.htmlLang || i18n.currentLocale;

  const categoryLabels = getCategoryLabels();
  const categoryDescriptions = getCategoryDescriptions();

  const { topics, extraTags } = useMemo(() => {
    const tagList = Array.isArray(tags) ? tags : Object.values(tags || {});
    const tagBySlug = new Map();
    for (const item of tagList) {
      const slug = (item.permalink || "").replace(/\/$/, "").split("/").pop();
      if (slug) tagBySlug.set(slug, item);
    }

    const postsByCategory = new Map();
    for (const post of newsIndex) {
      for (const slug of post.tags || []) {
        const arr = postsByCategory.get(slug);
        if (arr) arr.push(post);
        else postsByCategory.set(slug, [post]);
      }
    }

    const primarySet = new Set(NAV_CATEGORY_ORDER);
    const orderedTopics = NAV_CATEGORY_ORDER.map((slug) => {
      const tagMeta = tagBySlug.get(slug);
      const posts = postsByCategory.get(slug) || [];
      return {
        slug,
        label: categoryLabels[slug] || tagMeta?.label || slug,
        description:
          categoryDescriptions[slug] || tagMeta?.description || "",
        permalink: tagMeta?.permalink || `/news/tags/${slug}`,
        count: tagMeta?.count ?? posts.length,
        latestPost: posts[0] || null,
        imageSrc: CATEGORY_IMAGES[slug] || DEFAULT_IMAGE,
      };
    });

    const extras = tagList.filter((item) => {
      const slug = (item.permalink || "").replace(/\/$/, "").split("/").pop();
      return slug && !primarySet.has(slug);
    });

    return { topics: orderedTopics, extraTags: extras };
  }, [tags, categoryLabels, categoryDescriptions]);

  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogTagsListPage
      )}
    >
      <PageMetadata title={title} />
      <SearchMetadata tag="blog_tags_list" />
      <Layout>
        <OpenGraphInfo pageName="cardano-news" />
        <main className={styles.main}>
          <header className={styles.masthead}>
            <svg
              className={styles.mastheadSvg}
              viewBox="0 0 1440 320"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <g
                fill="none"
                stroke="currentColor"
                className={styles.mastheadRings}
              >
                <circle
                  cx="1180"
                  cy="65"
                  r="150"
                  strokeOpacity="0.22"
                  strokeWidth="1.1"
                />
                <circle
                  cx="1180"
                  cy="65"
                  r="280"
                  strokeOpacity="0.16"
                  strokeWidth="1"
                />
                <circle
                  cx="1180"
                  cy="65"
                  r="420"
                  strokeOpacity="0.1"
                  strokeWidth="0.9"
                />
              </g>
              <g fill="currentColor" className={styles.mastheadPulses}>
                <circle cx="1030" cy="65" r="3.2" />
                <circle cx="950" cy="215" r="2.6" />
                <circle cx="1310" cy="180" r="2.8" />
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

              <h1 className={styles.heroTitle}>
                <Translate id="news.tagsList.heading">
                  Topics & Categories
                </Translate>
              </h1>

              <p className={styles.heroDesc}>
                <Translate id="news.tagsList.deck">
                  Explore Cardano coverage by beat, from protocol engineering
                  and peer-reviewed research to governance and community
                  initiatives.
                </Translate>
              </p>

              <div className={styles.statsPill}>
                <span>
                  <Translate
                    id="news.masthead.countArticles"
                    values={{ count: newsIndex.length }}
                  >
                    {"{count} Articles"}
                  </Translate>
                </span>
                <span className={styles.statsSep} aria-hidden="true">
                  ·
                </span>
                <span>
                  <Translate
                    id="news.tagsList.topicCount"
                    values={{ count: topics.length }}
                  >
                    {"{count} Topics"}
                  </Translate>
                </span>
              </div>
            </BoundaryBox>
          </header>

          <section
            className={styles.topicsSection}
            aria-label={translate({
              id: "news.tagsList.gridAriaLabel",
              message: "Newsroom topic directory",
            })}
          >
            <BoundaryBox>
              <Grid minItemWidth="320px" gap="var(--site-space-lg)" stackOnMobile>
                {topics.map((topic) => (
                  <article
                    key={topic.slug}
                    data-category={topic.slug}
                    className={styles.topicCard}
                  >
                    <div className={styles.topicMedia}>
                      <img
                        src={withBaseUrl(topic.imageSrc)}
                        alt=""
                        className={styles.topicImg}
                        loading="lazy"
                      />
                      <div className={styles.mediaOverlay}>
                        <span className={styles.catPill}>
                          <span className={styles.catDot} aria-hidden="true" />
                          <span>{topic.label}</span>
                        </span>
                        <span className={styles.mediaCount}>
                          <Translate
                            id="news.tag.postCount"
                            values={{ count: topic.count }}
                          >
                            {"{count} stories"}
                          </Translate>
                        </span>
                      </div>
                    </div>

                    <div className={styles.topicBody}>
                      <h2 className={styles.topicTitle}>
                        <Link
                          to={topic.permalink}
                          className={styles.cardLink}
                        >
                          {topic.label}
                        </Link>
                      </h2>

                      {topic.description && (
                        <p className={styles.topicDesc}>{topic.description}</p>
                      )}

                      {topic.latestPost && (
                        <Link
                          to={topic.latestPost.permalink}
                          className={styles.latestBox}
                        >
                          <span className={styles.latestEyebrow}>
                            <span>
                              <Translate id="news.tagsList.latestLabel">
                                Latest story
                              </Translate>
                            </span>
                            <time dateTime={topic.latestPost.date}>
                              {formatShortNewsDate(
                                topic.latestPost.date,
                                dateLocale
                              )}
                            </time>
                          </span>
                          <span className={styles.latestTitle}>
                            {topic.latestPost.title}
                          </span>
                        </Link>
                      )}

                      <div className={styles.topicFooter}>
                        <span className={styles.exploreCta} aria-hidden="true">
                          <span>
                            <Translate
                              id="news.tagsList.explore"
                              values={{ topic: topic.label }}
                            >
                              {"Explore {topic}"}
                            </Translate>
                          </span>
                          <ChevronIcon />
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </Grid>

              {extraTags.length > 0 && (
                <div className={styles.extraTags}>
                  <h2 className={styles.extraHeading}>
                    <Translate id="news.tagsList.moreTags">
                      Additional tags
                    </Translate>
                  </h2>
                  <div className={styles.extraList}>
                    {extraTags.map((tag) => (
                      <Link
                        key={tag.permalink}
                        to={tag.permalink}
                        className={styles.extraPill}
                      >
                        <span>{tag.label}</span>
                        <span className={styles.extraCount}>({tag.count})</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
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
