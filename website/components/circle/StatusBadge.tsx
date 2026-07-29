type StatusBadgeProps = {
  status: string;
};

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  const classes =
    status === "active"
      ? "bg-green-100/20 text-white"
      : status === "paused"
        ? "bg-yellow-100/20 text-yellow-50"
        : status === "completed"
          ? "bg-gray-100/20 text-gray-100"
          : "bg-blue-100/20 text-blue-50";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${classes}`}
    >
      {status}
    </span>
  );
}