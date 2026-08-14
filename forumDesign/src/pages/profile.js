export function initProfile({ main, userId }) {
  main?.classList.add('forum-design-profile')
  if (userId !== null) main?.setAttribute('data-user-id', String(userId))
}
