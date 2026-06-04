import process from "node:process"
import type { NewsItem } from "@shared/types"

const feed = defineRSSSource("https://www.producthunt.com/feed")

export default defineSource(async () => {
  const apiToken = process.env.PRODUCTHUNT_API_TOKEN
  if (!apiToken) return feed()

  const query = `
    query {
      posts(first: 30, order: VOTES) {
        edges {
          node {
            id
            name
            tagline
            votesCount
            url
            slug
          }
        }
      }
    }
  `

  try {
    const response: any = await myFetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ query }),
    })

    const posts = response?.data?.posts?.edges || []
    const news: NewsItem[] = posts.map((edge: any) => {
      const post = edge.node
      return {
        id: post.id,
        title: post.name,
        url: post.url || `https://www.producthunt.com/posts/${post.slug}`,
        extra: {
          info: ` △︎ ${post.votesCount || 0}`,
          hover: post.tagline,
        },
      }
    }).filter((post: NewsItem) => post.id && post.title)

    return news.length ? news : feed()
  } catch {
    return feed()
  }
})
