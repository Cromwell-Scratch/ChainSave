export default function Navbar() {
  return (
    <nav className="w-full bg-black text-white px-8 py-5 flex items-center justify-between">
      
      {/* Logo */}
      <div className="text-2xl font-bold text-green-600">
        ChainSave
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-8 text-gray-300">
        <a href="#" className="hover:text-white">
          Home
        </a>

        <a href="#" className="hover:text-white">
          Features
        </a>

        <a href="#" className="hover:text-white">
          Circles
        </a>

        <a href="#" className="hover:text-white">
          About
        </a>

        <a href="#" className="hover:text-white">
          Login
        </a>

        <button className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold">
          Get Started
        </button>
      </div>

    </nav>
  );
}