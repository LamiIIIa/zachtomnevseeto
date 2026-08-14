export function initForumView({ main, forumId }) {
  main?.classList.add('forum-design-forum')
  if (forumId !== null) main?.setAttribute('data-forum-id', String(forumId))
}
