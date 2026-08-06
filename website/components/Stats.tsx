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
    <section className="bg-white py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="min-w-0 rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-6 lg:p-8"
            >
              <h2 className="break-words text-3xl font-bold leading-tight text-green-600 sm:text-4xl lg:text-5xl">
                {item.value}
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
