"use client";

import {
  useEffect,
  useState,
} from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Mail,
  Plus,
  Rocket,
  X,
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";


import ProgressBar from "@/components/create-circle/ProgressBar";
import StepIndicator from "@/components/create-circle/StepIndicator";
import CirclePreview from "@/components/create-circle/CirclePreview";

import { supabase } from "@/lib/supabase";

const TOTAL_STEPS = 4;

type CreationQuote = {
  currency: string;

  platformFee: number;

  estimatedNetworkFee: number;

  actualNetworkFee: number;

  gasSubsidy: number;

  totalCreationCharge: number;
};

export default function CreateCirclePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 — Circle information
  const [circleName, setCircleName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("private");

  // Step 2 — Contribution rules
  const [contributionAmount, setContributionAmount] = useState("");
  const [currency, setCurrency] = useState("GHS");
  const [frequency, setFrequency] = useState("Weekly");
  const [maxMembers, setMaxMembers] = useState("10");
  const [startDate, setStartDate] = useState("");

  // Step 3 — Invitations
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitedMembers, setInvitedMembers] = useState<string[]>([]);

  // Submission state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [creationQuote, setCreationQuote] =
    useState<CreationQuote | null>(null);

  const [quoteLoading, setQuoteLoading] =
    useState(false);

  const [quoteError, setQuoteError] =
    useState("");

  const [
    acceptedCreationFees,
    setAcceptedCreationFees,
  ] = useState(false);

  function validateCurrentStep() {
    setMessage("");

    if (currentStep === 1) {
      if (!circleName.trim()) {
        setMessage("Enter a name for your savings circle.");
        return false;
      }

      if (circleName.trim().length < 3) {
        setMessage("The circle name must contain at least 3 characters.");
        return false;
      }

      if (!description.trim()) {
        setMessage("Enter a short description for your circle.");
        return false;
      }
    }

    if (currentStep === 2) {
      const numericAmount = Number(contributionAmount);
      const numericMaxMembers = Number(maxMembers);

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        setMessage("Enter a valid contribution amount.");
        return false;
      }

      if (
        !Number.isInteger(numericMaxMembers) ||
        numericMaxMembers < 2
      ) {
        setMessage(
          "A savings circle must allow at least 2 members."
        );
        return false;
      }

      if (numericMaxMembers > 100) {
        setMessage(
          "The maximum number of members cannot exceed 100."
        );
        return false;
      }

      if (!startDate) {
        setMessage("Choose a start date for the circle.");
        return false;
      }

      const selectedDate = new Date(`${startDate}T00:00:00`);
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        setMessage("The start date cannot be in the past.");
        return false;
      }
    }

    return true;
  }

  function goToNextStep() {
    if (!validateCurrentStep()) {
      return;
    }

    setCurrentStep((step) =>
      Math.min(step + 1, TOTAL_STEPS)
    );
  }

  function goToPreviousStep() {
    setMessage("");

    setCurrentStep((step) => Math.max(step - 1, 1));
  }

  function addInvitedMember() {
    setMessage("");

    const normalizedEmail = inviteEmail
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      setMessage("Enter an email address.");
      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      setMessage("Enter a valid email address.");
      return;
    }

    if (invitedMembers.includes(normalizedEmail)) {
      setMessage("This email has already been added.");
      return;
    }

    const maximumMembers = Number(maxMembers);

    // One space is reserved for the circle owner.
    if (
      Number.isFinite(maximumMembers) &&
      invitedMembers.length >= maximumMembers - 1
    ) {
      setMessage(
        `You can invite a maximum of ${
          maximumMembers - 1
        } people because the owner occupies one member slot.`
      );
      return;
    }

    setInvitedMembers((members) => [
      ...members,
      normalizedEmail,
    ]);

    setInviteEmail("");
  }

  function removeInvitedMember(email: string) {
    setMessage("");

    setInvitedMembers((members) =>
      members.filter((member) => member !== email)
    );
  }

  function handleInviteEmailKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      addInvitedMember();
    }
  }

  useEffect(() => {
    if (
      currentStep !== TOTAL_STEPS
    ) {
      setCreationQuote(null);
      setQuoteError("");
      setAcceptedCreationFees(false);
      return;
    }

    let cancelled = false;

    async function loadCreationQuote() {
      setQuoteLoading(true);
      setQuoteError("");
      setCreationQuote(null);
      setAcceptedCreationFees(false);

      try {
        const response = await fetch(
          "/api/finance/circle-creation-quote",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              contributionAmount: Number(
                contributionAmount
              ),
              currency,
              maxMembers: Number(
                maxMembers
              ),
            }),
          }
        );

        const responseText =
          await response.text();

        let result: {
        error?: string;
        currency?: string;
        platformFee?: number;
        estimatedNetworkFee?: number;
        actualNetworkFee?: number;
        gasSubsidy?: number;
        totalCreationCharge?: number;
       };

        try {
          result = JSON.parse(responseText);
        } catch {
          throw new Error(
            `The fee service returned an invalid response (${response.status}).`
          );
        }

        if (!response.ok) {
          throw new Error(
            result.error ??
              "Unable to calculate creation fees."
          );
        }

        if (
            !result.currency ||
             typeof result.platformFee !==
             "number" ||
            typeof result.estimatedNetworkFee !==
            "number" ||
            typeof result.actualNetworkFee !==
            "number" ||
            typeof result.gasSubsidy !==
            "number" ||
            typeof result.totalCreationCharge !==
            "number"
            ) {
          throw new Error(
            "The fee service returned incomplete quote data."
          );
        }

        if (!cancelled) {
          setCreationQuote({
             currency: result.currency,
             platformFee:
             result.platformFee,
             estimatedNetworkFee:
             result.estimatedNetworkFee,
             actualNetworkFee:
             result.actualNetworkFee,
             gasSubsidy:
             result.gasSubsidy,
             totalCreationCharge:
             result.totalCreationCharge,
            });
        }
      } catch (error) {
        if (!cancelled) {
          setQuoteError(
            error instanceof Error
              ? error.message
              : "Unable to calculate creation fees."
          );
        }
      } finally {
        if (!cancelled) {
          setQuoteLoading(false);
        }
      }
    }

    void loadCreationQuote();

    return () => {
      cancelled = true;
    };
  }, [
    contributionAmount,
    currency,
    currentStep,
    maxMembers,
  ]);

  async function handleCreateCircle(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (currentStep !== TOTAL_STEPS) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        router.push("/login");
        return;
      }

      if (
        !creationQuote ||
        !acceptedCreationFees
      ) {
        throw new Error(
          "Review and accept the circle creation charges before launching."
        );
      }

      const response = await fetch(
        "/api/circles/create",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            name: circleName,
            description,
            contributionAmount: Number(
              contributionAmount
            ),
            currency,
            contributionFrequency:
              frequency,
            maxMembers: Number(
              maxMembers
            ),
            startDate,
            privacy,
            invitedMembers,
          }),
        }
      );

      const responseText =
        await response.text();

      let result: {
        success?: boolean;
        error?: string;
        circleId?: string;
      };

      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Circle creation returned an invalid response (${response.status}).`
        );
      }

      if (
        !response.ok ||
        !result.success ||
        !result.circleId
      ) {
        throw new Error(
          result.error ??
            "Unable to create the circle."
        );
      }

      router.push(
        `/circles/${result.circleId}`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create the savings circle."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Topbar />

          <section className="p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
                  Savings circles
                </p>

                <h1 className="mt-2 text-4xl font-bold text-gray-900">
                  Create a Savings Circle
                </h1>

                <p className="mt-2 max-w-2xl text-gray-600">
                  Set up your circle, define its contribution
                  rules, invite members, and review everything
                  before launching.
                </p>
              </div>

              <div className="mt-8">
                <ProgressBar
                  currentStep={currentStep}
                  totalSteps={TOTAL_STEPS}
                />
              </div>

              <div className="mt-6">
                <StepIndicator currentStep={currentStep} />
              </div>

              {message && (
                <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {message}
                </p>
              )}

              <form
                onSubmit={handleCreateCircle}
                className="mt-8"
              >
                {/* Step 1 — Circle Information */}
                {currentStep === 1 && (
                  <Card className="mx-auto max-w-4xl">
                    <div>
                      <p className="text-sm font-semibold text-green-700">
                        Step 1
                      </p>

                      <h2 className="mt-1 text-2xl font-bold text-gray-900">
                        Circle Information
                      </h2>

                      <p className="mt-2 text-gray-500">
                        Give your savings circle a clear name
                        and explain its purpose.
                      </p>
                    </div>

                    <div className="mt-8 space-y-6">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Circle Name
                        </label>

                        <Input
                          type="text"
                          placeholder="Family Savings Circle"
                          value={circleName}
                          onChange={(event) =>
                            setCircleName(event.target.value)
                          }
                          maxLength={80}
                          required
                        />

                        <p className="mt-2 text-xs text-gray-500">
                          Choose a name members will recognize
                          easily.
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Description
                        </label>

                        <textarea
                          placeholder="Describe the purpose and goals of this savings circle."
                          value={description}
                          onChange={(event) =>
                            setDescription(event.target.value)
                          }
                          className="min-h-36 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
                          maxLength={500}
                          required
                        />

                        <div className="mt-2 flex justify-between text-xs text-gray-500">
                          <span>
                            Explain what members are saving for.
                          </span>

                          <span>
                            {description.length}/500
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="mb-3 block text-sm font-semibold text-gray-700">
                          Circle Privacy
                        </label>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <label
                            className={`cursor-pointer rounded-2xl border p-5 transition ${
                              privacy === "private"
                                ? "border-green-600 bg-green-50 ring-2 ring-green-600/10"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="privacy"
                              value="private"
                              checked={privacy === "private"}
                              onChange={(event) =>
                                setPrivacy(event.target.value)
                              }
                              className="sr-only"
                            />

                            <p className="font-bold text-gray-900">
                              Private Circle
                            </p>

                            <p className="mt-2 text-sm leading-6 text-gray-500">
                              Only invited users can access and
                              join this circle.
                            </p>
                          </label>

                          <label
                            className={`cursor-pointer rounded-2xl border p-5 transition ${
                              privacy === "public"
                                ? "border-green-600 bg-green-50 ring-2 ring-green-600/10"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="privacy"
                              value="public"
                              checked={privacy === "public"}
                              onChange={(event) =>
                                setPrivacy(event.target.value)
                              }
                              className="sr-only"
                            />

                            <p className="font-bold text-gray-900">
                              Public Circle
                            </p>

                            <p className="mt-2 text-sm leading-6 text-gray-500">
                              Authenticated users can discover and
                              join this circle.
                            </p>
                          </label>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Step 2 — Contribution Rules */}
                {currentStep === 2 && (
                  <Card className="mx-auto max-w-4xl">
                    <div>
                      <p className="text-sm font-semibold text-green-700">
                        Step 2
                      </p>

                      <h2 className="mt-1 text-2xl font-bold text-gray-900">
                        Contribution Rules
                      </h2>

                      <p className="mt-2 text-gray-500">
                        Define how much members contribute and
                        how often payments are expected.
                      </p>
                    </div>

                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Contribution Amount
                        </label>

                        <Input
                          type="number"
                          min="1"
                          step="0.01"
                          placeholder="500"
                          value={contributionAmount}
                          onChange={(event) =>
                            setContributionAmount(
                              event.target.value
                            )
                          }
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Currency
                        </label>

                        <select
                          value={currency}
                          onChange={(event) =>
                            setCurrency(event.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
                        >
                          <option value="GHS">
                            GHS — Ghana Cedi
                          </option>

                          <option value="NGN">
                            NGN — Nigerian Naira
                          </option>

                          <option value="KES">
                            KES — Kenyan Shilling
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Contribution Frequency
                        </label>

                        <select
                          value={frequency}
                          onChange={(event) =>
                            setFrequency(event.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
                        >
                          <option value="Weekly">
                            Weekly
                          </option>

                          <option value="Bi-Weekly">
                            Bi-Weekly
                          </option>

                          <option value="Monthly">
                            Monthly
                          </option>
                        </select>

                        <p className="mt-2 text-xs text-gray-500">
                          Choose how often members must
                          contribute.
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Maximum Members
                        </label>

                        <Input
                          type="number"
                          min="2"
                          max="100"
                          placeholder="10"
                          value={maxMembers}
                          onChange={(event) =>
                            setMaxMembers(event.target.value)
                          }
                          required
                        />

                        <p className="mt-2 text-xs text-gray-500">
                          Includes you as the circle owner.
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Start Date
                        </label>

                        <Input
                          type="date"
                          value={startDate}
                          onChange={(event) =>
                            setStartDate(event.target.value)
                          }
                          required
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {/* Step 3 — Invite Members */}
                {currentStep === 3 && (
                  <Card className="mx-auto max-w-4xl">
                    <div>
                      <p className="text-sm font-semibold text-green-700">
                        Step 3
                      </p>

                      <h2 className="mt-1 text-2xl font-bold text-gray-900">
                        Invite Members
                      </h2>

                      <p className="mt-2 text-gray-500">
                        Add member email addresses now, or skip
                        this step and invite people later.
                      </p>
                    </div>

                    <div className="mt-8">
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Member Email Address
                      </label>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="flex-1">
                          <Input
                            type="email"
                            placeholder="member@example.com"
                            value={inviteEmail}
                            onChange={(event) =>
                              setInviteEmail(
                                event.target.value
                              )
                            }
                            onKeyDown={
                              handleInviteEmailKeyDown
                            }
                          />
                        </div>

                        <Button
                          type="button"
                          onClick={addInvitedMember}
                        >
                          <Plus className="mr-2 h-5 w-5" />
                          Add Member
                        </Button>
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        Invitations will appear inside the
                        invited user&apos;s ChainSave account.
                      </p>
                    </div>

                    <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-gray-900">
                            Invitation List
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            {invitedMembers.length} member
                            {invitedMembers.length === 1
                              ? ""
                              : "s"}{" "}
                            added
                          </p>
                        </div>

                        <Mail className="h-6 w-6 text-green-700" />
                      </div>

                      {invitedMembers.length === 0 ? (
                        <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                          <p className="font-semibold text-gray-900">
                            No members added yet
                          </p>

                          <p className="mt-2 text-sm text-gray-500">
                            You can continue without inviting
                            anyone.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-5 space-y-3">
                          {invitedMembers.map((email) => (
                            <div
                              key={email}
                              className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 font-semibold uppercase text-green-700">
                                  {email.charAt(0)}
                                </div>

                                <p className="truncate font-medium text-gray-900">
                                  {email}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeInvitedMember(email)
                                }
                                className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                aria-label={`Remove ${email}`}
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Step 4 — Review */}
                {currentStep === 4 && (
                  <div className="grid gap-8 xl:grid-cols-[1fr_0.8fr]">
                    <Card>
                      <div>
                        <p className="text-sm font-semibold text-green-700">
                          Step 4
                        </p>

                        <h2 className="mt-1 text-2xl font-bold text-gray-900">
                          Review &amp; Launch
                        </h2>

                        <p className="mt-2 text-gray-500">
                          Confirm the details below before
                          creating your circle.
                        </p>
                      </div>

                      <div className="mt-8 space-y-5">
                        <ReviewRow
                          label="Circle Name"
                          value={circleName}
                        />

                        <ReviewRow
                          label="Privacy"
                          value={
                            privacy === "public"
                              ? "Public Circle"
                              : "Private Circle"
                          }
                        />

                        <ReviewRow
                          label="Contribution"
                          value={`${currency} ${Number(
                            contributionAmount
                          ).toLocaleString("en-GH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                        />

                        <ReviewRow
                          label="Frequency"
                          value={frequency}
                        />

                        <ReviewRow
                          label="Maximum Members"
                          value={maxMembers}
                        />

                        <ReviewRow
                          label="Start Date"
                          value={
                            startDate
                              ? new Date(
                                  `${startDate}T00:00:00`
                                ).toLocaleDateString()
                              : "Not selected"
                          }
                        />

                        <ReviewRow
                          label="Invitations"
                          value={`${invitedMembers.length} invited`}
                        />

                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                          <h3 className="font-bold text-gray-900">
                            Circle Creation Charges
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            ChainSave uses its secure platform
                            relayer to submit the Rootstock
                            transaction. You pay the platform
                            and network charges in your local
                            currency.
                          </p>

                          {quoteLoading ? (
                            <p className="mt-5 text-sm font-medium text-gray-600">
                              Calculating the current network
                              fee...
                            </p>
                          ) : quoteError ? (
                            <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                              {quoteError}
                            </p>
                          ) : creationQuote ? (
                            <div className="mt-5 space-y-4">
                              <ReviewRow
                                label="Platform Fee"
                                value={`${
                                  creationQuote.currency
                                } ${creationQuote.platformFee.toFixed(
                                  2
                                )}`}
                              />

                              <ReviewRow
                                label="Estimated Network Fee"
                                value={`${
                                  creationQuote.currency
                                } ${creationQuote.estimatedNetworkFee.toFixed(
                                  2
                                )}`}
                              />

                              <div className="flex items-center justify-between gap-4 border-t border-gray-300 pt-4">
                                <p className="font-bold text-gray-900">
                                  Total Creation Charge
                                </p>

                                <p className="text-xl font-bold text-green-700">
                                  {
                                    creationQuote.currency
                                  }{" "}
                                  {creationQuote.totalCreationCharge.toFixed(
                                    2
                                  )}
                                </p>
                              </div>

                              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
                                <input
                                  type="checkbox"
                                  checked={
                                    acceptedCreationFees
                                  }
                                  onChange={(event) =>
                                    setAcceptedCreationFees(
                                      event.target.checked
                                    )
                                  }
                                  className="mt-1 h-4 w-4 accent-green-700"
                                />

                                <span className="text-sm leading-6 text-gray-600">
                                  I understand and agree to the
                                  Platform Fee and Rootstock
                                  Network Fee shown above.
                                </span>
                              </label>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-5">
                        <div className="flex gap-3">
                          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-700" />

                          <div>
                            <p className="font-bold text-green-900">
                              Ready to launch
                            </p>

                            <p className="mt-1 text-sm leading-6 text-green-800">
                              You will become the accepted owner,
                              while invited members will receive
                              pending invitations.
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <CirclePreview
                      name={circleName}
                      description={description}
                      contributionAmount={
                        contributionAmount
                      }
                      currency={currency}
                      frequency={frequency}
                      maxMembers={maxMembers}
                      startDate={startDate}
                      privacy={privacy}
                      invitedMembers={invitedMembers}
                    />
                  </div>
                )}

                {/* Navigation */}
                <div className="mx-auto mt-8 flex max-w-7xl flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={goToPreviousStep}
                        disabled={loading}
                      >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Back
                      </Button>
                    )}
                  </div>

                  <div>
                    {currentStep < TOTAL_STEPS ? (
                     <button
                      type="button"
                        onClick={goToNextStep}
                        className="inline-flex items-center justify-center rounded-lg bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
                      >
                        Continue
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={
                          loading ||
                          quoteLoading ||
                          !creationQuote ||
                          !acceptedCreationFees
                        }
                      >
                        <Rocket className="mr-2 h-5 w-5" />

                        {loading
                          ? "Launching Circle..."
                          : "Launch Circle"}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

type ReviewRowProps = {
  label: string;
  value: string;
};

function ReviewRow({
  label,
  value,
}: ReviewRowProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <p className="text-sm font-medium text-gray-500">
        {label}
      </p>

      <p className="font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}