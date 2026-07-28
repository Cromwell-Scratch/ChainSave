export default function Stats() {
  const stats = [
    {
      value: "10,000+",
      label: "Community Members",
    },
    {
      value: "GHS 2.5M+",
      label: "Total Saved",
    },
    {
      value: "500+",
      label: "Savings Circles",
    },
    {
      value: "3",
      label: "Countries",
    },
  ];

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">

          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h2 className="text-5xl font-bold text-green-600">
                {item.value}
              </h2>

              <p className="mt-3 text-gray-600">
                {item.label}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}