// F3 · Crew home & history - Digital scale / photo thumbnail
export default function DigitalScaleThumbnail({ weight, photoUrl }) {
  if (photoUrl) {
    return (
      <div className="relative w-14 h-12 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
        <img
          src={photoUrl}
          alt={`Scale reading ${weight} kg`}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  // Visual representation of the electronic scale readout
  return (
    <div
      className="relative flex flex-col items-center justify-between w-14 h-12 bg-[#092227] border border-[#14373e] rounded-lg p-1 shrink-0 shadow-inner select-none"
      title={`Scale reading: ${weight} kg`}
      aria-label={`Scale reading: ${weight} kg`}
    >
      {/* Screen frame */}
      <div className="w-full flex-1 flex items-center justify-center bg-[#041114] rounded border border-[#0d2e34] px-1">
        <span className="font-mono text-xs font-bold text-[#2dd4bf] tracking-wider">
          {weight}
        </span>
      </div>

      {/* Device bottom feet / buttons */}
      <div className="flex items-center justify-center gap-2.5 pt-0.5">
        <span className="w-1 h-0.5 rounded-full bg-[#1b4952]" />
        <span className="w-1 h-0.5 rounded-full bg-[#1b4952]" />
      </div>
    </div>
  )
}

