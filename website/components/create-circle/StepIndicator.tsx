import {
  Check,
  CircleDollarSign,
  ClipboardCheck,
  UserPlus,
  Users,
} from "lucide-react";

type StepIndicatorProps = {
  currentStep: number;
};

const steps = [
  {
    number: 1,
    title: "Circle Information",
    icon: Users,
  },
  {
    number: 2,
    title: "Contribution Rules",
    icon: CircleDollarSign,
  },
  {
    number: 3,
    title: "Invite Members",
    icon: UserPlus,
  },
  {
    number: 4,
    title: "Review & Launch",
    icon: ClipboardCheck,
  },
];

export default function StepIndicator({
  currentStep,
}: StepIndicatorProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {steps.map((step) => {
        const Icon = step.icon;
        const isCompleted = currentStep > step.number;
        const isActive = currentStep === step.number;

        return (
          <div
            key={step.number}
            className={`rounded-2xl border p-4 transition ${
              isActive
                ? "border-green-600 bg-green-50 shadow-sm"
                : isCompleted
                  ? "border-green-200 bg-white"
                  : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  isCompleted
                    ? "bg-green-600 text-white"
                    : isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>

              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    isActive || isCompleted
                      ? "text-green-700"
                      : "text-gray-400"
                  }`}
                >
                  Step {step.number}
                </p>

                <p
                  className={`mt-1 font-semibold ${
                    isActive
                      ? "text-gray-900"
                      : "text-gray-600"
                  }`}
                >
                  {step.title}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}