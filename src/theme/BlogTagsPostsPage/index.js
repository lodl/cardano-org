import React from 'react';
import clsx from 'clsx';
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import {useBlogTagsPostsPageTitle} from '@docusaurus/theme-common/internal';
import BlogLayout from '@theme/BlogLayout';
import BlogListPaginator from '@theme/BlogListPaginator';
import SearchMetadata from '@theme/SearchMetadata';
import Unlisted from '@theme/ContentVisibility/Unlisted';
import Heading from '@theme/Heading';
import NewsCategoryTiles, {categoryLabel} from '@site/src/components/NewsCategoryTiles';
import NewsGrid from '@site/src/components/NewsGrid';
import {
  categorySlugFromPermalink,
  newsPathsFromTagPath,
} from '@site/src/data/newsCategories';

// Swizzled from @docusaurus/theme-classic BlogTagsPostsPage so a category page
// renders the same way as /news itself: the category tiles stay in place (with
// the current category marked), and the posts become the same card grid.
// Without this the tiles would disappear as soon as a visitor picked a category.
//
// The heading is the category name, without the theme's post count ("80 posts
// tagged with ..."): the tiles already carry the counts, and the description
// line below says what the category holds. The document title keeps the count.

function BlogTagsPostsPageMetadata({tag}) {
  const title = useBlogTagsPostsPageTitle(tag);
  return (
    <>
      <PageMetadata title={title} description={tag.description} />
      <SearchMetadata tag="blog_tags_posts" />
    </>
  );
}

function BlogTagsPostsPageContent({tag, items, listMetadata}) {
  const slug = categorySlugFromPermalink(tag.permalink);
  return (
    <BlogLayout fullWidth>
      {tag.unlisted && <Unlisted />}
      <header>
        <Heading as="h1">{categoryLabel(slug)}</Heading>
      </header>
      <NewsCategoryTiles
        intro={tag.description}
        {...newsPathsFromTagPath(tag.permalink, tag.allTagsPath)}
        activeTag={slug}
      />
      <NewsGrid items={items} />
      <BlogListPaginator metadata={listMetadata} />
    </BlogLayout>
  );
}

export default function BlogTagsPostsPage(props) {
  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogTagPostListPage,
      )}>
      <BlogTagsPostsPageMetadata {...props} />
      <BlogTagsPostsPageContent {...props} />
    </HtmlClassNameProvider>
  );
}
