import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";
import Link from "@docusaurus/Link";
import { useBaseUrlUtils } from "@docusaurus/useBaseUrl";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Translate, { translate } from "@docusaurus/Translate";
import BoundaryBox from "@site/src/components/Layout/BoundaryBox";
import Grid from "@site/src/components/Layout/Grid";
import PageCTA from "@site/src/components/Layout/PageCTA";
import NewsCard from "@site/src/components/News/NewsCard";
import newsIndex from "@site/src/data/newsIndex.json";
import {
  CATEGORY_ORDER,
  getCategoryLabels,
} from "@site/src/utils/news/categories";
import {
  collectFilterOptions,
  filterNews,
  formatNewsDate,
  formatShortNewsDate,
  selectEditorialShowcase,
  selectLatestVideos,
  selectRecurringSeriesHistory,
} from "@site/src/utils/news/newsModel";
import styles from "./styles.module.css";

const EDITORIAL_INITIAL_COUNT = 6;
const EDITORIAL_STEP = 9;
const FILTERED_PAGE_SIZE = 12;

const NAV_CATEGORY_ORDER = [
  "ecosystem",
  "development",
  "governance",
  "community",
  "research",
  "education",
  "events",
];

const VALID_CATEGORIES = new Set(CATEGORY_ORDER);
const VALID_FORMATS = new Set(["all", "article", "video"]);
const VALID_SCOPES = new Set(["all", "editorial", "briefings"]);

function readFiltersFromUrl() {
  const defaults = {
    category: null,
    author: null,
    format: "all",
    year: null,
    scope: "all",
    query: "",
  };
  if (!ExecutionEnvironment.canUseDOM) return defaults;

  const params = new URLSearchParams(window.location.search);
  const rawCategory = params.get("category");
  const rawSource = params.get("source");
  const rawFormat = params.get("format");
  const rawYear = params.get("year");
  const rawScope = params.get("scope");
  const rawQuery = params.get("q");

  return {
    category:
      rawCategory && VALID_CATEGORIES.has(rawCategory) ? rawCategory : null,
    author: rawSource || null,
    format: rawFormat && VALID_FORMATS.has(rawFormat) ? rawFormat : "all",
    year: rawYear && /^\d{4}$/.test(rawYear) ? rawYear : null,
    scope: rawScope && VALID_SCOPES.has(rawScope) ? rawScope : "all",
    query: rawQuery || "",
  };
}

function scrollToStories() {
  if (!ExecutionEnvironment.canUseDOM) return;
  const el = document.getElementById("stories");
  if (!el) return;
  const reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}

// Architectural meridian backdrop in pure SVG: smooth fading solid strokes and
// atmospheric radial bloom, zero noisy dashed lines.
function MastheadBackdrop() {
  return (
    <svg
      className={styles.mastheadSvg}
      viewBox="0 0 1440 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="newsroom-bloom" cx="82%" cy="18%" r="58%">
          <stop offset="0%" stopColor="#6684ce" stopOpacity="0.34" />
          <stop offset="55%" stopColor="#1d4ed8" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#061334" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="newsroom-arc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="48%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1440" height="400" fill="url(#newsroom-bloom)" />
      <g fill="none" stroke="url(#newsroom-arc)" strokeWidth="0.9">
        <circle cx="1180" cy="70" r="180" />
        <circle cx="1180" cy="70" r="320" />
        <circle cx="1180" cy="70" r="470" />
        <circle cx="1180" cy="70" r="640" />
      </g>
    </svg>
  );
}

/**
 * Flagship editorial Cardano Newsroom rendered on /news and /news/page/N.
 *
 * @param {object} props
 * @param {number} [props.initialPage=1] Initial page number from route metadata.
 */
