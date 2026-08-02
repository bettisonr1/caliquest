export function OsmAttribution() {
  return (
    <p className="text-[11px] text-gray-500">
      Gym data ©{' '}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-gray-400"
      >
        OpenStreetMap contributors
      </a>
    </p>
  )
}
