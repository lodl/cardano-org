import React, { useMemo, useState } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Translate, { translate } from "@docusaurus/Translate";
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
} from "@docusaurus/theme-common";
import Layout from "@theme/Layout";
import SearchMetadata from "@theme/SearchMetadata";
import BoundaryBox from "@site/src/components/Layout/BoundaryBox";
import OpenGraphInfo from "@site/src/components/Layout/OpenGraphInfo";
import PageCTA from "@site/src/components/Layout/PageCTA";
import newsIndex from "@site/src/data/newsIndex.json";
import {
  CATEGORY_ORDER,
  getCategoryLabels,
} from "@site/src/utils/news/categories";
import {
  collectFilterOptions,
  filterNews,
  formatShortNewsDate,
} from "@site/src/utils/news/newsModel";
import styles from "./styles.module.css";

function ChevronIcon() {
  return (
    <svg
      className={styles.rowChevron}
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

export default function BlogArchivePage() {
  const { i18n } = useDocusaurusContext();
  const dateLocale =
    i18n.localeConfigs[i18n.currentLocale]?.htmlLang || i18n.currentLocale;
  const categoryLabels = getCategoryLabels();

  const title = translate({
    id: "theme.blog.archive.title",
    message: "Archive",
    description: "The page & hero title of the blog archive page",
  });
  const description = translate({
    id: "news.archive.metaDescription",
    message:
      "Chronological archive of all Cardano Newsroom articles, developer reports, research summaries, and governance updates.",
  });

  const filterOptions = useMemo(() => collectFilterOptions(newsIndex), []);

  const yearCounts = useMemo(() => {
    const map = new Map();
    for (const post of newsIndex) {
      const y = (post.date || "").slice(0, 4);
      if (y) map.set(y, (map.get(y) || 0) + 1);
    }
    return map;
  }, []);

  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [query, setQuery] = useState("");

  const filteredPosts = useMemo(
    () =>
      filterNews(newsIndex, {
        year: selectedYear,
        category: selectedCategory,
        query: query.trim(),
      }),
    [selectedYear, selectedCategory, query]
  );

  const groupedYears = useMemo(() => {
    const map = new Map();
    for (const post of filteredPosts) {
      const year = (post.date || "").slice(0, 4) || "Unknown";
      const list = map.get(year);
      if (list) list.push(post);
      else map.set(year, [post]);
    }
    return [...map.entries()].map(([year, posts]) => ({ year, posts }));
  }, [filteredPosts]);

  const sortedYearsAsc = useMemo(
    () => [...filterOptions.years].sort(),
    [filterOptions.years]
  );
  const firstYear = sortedYearsAsc[0] || "";
  const latestYear = sortedYearsAsc[sortedYearsAsc.length - 1] || "";
  const hasFilters = Boolean(selectedYear || selectedCategory || query.trim());

  const resetFilters = () => {
    setSelectedYear(null);
    setSelectedCategory(null);
    setQuery("");
  };

  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page?.blogArchivePage || "blog-archive-page"
      )}
    >
      <PageMetadata title={title} description={description} />
      <SearchMetadata tag="blog_archive" />
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
                <Translate id="news.archive.heading">Newsroom Archive</Translate>
              </h1>

              <p className={styles.heroDesc}>
                <Translate id="news.archive.deck">
                  Browse every dispatch, research summary, governance update,
                  and ecosystem milestone chronologically.
                </Translate>
              </p>

              <div className={styles.statsPill}>
                <span>
                  <Translate
                    id="news.masthead.countArticles"
                    values={{ count: filterOptions.totalCount }}
                  >
                    {"{count} Articles"}
                  </Translate>
                </span>
                {firstYear && latestYear && (
                  <>
                    <span className={styles.statsSep} aria-hidden="true">
                      ·
                    </span>
                    <span>
                      {firstYear} - {latestYear}
                    </span>
                  </>
                )}
              </div>
            </BoundaryBox>
          </header>

          <div className={styles.navStrip}>
            <BoundaryBox>
              <div className={styles.navRow}>
                <div
                  className={styles.yearGroup}
                  role="group"
                  aria-label={translate({
                    id: "news.archive.yearGroupLabel",
                    message: "Filter archive by year",
                  })}
                >
                  <button
                    type="button"
                    className={clsx(
                      styles.yearPill,
                      !selectedYear && styles.yearPillActive
                    )}
                    aria-pressed={!selectedYear}
                    onClick={() => setSelectedYear(null)}
                  >
                    <Translate id="news.filter.allYears">All years</Translate>
                  </button>
                  {filterOptions.years.map((year) => {
                    const active = selectedYear === year;
                    return (
                      <button
                        key={year}
                        type="button"
                        className={clsx(
                          styles.yearPill,
                          active && styles.yearPillActive
                        )}
                        aria-pressed={active}
                        onClick={() => setSelectedYear(active ? null : year)}
                      >
                        <span>{year}</span>
                        <span className={styles.yearCount}>
                          ({yearCounts.get(year) || 0})
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className={styles.navTools}>
                  <select
                    className={styles.select}
                    aria-label={translate({
                      id: "news.filter.categoryGroup",
                      message: "Filter by category",
                    })}
                    value={selectedCategory || ""}
                    onChange={(e) =>
                      setSelectedCategory(e.target.value || null)
                    }
                  >
                    <option value="">
                      {translate({
                        id: "news.archive.allCategoriesOption",
                        message: "All categories",
                      })}
                    </option>
                    {CATEGORY_ORDER.map((slug) => (
                      <option key={slug} value={slug}>
                        {categoryLabels[slug]}
                      </option>
                    ))}
                  </select>

                  <div className={styles.searchWrap}>
                    <svg
                      className={styles.searchIcon}
                      viewBox="0 0 20 20"
                      width="15"
                      height="15"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="9"
                        cy="9"
                        r="6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M13.5 13.5L17 17"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      type="search"
                      className={styles.searchInput}
                      placeholder={translate({
                        id: "news.nav.searchPlaceholder",
                        message: "Filter stories...",
                      })}
                      aria-label={translate({
                        id: "news.filter.searchLabel",
                        message: "Filter news by title, topic, or source",
                      })}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                      <button
                        type="button"
                        className={styles.searchClear}
                        onClick={() => setQuery("")}
                        aria-label={translate({
                          id: "news.filter.clearSearch",
                          message: "Clear news filter",
                        })}
                      >
                        <svg
                          viewBox="0 0 16 16"
                          width="13"
                          height="13"
                          aria-hidden="true"
                        >
                          <path
                            d="M4 4L12 12M12 4L4 12"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </BoundaryBox>
          </div>

          <section className={styles.timelineSection}>
            <BoundaryBox>
              {groupedYears.length > 0 ? (
                <div className={styles.yearSections}>
                  {groupedYears.map(({ year, posts }) => (
                    <section
                      key={year}
                      id={`archive-${year}`}
                      className={styles.yearSection}
                      aria-labelledby={`year-heading-${year}`}
                    >
                      <div className={styles.yearHeader}>
                        <h2
                          id={`year-heading-${year}`}
                          className={styles.yearHeading}
                        >
                          {year}
                        </h2>
                        <span className={styles.yearTotalPill}>
                          <Translate
                            id="news.tag.postCount"
                            values={{ count: posts.length }}
                          >
                            {"{count} stories"}
                          </Translate>
                        </span>
                      </div>

                      <div className={styles.yearCard}>
                        {posts.map((post) => {
                          const primaryCategory = post.tags?.[0];
                          const categoryLabel = primaryCategory
                            ? categoryLabels[primaryCategory]
                            : null;
                          const sourceLabel =
                            post.externalHost ||
                            post.authors?.[0]?.name ||
                            null;

                          return (
                            <Link
                              key={post.slug}
                              to={post.permalink}
                              data-category={primaryCategory || undefined}
                              className={styles.archiveRow}
                            >
                              <time
                                className={styles.rowDate}
                                dateTime={post.date}
                              >
                                {formatShortNewsDate(post.date, dateLocale)}
                              </time>

                              <div className={styles.rowBadges}>
                                {categoryLabel && (
                                  <span className={styles.catPill}>
                                    <span
                                      className={styles.catDot}
                                      aria-hidden="true"
                                    />
                                    <span>{categoryLabel}</span>
                                  </span>
                                )}
                                {post.youtubeId && (
                                  <span className={styles.videoTag}>
                                    {translate({
                                      id: "news.card.video",
                                      message: "Video",
                                    })}
                                  </span>
                                )}
                              </div>

                              <span className={styles.rowTitle}>
                                {post.title}
                              </span>

                              <span className={styles.rowMeta}>
                                {sourceLabel && (
                                  <span className={styles.rowSource}>
                                    {sourceLabel}
                                  </span>
                                )}
                                <ChevronIcon />
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <h2 className={styles.emptyTitle}>
                    <Translate id="news.empty.title">
                      No matching stories found
                    </Translate>
                  </h2>
                  <p className={styles.emptyDesc}>
                    <Translate id="news.archive.emptyDescription">
                      Try clearing the year, category, or search filter to view
                      more entries.
                    </Translate>
                  </p>
                  {hasFilters && (
                    <button
                      type="button"
                      className="button button--primary button--lg"
                      onClick={resetFilters}
                    >
                      <Translate id="news.filter.resetAll">
                        Clear all filters
                      </Translate>
                    </button>
                  )}
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
