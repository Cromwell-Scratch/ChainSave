export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-10">

      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10">

        <div>
          <h2 className="text-2xl font-bold text-green-400">
            ChainSave
          </h2>

          <p className="mt-4 text-gray-400">
            Blockchain-powered community savings for Africa.
          </p>
        </div>

        <div>
          <h3 className="font-semibold">
            Company
          </h3>

          <ul className="space-y-2 mt-4 text-gray-400">
            <li>About</li>
            <li>Features</li>
            <li>Contact</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold">
            Community
          </h3>

          <ul className="space-y-2 mt-4 text-gray-400">
            <li>GitHub</li>
            <li>Documentation</li>
            <li>Support</li>
          </ul>
        </div>

      </div>

      <div className="text-center text-gray-500 mt-10 border-t border-gray-700 pt-6">
        © 2026 ChainSave. Built on Rootstock.
      </div>

    </footer>
  );
}