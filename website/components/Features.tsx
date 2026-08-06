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
    <section
      id="features"
      className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Why Choose ChainSave?
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
          Building the future of trusted
          community savings in Africa.
        </p>

        <div className="mt-10 grid gap-5 sm:mt-12 md:grid-cols-3 md:gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl bg-gray-50 p-6 text-left shadow-sm sm:p-8 md:text-center"
            >
              <h3 className="text-xl font-semibold text-green-700">
                {feature.title}
              </h3>

              <p className="mt-4 leading-7 text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
