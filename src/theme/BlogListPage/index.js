import React from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {translate} from '@docusaurus/Translate';
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import Heading from '@theme/Heading';
import BlogLayout from '@theme/BlogLayout';
import BlogListPaginator from '@theme/BlogListPaginator';
import SearchMetadata from '@theme/SearchMetadata';
import BlogListPageStructuredData from '@theme/BlogListPage/StructuredData';
import NewsCategoryTiles from '@site/src/components/NewsCategoryTiles';
import NewsGrid from '@site/src/components/NewsGrid';
import {newsPathsFromIndexPath} from '@site/src/data/newsCategories';

// Swizzled from @docusaurus/theme-classic BlogListPage to replace the default
// post feed with the news card grid, preceded by the category tiles.
//
// The theme's "Recent posts" sidebar (blogSidebarCount in docusaurus.config.js)
// is not rendered on any news route: it was a flat list of up to 50 titles that
// dominated the listing, and the category tiles plus the grid cover the same
// job. Because the cards link to the sources, the article pages are reached
// through the sitemap and the homepage section; see "Search visibility" in
// docs/get-involved/create-a-news-article.md.
//
// Tag pages render through BlogTagsPostsPage, which reuses the same two
// components, so the filter and the grid look identical on every news route.

function BlogListPageMetadata(props) {
  const {metadata} = props;
  const {
    siteConfig: {title: siteTitle},
  } = useDocusaurusContext();
  const {blogDescription, blogTitle, permalink} = metadata;
  const isBlogOnlyMode = permalink === '/';
  const title = isBlogOnlyMode ? siteTitle : blogTitle;
  return (
    <>
      <PageMetadata title={title} description={blogDescription} />
      <SearchMetadata tag="blog_posts_list" />
    </>
  );
}

function BlogListPageContent(props) {
  const {metadata, items} = props;
  return (
    <BlogLayout fullWidth>
      {/* The heading names the page rather than the filter state (the active
          "All" tile below already shows that); the line passed to the tiles
          covers every category. It is an h2, not an h1: the site hero above
          already carries the page's h1, and the theme version of this page
          rendered no heading at all, so this keeps one h1 per page. */}
      <header>
        <Heading as="h2">
          {translate({id: 'news.index.title', message: 'Latest news'})}
        </Heading>
      </header>
      <NewsCategoryTiles
        intro={translate({
          id: 'news.index.intro',
          message:
            'The complete Cardano feed, newest first, across every category.',
        })}
        {...newsPathsFromIndexPath(metadata.permalink)}
      />
      <NewsGrid items={items} />
      <BlogListPaginator metadata={metadata} />
    </BlogLayout>
  );
}

export default function BlogListPage(props) {
  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogListPage,
      )}>
      <BlogListPageMetadata {...props} />
      <BlogListPageStructuredData {...props} />
      <BlogListPageContent {...props} />
    </HtmlClassNameProvider>
  );
}
