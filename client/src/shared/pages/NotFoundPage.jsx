// SHARED FILE - shown for unknown URLs.
import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
        <Link to="/" className="mt-4 inline-block text-teal-700 underline">
          Back to start
        </Link>
      </div>
    </main>
  )
}
