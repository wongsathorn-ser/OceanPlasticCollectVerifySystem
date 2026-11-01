// F1 · Accounts & access - light teal information banner (Figma).
//   <InfoBanner icon={ShieldIcon}>Nobody can sign in until you approve them.</InfoBanner>
import { InfoIcon } from './icons.jsx'

export default function InfoBanner({ icon: Icon = InfoIcon, className = '', children }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl bg-[#dceef1] px-4 py-3 text-sm text-[#0e4a56] ${className}`}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  )
}
