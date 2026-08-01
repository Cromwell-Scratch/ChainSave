"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  Moon,
  Save,
  ShieldCheck,
  Sun,
  UserRound,
  Wallet,
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { supabase } from "@/lib/supabase";

type SettingsTab =
  | "profile"
  | "security"
  | "notifications"
  | "payments"
  | "appearance";

interface NotificationPreferences {
  contributions: boolean;
  payouts: boolean;
  invitations: boolean;
  circles: boolean;
  wallet: boolean;
  marketing: boolean;
}

interface PaymentPreferences {
  defaultCurrency: string;
  defaultPaymentMethod: string;
  confirmPayments: boolean;
}

const defaultNotifications: NotificationPreferences = {
  contributions: true,
  payouts: true,
  invitations: true,
  circles: true,
  wallet: true,
  marketing: false,
};

const defaultPayments: PaymentPreferences = {
  defaultCurrency: "GHS",
  defaultPaymentMethod: "wallet",
  confirmPayments: true,
};

export default function SettingsPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] =
    useState<SettingsTab>("profile");

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);
  const [showNewPassword, setShowNewPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [notifications, setNotifications] =
    useState<NotificationPreferences>(defaultNotifications);

  const [payments, setPayments] =
    useState<PaymentPreferences>(defaultPayments);

  const [appearance, setAppearance] = useState<
    "light" | "dark" | "system"
  >("light");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setPageLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    const user = session.user;

    setEmail(user.email ?? "");
    setFullName(
      user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        ""
    );

    const savedNotifications = localStorage.getItem(
      "chainsave_notification_preferences"
    );

    const savedPayments = localStorage.getItem(
      "chainsave_payment_preferences"
    );

    const savedAppearance = localStorage.getItem(
      "chainsave_appearance"
    );

    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch {
        setNotifications(defaultNotifications);
      }
    }

    if (savedPayments) {
      try {
        setPayments(JSON.parse(savedPayments));
      } catch {
        setPayments(defaultPayments);
      }
    }

    if (
      savedAppearance === "light" ||
      savedAppearance === "dark" ||
      savedAppearance === "system"
    ) {
      setAppearance(savedAppearance);
    }

    setPageLoading(false);
  }

  function showMessage(
    text: string,
    type: "success" | "error"
  ) {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage("");
    }, 4000);
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();

    if (!fullName.trim()) {
      showMessage("Please enter your full name.", "error");
      return;
    }

    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim(),
      },
    });

    setSaving(false);

    if (error) {
      showMessage(error.message, "error");
      return;
    }

    showMessage("Profile updated successfully.", "success");
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();

    if (!newPassword || !confirmPassword) {
      showMessage(
        "Enter and confirm your new password.",
        "error"
      );
      return;
    }

    if (newPassword.length < 8) {
      showMessage(
        "Your password must contain at least 8 characters.",
        "error"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage("The passwords do not match.", "error");
      return;
    }

    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setSaving(false);

    if (error) {
      showMessage(error.message, "error");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    showMessage("Password changed successfully.", "success");
  }

  function saveNotifications() {
    localStorage.setItem(
      "chainsave_notification_preferences",
      JSON.stringify(notifications)
    );

    showMessage(
      "Notification preferences saved.",
      "success"
    );
  }

  function savePaymentPreferences() {
    localStorage.setItem(
      "chainsave_payment_preferences",
      JSON.stringify(payments)
    );

    showMessage("Payment preferences saved.", "success");
  }

  function saveAppearance(
    selectedAppearance: "light" | "dark" | "system"
  ) {
    setAppearance(selectedAppearance);

    localStorage.setItem(
      "chainsave_appearance",
      selectedAppearance
    );

    if (selectedAppearance === "dark") {
      document.documentElement.classList.add("dark");
    } else if (selectedAppearance === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      document.documentElement.classList.toggle(
        "dark",
        prefersDark
      );
    }

    showMessage("Appearance preference saved.", "success");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const tabs = [
    {
      id: "profile" as SettingsTab,
      label: "Profile",
      description: "Personal information",
      icon: UserRound,
    },
    {
      id: "security" as SettingsTab,
      label: "Security",
      description: "Password and protection",
      icon: ShieldCheck,
    },
    {
      id: "notifications" as SettingsTab,
      label: "Notifications",
      description: "Choose what you receive",
      icon: Bell,
    },
    {
      id: "payments" as SettingsTab,
      label: "Payments",
      description: "Currency and payment defaults",
      icon: CreditCard,
    },
    {
      id: "appearance" as SettingsTab,
      label: "Appearance",
      description: "Customize your experience",
      icon: Sun,
    },
  ];

  if (pageLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-11 w-11 animate-spin text-green-600" />

          <p className="mt-4 text-gray-600">
            Loading settings...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Topbar />

          <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-600">
                Account Preferences
              </p>

              <h1 className="mt-2 text-4xl font-bold text-gray-900">
                Settings
              </h1>

              <p className="mt-2 text-gray-500">
                Manage your profile, security and ChainSave
                preferences.
              </p>
            </div>

            {message && (
              <div
                className={`mt-6 flex items-center gap-3 rounded-2xl border px-5 py-4 ${
                  messageType === "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {messageType === "success" && (
                  <Check className="h-5 w-5" />
                )}

                <p className="font-medium">{message}</p>
              </div>
            )}

            <div className="mt-8 grid gap-8 lg:grid-cols-[310px_minmax(0,1fr)]">
              <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-3 shadow-sm">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`mb-1 flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left transition ${
                        active
                          ? "bg-green-600 text-white shadow-md"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                          active
                            ? "bg-white/15"
                            : "bg-gray-100"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                          {tab.label}
                        </p>

                        <p
                          className={`mt-1 truncate text-xs ${
                            active
                              ? "text-green-50"
                              : "text-gray-500"
                          }`}
                        >
                          {tab.description}
                        </p>
                      </div>

                      <ChevronRight className="h-4 w-4" />
                    </button>
                  );
                })}

                <div className="my-3 border-t border-gray-100" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left text-red-600 transition hover:bg-red-50"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                    <LogOut className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-semibold">Log out</p>

                    <p className="mt-1 text-xs text-red-400">
                      End your current session
                    </p>
                  </div>
                </button>
              </aside>

              <div>
                {activeTab === "profile" && (
                  <form
                    onSubmit={saveProfile}
                    className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
                  >
                    <SectionHeader
                      icon={<UserRound className="h-6 w-6" />}
                      title="Profile Information"
                      description="Update the personal information connected to your account."
                    />

                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                      <Field label="Full name">
                        <input
                          value={fullName}
                          onChange={(event) =>
                            setFullName(event.target.value)
                          }
                          placeholder="Enter your full name"
                          className="settings-input"
                        />
                      </Field>

                      <Field label="Email address">
                        <input
                          value={email}
                          readOnly
                          className="settings-input cursor-not-allowed bg-gray-50 text-gray-500"
                        />
                      </Field>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <SaveButton saving={saving}>
                        Save Profile
                      </SaveButton>
                    </div>
                  </form>
                )}

                {activeTab === "security" && (
                  <form
                    onSubmit={changePassword}
                    className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
                  >
                    <SectionHeader
                      icon={<Lock className="h-6 w-6" />}
                      title="Password & Security"
                      description="Use a strong password to protect your ChainSave account."
                    />

                    <div className="mt-8 space-y-6">
                      <PasswordField
                        label="Current password"
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        visible={showCurrentPassword}
                        onToggle={() =>
                          setShowCurrentPassword(
                            !showCurrentPassword
                          )
                        }
                      />

                      <PasswordField
                        label="New password"
                        value={newPassword}
                        onChange={setNewPassword}
                        visible={showNewPassword}
                        onToggle={() =>
                          setShowNewPassword(!showNewPassword)
                        }
                      />

                      <PasswordField
                        label="Confirm new password"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        visible={showConfirmPassword}
                        onToggle={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                      />
                    </div>

                    <div className="mt-8 flex justify-end">
                      <SaveButton saving={saving}>
                        Change Password
                      </SaveButton>
                    </div>
                  </form>
                )}

                {activeTab === "notifications" && (
                  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
                    <SectionHeader
                      icon={<Bell className="h-6 w-6" />}
                      title="Notification Preferences"
                      description="Choose the activity you want ChainSave to notify you about."
                    />

                    <div className="mt-8 divide-y divide-gray-100">
                      <PreferenceSwitch
                        title="Contribution updates"
                        description="Receive alerts when contributions are completed or missed."
                        checked={notifications.contributions}
                        onChange={(checked) =>
                          setNotifications({
                            ...notifications,
                            contributions: checked,
                          })
                        }
                      />

                      <PreferenceSwitch
                        title="Payout updates"
                        description="Receive alerts when circle payouts are processed."
                        checked={notifications.payouts}
                        onChange={(checked) =>
                          setNotifications({
                            ...notifications,
                            payouts: checked,
                          })
                        }
                      />

                      <PreferenceSwitch
                        title="Circle invitations"
                        description="Receive alerts when someone invites you to a savings circle."
                        checked={notifications.invitations}
                        onChange={(checked) =>
                          setNotifications({
                            ...notifications,
                            invitations: checked,
                          })
                        }
                      />

                      <PreferenceSwitch
                        title="Circle activity"
                        description="Receive updates about members, rounds and circle changes."
                        checked={notifications.circles}
                        onChange={(checked) =>
                          setNotifications({
                            ...notifications,
                            circles: checked,
                          })
                        }
                      />

                      <PreferenceSwitch
                        title="Wallet activity"
                        description="Receive alerts for deposits, withdrawals and balance changes."
                        checked={notifications.wallet}
                        onChange={(checked) =>
                          setNotifications({
                            ...notifications,
                            wallet: checked,
                          })
                        }
                      />

                      <PreferenceSwitch
                        title="Product news"
                        description="Receive occasional updates about new ChainSave features."
                        checked={notifications.marketing}
                        onChange={(checked) =>
                          setNotifications({
                            ...notifications,
                            marketing: checked,
                          })
                        }
                      />
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        type="button"
                        onClick={saveNotifications}
                        className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
                      >
                        <Save className="h-5 w-5" />
                        Save Preferences
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "payments" && (
                  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
                    <SectionHeader
                      icon={<Wallet className="h-6 w-6" />}
                      title="Payment Preferences"
                      description="Choose your default currency and payment experience."
                    />

                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                      <Field label="Default currency">
                        <select
                          value={payments.defaultCurrency}
                          onChange={(event) =>
                            setPayments({
                              ...payments,
                              defaultCurrency:
                                event.target.value,
                            })
                          }
                          className="settings-input"
                        >
                          <option value="GHS">
                            Ghanaian Cedi — GHS
                          </option>

                          <option value="NGN">
                            Nigerian Naira — NGN
                          </option>

                          <option value="KES">
                            Kenyan Shilling — KES
                          </option>

                          <option value="RBTC">
                            Rootstock Bitcoin — RBTC
                          </option>
                        </select>
                      </Field>

                      <Field label="Default payment method">
                        <select
                          value={
                            payments.defaultPaymentMethod
                          }
                          onChange={(event) =>
                            setPayments({
                              ...payments,
                              defaultPaymentMethod:
                                event.target.value,
                            })
                          }
                          className="settings-input"
                        >
                          <option value="wallet">
                            ChainSave Wallet
                          </option>

                          <option value="paystack">
                            Paystack
                          </option>

                          <option value="rbtc">
                            Rootstock Wallet
                          </option>
                        </select>
                      </Field>
                    </div>

                    <div className="mt-8 rounded-2xl border border-gray-200 px-5">
                      <PreferenceSwitch
                        title="Confirm payments"
                        description="Ask for confirmation before contributions, withdrawals and transfers."
                        checked={payments.confirmPayments}
                        onChange={(checked) =>
                          setPayments({
                            ...payments,
                            confirmPayments: checked,
                          })
                        }
                      />
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        type="button"
                        onClick={savePaymentPreferences}
                        className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
                      >
                        <Save className="h-5 w-5" />
                        Save Payment Settings
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "appearance" && (
                  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
                    <SectionHeader
                      icon={<Sun className="h-6 w-6" />}
                      title="Appearance"
                      description="Choose how ChainSave should look on this device."
                    />

                    <div className="mt-8 grid gap-5 md:grid-cols-3">
                      <AppearanceCard
                        title="Light"
                        description="Bright and clean"
                        icon={<Sun className="h-7 w-7" />}
                        active={appearance === "light"}
                        onClick={() => saveAppearance("light")}
                      />

                      <AppearanceCard
                        title="Dark"
                        description="Comfortable at night"
                        icon={<Moon className="h-7 w-7" />}
                        active={appearance === "dark"}
                        onClick={() => saveAppearance("dark")}
                      />

                      <AppearanceCard
                        title="System"
                        description="Use device preference"
                        icon={
                          <ShieldCheck className="h-7 w-7" />
                        }
                        active={appearance === "system"}
                        onClick={() => saveAppearance("system")}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <style jsx global>{`
        .settings-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(209 213 219);
          padding: 0.8rem 1rem;
          color: rgb(17 24 39);
          outline: none;
          transition: 0.2s ease;
        }

        .settings-input:focus {
          border-color: rgb(22 163 74);
          box-shadow: 0 0 0 3px rgb(220 252 231);
        }
      `}</style>
    </main>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
        {icon}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {title}
        </h2>

        <p className="mt-1 text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </span>

      {children}
    </label>
  );
}

function SaveButton({
  saving,
  children,
}: {
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {saving ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Save className="h-5 w-5" />
      )}

      {saving ? "Saving..." : children}
    </button>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="settings-input pr-12"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
        >
          {visible ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>
    </Field>
  );
}

function PreferenceSwitch({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 py-5">
      <div>
        <p className="font-semibold text-gray-900">{title}</p>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-green-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function AppearanceCard({
  title,
  description,
  icon,
  active,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-6 text-left transition ${
        active
          ? "border-green-600 bg-green-50 ring-2 ring-green-100"
          : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
      }`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
          active
            ? "bg-green-600 text-white"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        {icon}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-900">{title}</p>

          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        </div>

        {active && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white">
            <Check className="h-4 w-4" />
          </div>
        )}
      </div>
    </button>
  );
}