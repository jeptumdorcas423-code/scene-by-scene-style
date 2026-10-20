export const pageHead = (title: string, description: string) => ({
  meta: [
    { title: `${title} · Azure Buddy` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · Azure Buddy` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
