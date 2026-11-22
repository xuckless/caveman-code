export type Post = { id: number; title: string; slug: string; body: string; excerpt: string; tags: string[]; createdAt: Date }

const posts: Post[] = []
let nextId = 1

export const db = {
  all: () => [...posts],
  insert(p: Omit<Post, 'id'>): Post { const post = { ...p, id: nextId++ }; posts.push(post); return post },
  findBySlug: (slug: string) => posts.find(p => p.slug === slug),
  reset() { posts.length = 0; nextId = 1 },
}
