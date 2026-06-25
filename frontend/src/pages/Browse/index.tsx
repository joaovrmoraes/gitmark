import { Book } from './Book'

// The reading experience is unified (swipe + keyboard + edge nav adapt to the
// device), so Browse renders a single Book rather than a desktop/mobile split.
export default function BrowsePage() {
  return <Book />
}
