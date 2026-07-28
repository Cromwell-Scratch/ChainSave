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
    <section className="py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">

          <span className="inline-block rounded-full bg-green-100 px-5 py-2 text-sm font-semibold text-green-700">
            Testimonials
          </span>

          <h2 className="mt-6 text-5xl font-bold">
            Trusted Across Africa
          </h2>

          <p className="mt-4 text-xl text-gray-600">
            Hear what early users say about ChainSave.
          </p>

        </div>

        <div className="grid md:grid-cols-3 gap-8">

          {testimonials.map((item) => (

            <div
              key={item.name}
              className="bg-white rounded-3xl p-8 shadow-lg hover:-translate-y-2 transition duration-300"
            >

              <div className="flex mb-6">
                {[1,2,3,4,5].map((star)=>(
                  <Star
                    key={star}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <p className="text-gray-600 leading-8 italic">
                "{item.comment}"
              </p>

              <div className="mt-8">

                <h3 className="font-bold text-lg">
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