export default function NewsHub({ initialPage = 1 }) {
  const { withBaseUrl } = useBaseUrlUtils();
  const { i18n } = useDocusaurusContext();
  const dateLocale =
    i18n.localeConfigs[i18n.currentLocale]?.htmlLang || i18n.currentLocale;

  const categoryLabels = getCategoryLabels();
  const [filters, setFilters] = useState(() => readFiltersFromUrl());
  const [drawerOpen, setDrawerOpen] = useState(() => {
    const initial = readFiltersFromUrl();
    return Boolean(
      initial.author ||
        initial.year ||
        initial.format !== "all" ||
        initial.scope !== "all"
    );
  });
  const [landingScope, setLandingScope] = useState(() =>
    initialPage > 1 ? "all" : "editorial"
  );
  const [viewMode, setViewMode] = useState("grid");
  const [visibleCount, setVisibleCount] = useState(() =>
    initialPage > 1
      ? initialPage * FILTERED_PAGE_SIZE
      : EDITORIAL_INITIAL_COUNT
  );

  // Sync active filters to URL query string without creating history entries.
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    const url = new URL(window.location.href);
    const setOrDelete = (key, val) => {
      if (val) url.searchParams.set(key, val);
      else url.searchParams.delete(key);
    };
    setOrDelete("category", filters.category);
    setOrDelete("source", filters.author);
    setOrDelete("format", filters.format !== "all" ? filters.format : null);
    setOrDelete("year", filters.year);
    setOrDelete("scope", filters.scope !== "all" ? filters.scope : null);
    setOrDelete("q", filters.query.trim() || null);

    const next = url.toString();
    if (next !== window.location.href) {
      window.history.replaceState(null, "", next);
    }
  }, [filters]);

  const hasActiveFilters = Boolean(
    filters.category ||
      filters.author ||
      filters.format !== "all" ||
      filters.year ||
      filters.scope !== "all" ||
      filters.query.trim()
  );

  const hasSecondaryFilters = Boolean(
    filters.author ||
      filters.year ||
      filters.format !== "all" ||
      filters.scope !== "all"
  );

  const updateFilters = (patch) => {
    const next = { ...filters, ...patch };
    const nextActive = Boolean(
      next.category ||
        next.author ||
        next.format !== "all" ||
        next.year ||
        next.scope !== "all" ||
        next.query.trim()
    );
    setFilters(next);
    setVisibleCount(
      nextActive ? FILTERED_PAGE_SIZE : EDITORIAL_INITIAL_COUNT
    );
  };

  const resetFilters = () => {
    setFilters({
      category: null,
      author: null,
      format: "all",
      year: null,
      scope: "all",
      query: "",
    });
    setVisibleCount(EDITORIAL_INITIAL_COUNT);
  };

  const showcase = useMemo(() => selectEditorialShowcase(newsIndex), []);
  const recurringSeries = useMemo(
    () => selectRecurringSeriesHistory(newsIndex, 3),
    []
  );
  const latestVideos = useMemo(() => selectLatestVideos(newsIndex, 3), []);
  const filterOptions = useMemo(() => collectFilterOptions(newsIndex), []);

  const showcaseSlugs = useMemo(() => {
    const set = new Set();
    if (showcase.lead) set.add(showcase.lead.slug);
    for (const item of showcase.spotlights) set.add(item.slug);
    return set;
  }, [showcase]);

  const filteredPosts = useMemo(() => {
    if (hasActiveFilters) {
      return filterNews(newsIndex, filters);
    }
    return filterNews(newsIndex, { scope: landingScope }).filter(
      (post) => !showcaseSlugs.has(post.slug)
    );
  }, [filters, hasActiveFilters, landingScope, showcaseSlugs]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredPosts.length;
  const trimmedQuery = filters.query.trim();
  const latestDate = newsIndex[0]?.date
    ? formatNewsDate(newsIndex[0].date, dateLocale)
    : null;

  const seriesLabels = {
    "weekly-dev": translate({
      id: "news.pulse.weeklyDev",
      message: "Weekly Development Report",
    }),
    "community-digest": translate({
      id: "news.pulse.communityDigest",
      message: "Community Digest",
    }),
    "intersect-update": translate({
      id: "news.pulse.intersectUpdate",
      message: "Intersect Weekly Update",
    }),
  };

  const stepSize =
    hasActiveFilters || viewMode === "row" ? FILTERED_PAGE_SIZE : EDITORIAL_STEP;

  return (
    <main className={styles.main}>
      {/* -------------------------------------------- BAND 1: MASTHEAD */}
      <header className={styles.masthead}>
        <MastheadBackdrop />
        <BoundaryBox className={styles.mastheadInner}>
          <div className={styles.mastheadGrid}>
            <div className={styles.mastheadCopy}>
              <div className={styles.dateline}>
                <span className={styles.datelineDot} aria-hidden="true" />
                <span>
                  <Translate id="news.hero.eyebrow">Cardano Newsroom</Translate>
                </span>
                {latestDate && (
                  <>
                    <span className={styles.datelineSep} aria-hidden="true">
                      ·
                    </span>
                    <span>
                      <Translate
                        id="news.masthead.updated"
                        values={{ date: latestDate }}
                      >
                        {"Updated {date}"}
                      </Translate>
                    </span>
                  </>
                )}
              </div>

              <h1 className={styles.mastheadTitle}>
                <Translate id="news.masthead.title">
                  News & Stories from Cardano
                </Translate>
              </h1>

              <p className={styles.mastheadDeck}>
                <Translate id="news.masthead.deck">
                  Protocol breakthroughs, governance milestones, community
                  digests, and ecosystem adoption from across the network.
                </Translate>
              </p>
            </div>

            <div className={styles.mastheadActions}>
              <Link className={styles.mastheadBtn} to="/newsletter">
                <Translate id="news.hero.linkNewsletter">Newsletter</Translate>
              </Link>
              <a
                className={styles.mastheadBtn}
                href={withBaseUrl("/news/rss.xml")}
              >
                <Translate id="news.hero.linkRssShort">RSS</Translate>
              </a>
              <Link
                className={styles.mastheadBtnPrimary}
                to="/docs/get-involved/create-a-news-article"
              >
                <Translate id="news.hero.linkSubmit">Submit a Story</Translate>
              </Link>
            </div>
          </div>
        </BoundaryBox>
      </header>

      {/* -------------------------------------------- BAND 2: EDITORIAL NAV */}
      <div className={styles.navStrip}>
        <BoundaryBox>
          <div className={styles.navRow}>
            <div
              className={styles.tabGroup}
              role="group"
              aria-label={translate({
                id: "news.filter.categoryGroup",
                message: "Filter by category",
              })}
            >
              <button
                type="button"
                className={clsx(
                  styles.navTab,
                  !filters.category && styles.navTabActive
                )}
                aria-pressed={!filters.category}
                onClick={() => updateFilters({ category: null })}
              >
                <Translate id="news.filter.allCategories">All</Translate>
              </button>

              {NAV_CATEGORY_ORDER.map((slug) => {
                const active = filters.category === slug;
                return (
                  <button
                    key={slug}
                    type="button"
                    className={clsx(
                      styles.navTab,
                      active && styles.navTabActive
                    )}
                    aria-pressed={active}
                    onClick={() =>
                      updateFilters({ category: active ? null : slug })
                    }
                  >
                    {categoryLabels[slug]}
                  </button>
                );
              })}
            </div>

            <div className={styles.navTools}>
              <div className={styles.searchWrap}>
                <svg
                  className={styles.searchIcon}
                  viewBox="0 0 20 20"
                  width="16"
                  height="16"
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
                  value={filters.query}
                  onChange={(e) => updateFilters({ query: e.target.value })}
                />
                {filters.query && (
                  <button
                    type="button"
                    className={styles.searchClear}
                    onClick={() => updateFilters({ query: "" })}
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

              <button
                type="button"
                className={clsx(
                  styles.filterToggle,
                  drawerOpen && styles.filterToggleOpen
                )}
                aria-expanded={drawerOpen}
                onClick={() => setDrawerOpen((prev) => !prev)}
              >
                <svg
                  viewBox="0 0 16 16"
                  width="14"
                  height="14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 4h12M4 8h8M6 12h4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                <span>
                  <Translate id="news.nav.filters">Filters</Translate>
                </span>
                {hasSecondaryFilters && (
                  <span className={styles.filterActiveDot} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {drawerOpen && (
            <div className={styles.drawer}>
              <div
                className={styles.scopeGroup}
                role="group"
                aria-label={translate({
                  id: "news.filter.typeGroup",
                  message: "Filter by story type",
                })}
              >
                <button
                  type="button"
                  className={clsx(
                    styles.drawerPill,
                    filters.scope === "all" &&
                      filters.format === "all" &&
                      styles.drawerPillActive
                  )}
                  aria-pressed={
                    filters.scope === "all" && filters.format === "all"
                  }
                  onClick={() => updateFilters({ scope: "all", format: "all" })}
                >
                  <Translate id="news.filter.typeAll">All types</Translate>
                </button>
                <button
                  type="button"
                  className={clsx(
                    styles.drawerPill,
                    filters.scope === "editorial" && styles.drawerPillActive
                  )}
                  aria-pressed={filters.scope === "editorial"}
                  onClick={() =>
                    updateFilters({
                      scope:
                        filters.scope === "editorial" ? "all" : "editorial",
                    })
                  }
                >
                  <Translate id="news.filter.typeEditorial">
                    Feature Stories
                  </Translate>
                </button>
                <button
                  type="button"
                  className={clsx(
                    styles.drawerPill,
                    filters.scope === "briefings" && styles.drawerPillActive
                  )}
                  aria-pressed={filters.scope === "briefings"}
                  onClick={() =>
                    updateFilters({
                      scope:
                        filters.scope === "briefings" ? "all" : "briefings",
                      format: "all",
                    })
                  }
                >
                  <Translate id="news.filter.typeBriefings">
                    Weekly Briefings
                  </Translate>
                </button>
                <button
                  type="button"
                  className={clsx(
                    styles.drawerPill,
                    filters.format === "video" && styles.drawerPillActive
                  )}
                  aria-pressed={filters.format === "video"}
                  onClick={() =>
                    updateFilters({
                      format: filters.format === "video" ? "all" : "video",
                      scope: "all",
                    })
                  }
                >
                  <Translate
                    id="news.filter.formatVideos"
                    values={{ count: filterOptions.videoCount }}
                  >
                    {"Videos ({count})"}
                  </Translate>
                </button>
              </div>

              <div className={styles.drawerSelects}>
                <select
                  className={styles.select}
                  aria-label={translate({
                    id: "news.filter.sourceLabel",
                    message: "Filter by source",
                  })}
                  value={filters.author || ""}
                  onChange={(e) =>
                    updateFilters({ author: e.target.value || null })
                  }
                >
                  <option value="">
                    {translate({
                      id: "news.filter.allSources",
                      message: "All sources",
                    })}
                  </option>
                  {filterOptions.authors.map((author) => (
                    <option key={author.key} value={author.key}>
                      {author.name} ({author.count})
                    </option>
                  ))}
                </select>

                <select
                  className={styles.select}
                  aria-label={translate({
                    id: "news.filter.yearLabel",
                    message: "Filter by year",
                  })}
                  value={filters.year || ""}
                  onChange={(e) =>
                    updateFilters({ year: e.target.value || null })
                  }
                >
                  <option value="">
                    {translate({
                      id: "news.filter.allYears",
                      message: "All years",
                    })}
                  </option>
                  {filterOptions.years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                {hasActiveFilters && (
                  <button
                    type="button"
                    className={styles.resetLink}
                    onClick={resetFilters}
                  >
                    <Translate id="news.filter.reset">Clear filters</Translate>
                  </button>
                )}
              </div>
            </div>
          )}
        </BoundaryBox>
      </div>

      {/* -------------------------------------------- BAND 3: FRONT PAGE */}
      {!hasActiveFilters && showcase.lead && (
        <section
          className={styles.showcaseSection}
          aria-label={translate({
            id: "news.showcase.ariaLabel",
            message: "Featured stories",
          })}
        >
          <BoundaryBox>
            <NewsCard post={showcase.lead} variant="lead" headingLevel={2} />

            {showcase.spotlights.length > 0 && (
              <div className={styles.spotlightSplit}>
                {showcase.spotlights.map((post) => (
                  <NewsCard
                    key={post.slug}
                    post={post}
                    variant="spotlight"
                    headingLevel={3}
                  />
                ))}
              </div>
            )}
          </BoundaryBox>
        </section>
      )}

      {/* -------------------------------------------- BAND 4: WEEKLY BRIEFINGS */}
      {!hasActiveFilters && recurringSeries.length > 0 && (
        <section
          className={styles.briefingsBand}
          aria-labelledby="briefings-heading"
        >
          <BoundaryBox>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>
                  <Translate id="news.briefings.eyebrow">
                    Recurring Series
                  </Translate>
                </p>
                <h2 id="briefings-heading" className={styles.sectionHeading}>
                  <Translate id="news.briefings.heading">
                    Weekly Ecosystem Briefings
                  </Translate>
                </h2>
              </div>
              <button
                type="button"
                className={styles.sectionActionBtn}
                onClick={() => {
                  updateFilters({ scope: "briefings", format: "all" });
                  setDrawerOpen(true);
                  scrollToStories();
                }}
              >
                <Translate id="news.briefings.browseAll">
                  Browse all briefings
                </Translate>
              </button>
            </div>

            <Grid
              minItemWidth="280px"
              gap="var(--site-space-lg)"
              stackOnMobile
            >
              {recurringSeries.map((series, idx) => {
                const author = series.latest.authors?.[0];
                return (
                  <div key={series.id} className={styles.briefingCol}>
                    <div className={styles.briefingTop}>
                      <span className={styles.briefingNum}>
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className={styles.briefingSeries}>
                        {seriesLabels[series.id]}
                      </span>
                    </div>

                    <Link
                      to={series.latest.permalink}
                      className={styles.briefingLatest}
                    >
                      <div className={styles.briefingMetaRow}>
                        <time
                          className={styles.briefingDate}
                          dateTime={series.latest.date}
                        >
                          {formatNewsDate(series.latest.date, dateLocale)}
                        </time>
                        {author && (
                          <img
                            src={withBaseUrl(author.imageUrl)}
                            alt={author.name}
                            className={styles.briefingAvatar}
                            loading="lazy"
                          />
                        )}
                      </div>
                      <h3 className={styles.briefingTitle}>
                        {series.latest.title}
                      </h3>
                    </Link>

                    {series.previous.length > 0 && (
                      <ul className={styles.briefingPrevList}>
                        {series.previous.map((prevPost) => (
                          <li key={prevPost.slug}>
                            <Link
                              to={prevPost.permalink}
                              className={styles.briefingPrevLink}
                            >
                              <time
                                className={styles.briefingPrevDate}
                                dateTime={prevPost.date}
                              >
                                {formatShortNewsDate(prevPost.date, dateLocale)}
                              </time>
                              <span className={styles.briefingPrevTitle}>
                                {prevPost.title}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </Grid>
          </BoundaryBox>
        </section>
      )}

      {/* -------------------------------------------- BAND 5: LATEST STORIES */}
      <section
        id="stories"
        className={styles.storiesSection}
        aria-labelledby="stories-heading"
      >
        <BoundaryBox>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                {hasActiveFilters ? (
                  <Translate id="news.stories.filteredEyebrow">
                    Filtered Archive
                  </Translate>
                ) : (
                  <Translate id="news.stories.eyebrow">Dispatches</Translate>
                )}
              </p>
              <div className={styles.headingWithCount}>
                <h2 id="stories-heading" className={styles.sectionHeading}>
                  {hasActiveFilters ? (
                    <Translate id="news.stories.filteredHeading">
                      Matching Stories
                    </Translate>
                  ) : (
                    <Translate id="news.stories.latestHeading">
                      Latest Stories
                    </Translate>
                  )}
                </h2>
                <span className={styles.countBadge} aria-live="polite">
                  {filteredPosts.length}
                </span>
              </div>
            </div>

            <div className={styles.storiesControls}>
              {!hasActiveFilters ? (
                <div
                  className={styles.segmented}
                  role="group"
                  aria-label={translate({
                    id: "news.stories.scopeToggleLabel",
                    message: "Story selection",
                  })}
                >
                  <button
                    type="button"
                    className={clsx(
                      styles.segBtn,
                      landingScope === "editorial" && styles.segBtnActive
                    )}
                    aria-pressed={landingScope === "editorial"}
                    onClick={() => {
                      setLandingScope("editorial");
                      setVisibleCount(EDITORIAL_INITIAL_COUNT);
                    }}
                  >
                    <Translate id="news.stories.scopeEditorial">
                      Feature Stories
                    </Translate>
                  </button>
                  <button
                    type="button"
                    className={clsx(
                      styles.segBtn,
                      landingScope === "all" && styles.segBtnActive
                    )}
                    aria-pressed={landingScope === "all"}
                    onClick={() => {
                      setLandingScope("all");
                      setVisibleCount(FILTERED_PAGE_SIZE);
                    }}
                  >
                    <Translate id="news.stories.scopeAll">
                      All Dispatches
                    </Translate>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.resetLink}
                  onClick={resetFilters}
                >
                  <Translate id="news.filter.reset">Clear filters</Translate>
                </button>
              )}

              <div
                className={styles.viewToggle}
                role="group"
                aria-label={translate({
                  id: "news.stories.viewToggleLabel",
                  message: "Layout view",
                })}
              >
                <button
                  type="button"
                  className={clsx(
                    styles.viewBtn,
                    viewMode === "grid" && styles.viewBtnActive
                  )}
                  aria-pressed={viewMode === "grid"}
                  aria-label={translate({
                    id: "news.stories.viewGrid",
                    message: "Grid view",
                  })}
                  onClick={() => setViewMode("grid")}
                >
                  <svg
                    viewBox="0 0 16 16"
                    width="14"
                    height="14"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <rect x="1" y="1" width="6" height="6" rx="1" />
                    <rect x="9" y="1" width="6" height="6" rx="1" />
                    <rect x="1" y="9" width="6" height="6" rx="1" />
                    <rect x="9" y="9" width="6" height="6" rx="1" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={clsx(
                    styles.viewBtn,
                    viewMode === "row" && styles.viewBtnActive
                  )}
                  aria-pressed={viewMode === "row"}
                  aria-label={translate({
                    id: "news.stories.viewList",
                    message: "Wire list view",
                  })}
                  onClick={() => setViewMode("row")}
                >
                  <svg
                    viewBox="0 0 16 16"
                    width="14"
                    height="14"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <rect x="1" y="2" width="14" height="2.2" rx="1" />
                    <rect x="1" y="6.9" width="14" height="2.2" rx="1" />
                    <rect x="1" y="11.8" width="14" height="2.2" rx="1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {filteredPosts.length > 0 ? (
            <>
              {viewMode === "row" ? (
                <div className={styles.wireList}>
                  {visiblePosts.map((post) => (
                    <NewsCard
                      key={post.slug}
                      post={post}
                      variant="row"
                      headingLevel={3}
                    />
                  ))}
                </div>
              ) : (
                <Grid
                  minItemWidth="320px"
                  gap="var(--site-space-lg)"
                  stackOnMobile
                  className={styles.cardsGrid}
                >
                  {visiblePosts.map((post) => (
                    <NewsCard
                      key={post.slug}
                      post={post}
                      variant="grid"
                      headingLevel={3}
                    />
                  ))}
                </Grid>
              )}

              <div className={styles.loadMoreBar}>
                {canLoadMore && (
                  <button
                    type="button"
                    className="button button--primary button--lg"
                    onClick={() =>
                      setVisibleCount((prev) => prev + stepSize)
                    }
                  >
                    <Translate id="news.list.loadMore">
                      Load more articles
                    </Translate>
                  </button>
                )}
                <p className={styles.archiveNote}>
                  <Translate
                    id="news.list.progressNote"
                    values={{
                      shown: visiblePosts.length,
                      total: filteredPosts.length,
                      archiveLink: (
                        <Link to="/news/archive">
                          <Translate id="news.list.archiveLink">
                            Browse full archive
                          </Translate>
                        </Link>
                      ),
                    }}
                  >
                    {"Showing {shown} of {total} stories. {archiveLink}"}
                  </Translate>
                </p>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <h3 className={styles.emptyTitle}>
                <Translate id="news.empty.title">
                  No matching stories found
                </Translate>
              </h3>
              <p className={styles.emptyDesc}>
                <Translate id="news.empty.description">
                  Try clearing one or more filters, or search across all
                  cardano.org pages.
                </Translate>
              </p>
              <div className={styles.emptyActions}>
                <button
                  type="button"
                  className="button button--secondary button--lg"
                  onClick={resetFilters}
                >
                  <Translate id="news.filter.resetAll">
                    Clear all filters
                  </Translate>
                </button>
                {trimmedQuery && (
                  <Link
                    className="button button--primary button--lg"
                    to={`/search?q=${encodeURIComponent(trimmedQuery)}`}
                  >
                    <Translate
                      id="news.empty.searchSite"
                      values={{ query: trimmedQuery }}
                    >
                      {'Search all of cardano.org for "{query}"'}
                    </Translate>
                  </Link>
                )}
              </div>
            </div>
          )}
        </BoundaryBox>
      </section>

      {/* -------------------------------------------- BAND 6: WATCH & LISTEN */}
      {!hasActiveFilters && latestVideos.length > 0 && (
        <section
          className={styles.videoBand}
          aria-labelledby="watch-listen-heading"
        >
          <BoundaryBox>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.videoEyebrow}>
                  <Translate id="news.video.eyebrow">
                    Videos & Roundtables
                  </Translate>
                </p>
                <h2 id="watch-listen-heading" className={styles.videoHeading}>
                  <Translate id="news.video.heading">Watch & Listen</Translate>
                </h2>
              </div>
              <button
                type="button"
                className={styles.videoAllBtn}
                onClick={() => {
                  updateFilters({ format: "video", scope: "all" });
                  setDrawerOpen(true);
                  scrollToStories();
                }}
              >
                <Translate
                  id="news.video.exploreAll"
                  values={{ count: filterOptions.videoCount }}
                >
                  {"Explore all {count} videos"}
                </Translate>
              </button>
            </div>

            <Grid
              minItemWidth="280px"
              gap="var(--site-space-lg)"
              stackOnMobile
            >
              {latestVideos.map((post) => (
                <NewsCard
                  key={post.slug}
                  post={post}
                  variant="cinema"
                  headingLevel={3}
                />
              ))}
            </Grid>
          </BoundaryBox>
        </section>
      )}

      {/* -------------------------------------------- BAND 7: CLOSING CTA */}
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
  );
}
