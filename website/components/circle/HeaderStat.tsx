type HeaderStatProps = {
  label: string;
  value: React.ReactNode;
};

export default function HeaderStat({
  label,
  value,
}: HeaderStatProps) {
  return (
    <div className="rounded-xl bg-white/10 p-4">
      <p className="text-xs uppercase tracking-wide text-green-100">
        {label}
      </p>

      <div className="mt-2 text-2xl font-bold text-white">
        {value}
      </div>
    </div>
  );
}