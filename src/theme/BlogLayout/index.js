import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import SiteHero from "@site/src/components/Layout/SiteHero";
import OpenGraphInfo from "@site/src/components/Layout/OpenGraphInfo";
import Link from '@docusaurus/Link';

// Shared frame of every news route: the hero, then one centered content column.
//
// The theme's "Recent posts" sidebar (blogSidebarCount in docusaurus.config.js)
// is deliberately not rendered anywhere in the news section anymore. It was a
// flat list of up to 50 titles on every page, and the category tiles plus the
// card grid replace it on the listing, on the tag pages and on the articles.
//
// `fullWidth` is for the listing pages, which hold the card grid. Everything
// else keeps a comfortable reading measure. `top` renders above the content
// column, at full container width: the article page puts the category tiles
// there, because eight tiles cannot be legible inside a reading column.
export default function BlogLayout(props) {
  const {children, fullWidth, top, toc, ...layoutProps} = props;
  return (
    <Layout {...layoutProps}>
      <OpenGraphInfo pageName="cardano-news" />
      <SiteHero
            title='Cardano News'
            description='Explore the stories below for curated news, stories, and inspiration from within the Cardano ecosystem.'
            bannerType ='waves'
          />
      <div className="container margin-vert--lg">
        {top}
        <div className="row">
          <main
            className={clsx('col', {
              'col--8 col--offset-2': !fullWidth,
              'col--12': fullWidth,
            })}
            itemScope
            itemType="https://schema.org/Blog">
            {children}
            <div className="add-news-link" style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link to="/docs/get-involved/create-a-news-article">add news article</Link>
            </div>
          </main>
          {toc && <div className="col col--2">{toc}</div>}
        </div>
      </div>
    </Layout>
  );
}
