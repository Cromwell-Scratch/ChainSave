export default function Features() {
  const features = [
    {
      title: "Blockchain Transparency",
      description:
        "Every contribution is securely recorded, creating trust between all members.",
    },
    {
      title: "Community Savings",
      description:
        "Save together with family, friends, groups, and trusted communities.",
    },
    {
      title: "Secure & Reliable",
      description:
        "Built with modern technology to protect savings and transactions.",
    },
  ];

  return (
    <section className="px-10 py-24 bg-white">

      <div className="max-w-6xl mx-auto text-center">

        <h2 className="text-4xl font-bold text-gray-900">
          Why Choose ChainSave?
        </h2>

        <p className="mt-4 text-gray-600">
          Building the future of trusted community savings in Africa.
        </p>


        <div className="grid md:grid-cols-3 gap-8 mt-12">

          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-gray-50 rounded-xl p-8 shadow-sm"
            >

              <h3 className="text-xl font-semibold text-green-700">
                {feature.title}
              </h3>

              <p className="mt-4 text-gray-600">
                {feature.description}
              </p>

            </div>
          ))}

        </div>

      </div>

    </section>
  );
}