export default function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-white via-green-50 to-white">
     <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">

        {/* Left Side */}
        <div>
          <h1 className="text-6xl font-bold text-gray-900 leading-tight">
            Save Together.
            <br />
            Grow Together.
          </h1>

          <p className="max-w-lg text-lg leading-8 text-gray-600">
  ChainSave helps communities across Africa save securely together
  using transparent blockchain-powered savings circles.
</p>

          <div className="mt-8 flex gap-4">
            <button className="bg-green-700 text-white px-6 py-3 rounded-lg">
              Create Account
            </button>

            <button className="border px-6 py-3 rounded-lg">
              Learn More
            </button>
          </div>
        </div>


        {/* Right Side Savings Card */}
        <div className="absolute right-8 top-10 w-[260px] h-[260px] rounded-full bg-green-300 blur-[120px] opacity-20"></div>
        <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 w-[420px] border border-gray-100">
            <div className="relative flex justify-center lg:justify-end"></div>
          <h3 className="text-xl font-semibold">
            Family Savings Circle
          </h3>

          <p className="text-gray-500 mt-2">
            10 Members
          </p>

          <div className="flex gap-1 mt-4">
  <div className="w-10 h-10 rounded-full bg-green-600 border-2 border-white"></div>
  <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-white"></div>
  <div className="w-10 h-10 rounded-full bg-yellow-500 border-2 border-white"></div>
  <div className="w-10 h-10 rounded-full bg-purple-500 border-2 border-white"></div>

  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold border-2 border-white">
    +6
  </div>
</div>

          <h2 className="text-3xl font-bold text-green-700 mt-4">
            ₵5,000
          </h2>

          <p className="text-gray-500">
            Total Saved
          </p>

          <p className="text-sm text-gray-500 mt-1">
  Goal: ₵6,250
</p>


          <div className="mt-6 bg-gray-200 rounded-full h-3">
            <div className="bg-green-700 h-3 rounded-full w-4/5"></div>
          </div>


<p className="mt-3 text-sm text-gray-500">
  80% completed
</p>

<div className="mt-6 border-t pt-4">
  <p className="text-sm text-gray-500">
    Latest Activity
  </p>

  <div className="flex justify-between items-center mt-2">
    <div>
      <p className="font-semibold">
        Ama K.
      </p>
      <p className="text-sm text-gray-500">
        Deposit Received
      </p>
    </div>

    <p className="font-bold text-green-700">
      +₵500
    </p>
  </div>
</div>

  </div>



      </div>
    </section>
  );
}