export default function FavouritesPage() {
  return (
    <div className="flex flex-col items-center px-5 pb-8 pt-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sunken text-ink-faint">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path
            d="M12 20.5s-7.5-4.6-9.6-9.2C1.1 8 2.6 4.8 5.9 4.1c2-.4 3.8.5 4.9 2.1a5 5 0 0 1 1.2 1.6 5 5 0 0 1 1.2-1.6c1.1-1.6 2.9-2.5 4.9-2.1 3.3.7 4.8 3.9 3.5 7.2C19.5 15.9 12 20.5 12 20.5Z"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <p className="mt-4 text-sm font-medium text-ink">No favourites yet</p>
      <p className="mt-1 text-xs text-ink-muted">Tap the heart on a design to save it here.</p>
    </div>
  );
}
