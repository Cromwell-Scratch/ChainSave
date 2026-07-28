type ProgressBarProps = {
  currentStep: number;
  totalSteps?: number;
};

export default function ProgressBar({
  currentStep,
  totalSteps = 4,
}: ProgressBarProps) {
  const progress = Math.min(
    100,
    Math.max(0, (currentStep / totalSteps) * 100)
  );

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">
          Step {currentStep} of {totalSteps}
        </p>

        <p className="text-sm font-medium text-green-700">
          {Math.round(progress)}% complete
        </p>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-green-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}