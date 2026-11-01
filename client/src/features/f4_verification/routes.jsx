// F4 · Verification - routes owned by Hein Thant Si Thu.
// Each route is { path, element, roles }; App.jsx picks them up automatically,
// so add new pages here instead of editing App.jsx.
import DecisionHistoryPage from './pages/DecisionHistoryPage.jsx'
import ReviewRecordPage from './pages/ReviewRecordPage.jsx'
import VerifyQueuePage from './pages/VerifyQueuePage.jsx'

// Signed-in pages (inside the side-navigation layout)
export const appRoutes = [
  { path: '/verify', element: <VerifyQueuePage />, roles: ['SPONSOR_MANAGEMENT'] },
  { path: '/verify/history', element: <DecisionHistoryPage />, roles: ['SPONSOR_MANAGEMENT'] },
  { path: '/verify/:recordId', element: <ReviewRecordPage />, roles: ['SPONSOR_MANAGEMENT'] },
]
