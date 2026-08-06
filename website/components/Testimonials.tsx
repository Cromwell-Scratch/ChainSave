import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Ama Mensah",
    country: "Accra, Ghana",
    comment:
      "ChainSave helped our family save consistently for our home renovation. Everyone could see every contribution, so there were no misunderstandings.",
  },
  {
    name: "David Otieno",
    country: "Nairobi, Kenya",
    comment:
      "Our investment group finally has a transparent savings platform. The Bitcoin-powered security gives us confidence.",
  },
  {
    name: "Amina Bello",
    country: "Lagos, Nigeria",
    comment:
      "We replaced our WhatsApp savings group with ChainSave. Managing contributions is now much easier.",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-gray-50 py-16 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 text-center sm:mb-14 lg:mb-16">
          <span className="inline-block rounded-full bg-green-100 px-5 py-2 text-sm font-semibold text-green-700">
            Testimonials
          </span>

          <h2 className="mt-5 text-3xl font-bold text-gray-900 sm:mt-6 sm:text-4xl lg:text-5xl">
            Trusted Across Africa
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 sm:text-xl">
            Hear what early users say about
            ChainSave.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className="rounded-3xl bg-white p-6 shadow-lg transition duration-300 hover:-translate-y-2 sm:p-8"
            >
              <div className="mb-6 flex">
                {[1, 2, 3, 4, 5].map(
                  (star) => (
                    <Star
                      key={star}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  )
                )}
              </div>

              <p className="leading-8 text-gray-600 italic">
                &ldquo;{item.comment}&rdquo;
              </p>

              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900">
                  {item.name}
                </h3>

                <p className="text-gray-500">
                  {item.country}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
