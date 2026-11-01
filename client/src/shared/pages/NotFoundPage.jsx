// SHARED FILE - shown for unknown URLs.
import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#edf2f4] p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold text-[#0c1d23]">Page not found</h1>
        <Link to="/" className="mt-4 inline-block text-[#0c6e80] underline">
          Back to start
        </Link>
      </div>
    </main>
  )
}
