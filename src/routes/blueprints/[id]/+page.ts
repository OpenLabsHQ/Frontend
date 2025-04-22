// Only load the id from parameters - let the component fetch the data
import type { PageLoad } from './$types'

// Mark this as a client-side load function
export const ssr = false

export const load = (({ params }) => {
  // Just return the blueprint ID
  return {
    blueprintId: params.id,
  }
}) satisfies PageLoad
