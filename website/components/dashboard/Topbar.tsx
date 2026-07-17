export default function Topbar() {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-5">


      <div className="flex items-center gap-4">
        <button
          type="button"
          className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Notifications
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-700 font-semibold text-white">
          N
        </div>
      </div>
    </header>
  );
}