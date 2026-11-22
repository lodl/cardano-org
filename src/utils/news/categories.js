import { translate } from "@docusaurus/Translate";

// Canonical tag order matching blog/tags.yml.
export const CATEGORY_ORDER = [
  "development",
  "research",
  "governance",
  "community",
  "ecosystem",
  "education",
  "events",
];

// On-brand category tiles (site Open Graph images) used when a post has no
// banner image or YouTube thumbnail of its own.
export const CATEGORY_IMAGES = {
  development: "/img/og/developers.jpg",
  research: "/img/og/research.jpg",
  governance: "/img/og/governance.jpg",
  community: "/img/og/ambassadors.jpg",
  ecosystem: "/img/og/cardano-news.jpg",
  education: "/img/og/get-started.jpg",
  events: "/img/og/events.jpg",
};

export const DEFAULT_IMAGE = "/img/og/default.jpg";

// Display labels built per render with literal translate() IDs so Crowdin and
// write-translations extract every key cleanly.
export function getCategoryLabels() {
  return {
    development: translate({ id: "news.category.development", message: "Development" }),
    research: translate({ id: "news.category.research", message: "Research" }),
    governance: translate({ id: "news.category.governance", message: "Governance" }),
    community: translate({ id: "news.category.community", message: "Community" }),
    ecosystem: translate({ id: "news.category.ecosystem", message: "Ecosystem" }),
    education: translate({ id: "news.category.education", message: "Education" }),
    events: translate({ id: "news.category.events", message: "Events" }),
  };
}

// Descriptions matching blog/tags.yml, built per render with literal IDs.
export function getCategoryDescriptions() {
  return {
    development: translate({
      id: "news.categoryDesc.development",
      message: "Weekly development reports, protocol progress, tooling, and developer resources.",
    }),
    research: translate({
      id: "news.categoryDesc.research",
      message: "Peer-reviewed research, Ouroboros, and scaling work behind Cardano.",
    }),
    governance: translate({
      id: "news.categoryDesc.governance",
      message: "On-chain governance, Project Catalyst, Intersect, and stake pool operations.",
    }),
    community: translate({
      id: "news.categoryDesc.community",
      message: "Community digests, ambassadors, and grassroots initiatives.",
    }),
    ecosystem: translate({
      id: "news.categoryDesc.ecosystem",
      message: "Ecosystem news, partnerships, adoption, and Cardano Foundation updates.",
    }),
    education: translate({
      id: "news.categoryDesc.education",
      message: "Guides, tutorials, and learning resources for Cardano.",
    }),
    events: translate({
      id: "news.categoryDesc.events",
      message: "Summits, hackathons, meetups, and community events.",
    }),
  };
}
