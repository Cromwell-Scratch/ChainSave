export default function Footer() {
  return (
    <footer
      id="about"
      className="bg-gray-900 px-4 py-12 text-white sm:px-6"
    >
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h2 className="text-2xl font-bold text-green-400">
            ChainSave
          </h2>

          <p className="mt-4 max-w-sm leading-7 text-gray-400">
            Blockchain-powered community savings
            for Africa.
          </p>
        </div>

        <div>
          <h3 className="font-semibold">
            Company
          </h3>

          <ul className="mt-4 space-y-2 text-gray-400">
            <li>About</li>
            <li>Features</li>
            <li>Contact</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold">
            Community
          </h3>

          <ul className="mt-4 space-y-2 text-gray-400">
            <li>GitHub</li>
            <li>Documentation</li>
            <li>Support</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-gray-700 pt-6 text-center text-sm text-gray-500 sm:text-base">
        © 2026 ChainSave. Built on Rootstock.
      </div>
    </footer>
  );
}
