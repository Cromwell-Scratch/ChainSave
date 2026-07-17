export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Create a Savings Circle",
      description:
        "Create or join a trusted community savings group with your family, friends, or business partners.",
    },
    {
      number: "02",
      title: "Members Contribute",
      description:
        "Each member deposits their agreed contribution securely into the savings circle.",
    },
    {
      number: "03",
      title: "Blockchain Records",
      description:
        "Every transaction is transparently recorded and protected using blockchain technology.",
    },
    {
      number: "04",
      title: "Receive Your Payout",
      description:
        "Members receive their savings according to the circle's agreed schedule.",
    },
  ];

  return (
    <section className="px-10 py-24 bg-gray-50">

      <div className="max-w-6xl mx-auto text-center">

        <h2 className="text-4xl font-bold text-gray-900">
          How ChainSave Works
        </h2>

        <p className="mt-4 text-gray-600">
          Simple community savings powered by blockchain trust.
        </p>


        <div className="grid md:grid-cols-4 gap-8 mt-12">

          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-white rounded-xl shadow p-6 text-left"
            >

              <div className="text-green-700 font-bold text-xl">
                {step.number}
              </div>

              <h3 className="mt-4 font-semibold text-lg">
                {step.title}
              </h3>

              <p className="mt-3 text-gray-600 text-sm">
                {step.description}
              </p>

            </div>
          ))}

        </div>

      </div>

    </section>
  );
}