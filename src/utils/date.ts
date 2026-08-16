export function monthsSince(date?: string): number {
  if (!date) return 0
  const past = new Date(date)
  const now = new Date()
  return (now.getFullYear() - past.getFullYear()) * 12 + now.getMonth() - past.getMonth()
}

export function formatRelativeTime(date?: string): string {
  if (!date) return ''
  const past = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - past.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 1) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 30) return `${diffDays} days ago`
  const months = Math.floor(diffDays / 30)
  if (months < 12) return `${months} months ago`
  const years = Math.floor(months / 12)
  return `${years} year${years > 1 ? 's' : ''} ago`
}
