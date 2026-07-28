"use client";

import {
  Bell,
  Building2,
  CheckCircle2,
  CreditCard,
  Save,
  Settings,
  ShieldCheck,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Card from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";

type PlatformSettings = {
  id: string;
  platform_name: string;
  company_name: string;
  support_email: string | null;
  currency: string;
  timezone: string;
  transaction_fee: number | string;
  withdrawal_fee: number | string;
  minimum_withdrawal: number | string;
  maximum_withdrawal: number | string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  require_email_verification: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  admin_alerts: boolean;
  updated_at: string;
};

type SettingsForm = {
  platformName: string;
  companyName: string;
  supportEmail: string;
  currency: string;
  timezone: string;
  transactionFee: string;
  withdrawalFee: string;
  minimumWithdrawal: string;
  maximumWithdrawal: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  requireEmailVerification: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  adminAlerts: boolean;
};

const INITIAL_FORM: SettingsForm = {
  platformName: "ChainSave",
  companyName: "ChainSave",
  supportEmail: "",
  currency: "GHS",
  timezone: "Africa/Accra",
  transactionFee: "0",
  withdrawalFee: "0",
  minimumWithdrawal: "0",
  maximumWithdrawal: "0",
  maintenanceMode: false,
  registrationEnabled: true,
  requireEmailVerification: true,
  emailNotifications: true,
  pushNotifications: true,
  adminAlerts: true,
};

export default function AdminSettingsPage() {
  const [settingsId, setSettingsId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<SettingsForm>(INITIAL_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState<string | null>(null);

  const [hasUnsavedChanges, setHasUnsavedChanges] =
    useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select(`
          id,
          platform_name,
          company_name,
          support_email,
          currency,
          timezone,
          transaction_fee,
          withdrawal_fee,
          minimum_withdrawal,
          maximum_withdrawal,
          maintenance_mode,
          registration_enabled,
          require_email_verification,
          email_notifications,
          push_notifications,
          admin_alerts,
          updated_at
        `)
        .order("updated_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        const {
          data: createdSettings,
          error: createError,
        } = await supabase
          .from("platform_settings")
          .insert({
            platform_name:
              INITIAL_FORM.platformName,

            company_name:
              INITIAL_FORM.companyName,

            support_email: null,

            currency:
              INITIAL_FORM.currency,

            timezone:
              INITIAL_FORM.timezone,

            transaction_fee: 0,
            withdrawal_fee: 0,
            minimum_withdrawal: 0,
            maximum_withdrawal: 0,

            maintenance_mode: false,
            registration_enabled: true,
            require_email_verification: true,

            email_notifications: true,
            push_notifications: true,
            admin_alerts: true,

            updated_at:
              new Date().toISOString(),
          })
          .select(`
            id,
            platform_name,
            company_name,
            support_email,
            currency,
            timezone,
            transaction_fee,
            withdrawal_fee,
            minimum_withdrawal,
            maximum_withdrawal,
            maintenance_mode,
            registration_enabled,
            require_email_verification,
            email_notifications,
            push_notifications,
            admin_alerts,
            updated_at
          `)
          .single();

        if (createError) {
          throw createError;
        }

        populateForm(
          createdSettings as PlatformSettings
        );

        return;
      }

      populateForm(data as PlatformSettings);
    } catch (error) {
      console.error(
        "Unable to load platform settings:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load platform settings."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  function populateForm(
    settings: PlatformSettings
  ) {
    setSettingsId(settings.id);
    setLastUpdated(settings.updated_at);
    setHasUnsavedChanges(false);

    setForm({
      platformName:
        settings.platform_name || "ChainSave",

      companyName:
        settings.company_name || "ChainSave",

      supportEmail:
        settings.support_email || "",

      currency:
        settings.currency || "GHS",

      timezone:
        settings.timezone || "Africa/Accra",

      transactionFee: String(
        settings.transaction_fee ?? 0
      ),

      withdrawalFee: String(
        settings.withdrawal_fee ?? 0
      ),

      minimumWithdrawal: String(
        settings.minimum_withdrawal ?? 0
      ),

      maximumWithdrawal: String(
        settings.maximum_withdrawal ?? 0
      ),

      maintenanceMode:
        settings.maintenance_mode,

      registrationEnabled:
        settings.registration_enabled,

      requireEmailVerification:
        settings.require_email_verification,

      emailNotifications:
        settings.email_notifications,

      pushNotifications:
        settings.push_notifications,

      adminAlerts:
        settings.admin_alerts,
    });
  }

  function updateForm<
    Key extends keyof SettingsForm,
  >(
    key: Key,
    value: SettingsForm[Key]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
    setHasUnsavedChanges(true);
    setSuccessMessage("");
    setErrorMessage("");
  }

  function validateSettings() {
    if (!form.platformName.trim()) {
      return "Enter the platform name.";
    }

    if (!form.companyName.trim()) {
      return "Enter the company name.";
    }

    if (
      form.supportEmail.trim() &&
      !isValidEmail(form.supportEmail.trim())
    ) {
      return "Enter a valid support email address.";
    }

    const numericFields = [
      {
        label: "Transaction fee",
        value: form.transactionFee,
      },
      {
        label: "Withdrawal fee",
        value: form.withdrawalFee,
      },
      {
        label: "Minimum withdrawal",
        value: form.minimumWithdrawal,
      },
      {
        label: "Maximum withdrawal",
        value: form.maximumWithdrawal,
      },
    ];

    for (const field of numericFields) {
      const numericValue = Number(field.value);

      if (
        !Number.isFinite(numericValue) ||
        numericValue < 0
      ) {
        return `${field.label} must be zero or more.`;
      }
    }

    if (
      Number(form.maximumWithdrawal) > 0 &&
      Number(form.maximumWithdrawal) <
        Number(form.minimumWithdrawal)
    ) {
      return "Maximum withdrawal cannot be less than minimum withdrawal.";
    }

    return "";
  }

  async function saveSettings() {
    setSuccessMessage("");
    setErrorMessage("");

    const validationError =
      validateSettings();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!settingsId) {
      setErrorMessage(
        "The settings record could not be found."
      );

      return;
    }

    setSaving(true);

    try {
      const updatedAt = new Date().toISOString();

      const { error } = await supabase
        .from("platform_settings")
        .update({
          platform_name:
            form.platformName.trim(),

          company_name:
            form.companyName.trim(),

          support_email:
            form.supportEmail.trim() || null,

          currency: form.currency,
          timezone: form.timezone,

          transaction_fee: Number(
            form.transactionFee
          ),

          withdrawal_fee: Number(
            form.withdrawalFee
          ),

          minimum_withdrawal: Number(
            form.minimumWithdrawal
          ),

          maximum_withdrawal: Number(
            form.maximumWithdrawal
          ),

          maintenance_mode:
            form.maintenanceMode,

          registration_enabled:
            form.registrationEnabled,

          require_email_verification:
            form.requireEmailVerification,

          email_notifications:
            form.emailNotifications,

          push_notifications:
            form.pushNotifications,

          admin_alerts:
            form.adminAlerts,

          updated_at: updatedAt,
        })
        .eq("id", settingsId);

      if (error) {
        throw error;
      }

      setLastUpdated(updatedAt);
      setHasUnsavedChanges(false);

      setSuccessMessage(
        "Platform settings saved successfully."
      );
    } catch (error) {
      console.error(
        "Unable to save platform settings:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save platform settings."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="p-6 lg:p-8">
        <Card>
          <p className="text-gray-600">
            Loading platform settings...
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section className="p-6 lg:p-8">
      <div className="sticky top-0 z-30 -mx-6 border-b border-gray-200 bg-gray-100/95 px-6 py-5 backdrop-blur lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
              System
            </p>

            <h1 className="mt-2 text-4xl font-bold text-gray-950">
              Platform Settings
            </h1>

            <p className="mt-2 text-gray-600">
              Manage ChainSave configuration, payment limits and platform controls.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="text-gray-500">
                Last updated:{" "}
                <span className="font-semibold text-gray-700">
                  {formatLastUpdated(lastUpdated)}
                </span>
              </span>

              {hasUnsavedChanges ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 font-semibold text-orange-700">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  Unsaved changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 font-semibold text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  All changes saved
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={saveSettings}
            disabled={saving || !hasUnsavedChanges}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {errorMessage && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 font-medium text-green-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />

          {successMessage}
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <SettingsSection
          title="General Settings"
          description="Basic platform identity and regional configuration."
          icon={Building2}
          iconClasses="bg-blue-100 text-blue-700"
        >
          <div className="grid gap-5">
            <TextField
              label="Platform Name"
              value={form.platformName}
              onChange={(value) =>
                updateForm(
                  "platformName",
                  value
                )
              }
              placeholder="ChainSave"
            />

            <TextField
              label="Company Name"
              value={form.companyName}
              onChange={(value) =>
                updateForm(
                  "companyName",
                  value
                )
              }
              placeholder="ChainSave Ltd"
            />

            <TextField
              label="Support Email"
              value={form.supportEmail}
              onChange={(value) =>
                updateForm(
                  "supportEmail",
                  value
                )
              }
              placeholder="support@chainsave.com"
              type="email"
            />

            <div className="grid gap-5 md:grid-cols-2">
              <SelectField
                label="Default Currency"
                value={form.currency}
                onChange={(value) =>
                  updateForm(
                    "currency",
                    value
                  )
                }
                options={[
                  {
                    value: "GHS",
                    label: "GHS — Ghanaian Cedi",
                  },
                  {
                    value: "NGN",
                    label: "NGN — Nigerian Naira",
                  },
                  {
                    value: "KES",
                    label: "KES — Kenyan Shilling",
                  },
                  {
                    value: "USD",
                    label: "USD — US Dollar",
                  },
                ]}
              />

              <SelectField
                label="Time Zone"
                value={form.timezone}
                onChange={(value) =>
                  updateForm(
                    "timezone",
                    value
                  )
                }
                options={[
                  {
                    value: "Africa/Accra",
                    label: "Africa/Accra",
                  },
                  {
                    value: "Africa/Lagos",
                    label: "Africa/Lagos",
                  },
                  {
                    value: "Africa/Nairobi",
                    label: "Africa/Nairobi",
                  },
                  {
                    value: "UTC",
                    label: "UTC",
                  },
                ]}
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Payment Settings"
          description="Configure fees and withdrawal limits."
          icon={CreditCard}
          iconClasses="bg-green-100 text-green-700"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <NumberField
              label="Transaction Fee (%)"
              value={form.transactionFee}
              onChange={(value) =>
                updateForm(
                  "transactionFee",
                  value
                )
              }
              step="0.01"
            />

            <NumberField
              label="Withdrawal Fee (%)"
              value={form.withdrawalFee}
              onChange={(value) =>
                updateForm(
                  "withdrawalFee",
                  value
                )
              }
              step="0.01"
            />

            <NumberField
              label={`Minimum Withdrawal (${form.currency})`}
              value={form.minimumWithdrawal}
              onChange={(value) =>
                updateForm(
                  "minimumWithdrawal",
                  value
                )
              }
              step="0.01"
            />

            <NumberField
              label={`Maximum Withdrawal (${form.currency})`}
              value={form.maximumWithdrawal}
              onChange={(value) =>
                updateForm(
                  "maximumWithdrawal",
                  value
                )
              }
              step="0.01"
            />
          </div>

          <p className="mt-5 rounded-xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Payment-provider secret keys should be
            stored securely in environment variables,
            not in this database table.
          </p>
        </SettingsSection>

        <SettingsSection
          title="Security Controls"
          description="Control platform access and verification requirements."
          icon={ShieldCheck}
          iconClasses="bg-purple-100 text-purple-700"
        >
          <div className="space-y-4">
            <ToggleSetting
              title="Maintenance Mode"
              description="Temporarily restrict normal platform access while maintenance is underway."
              checked={form.maintenanceMode}
              onChange={(checked) =>
                updateForm(
                  "maintenanceMode",
                  checked
                )
              }
              warning
            />

            <ToggleSetting
              title="Allow New Registrations"
              description="Allow new users to create ChainSave accounts."
              checked={
                form.registrationEnabled
              }
              onChange={(checked) =>
                updateForm(
                  "registrationEnabled",
                  checked
                )
              }
            />

            <ToggleSetting
              title="Require Email Verification"
              description="Require users to verify their email before accessing protected features."
              checked={
                form.requireEmailVerification
              }
              onChange={(checked) =>
                updateForm(
                  "requireEmailVerification",
                  checked
                )
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection
          title="Notification Controls"
          description="Choose which platform communication channels are enabled."
          icon={Bell}
          iconClasses="bg-orange-100 text-orange-700"
        >
          <div className="space-y-4">
            <ToggleSetting
              title="Email Notifications"
              description="Allow ChainSave to send notification emails."
              checked={
                form.emailNotifications
              }
              onChange={(checked) =>
                updateForm(
                  "emailNotifications",
                  checked
                )
              }
            />

            <ToggleSetting
              title="Push Notifications"
              description="Allow browser and mobile push notifications."
              checked={
                form.pushNotifications
              }
              onChange={(checked) =>
                updateForm(
                  "pushNotifications",
                  checked
                )
              }
            />

            <ToggleSetting
              title="Admin Alerts"
              description="Send important operational alerts to administrators."
              checked={form.adminAlerts}
              onChange={(checked) =>
                updateForm(
                  "adminAlerts",
                  checked
                )
              }
            />
          </div>
        </SettingsSection>
      </div>

      <Card className="mt-8 border-red-200">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700">
            <Settings className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-950">
              Important
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Some settings, such as Maintenance Mode and
               Registration Control, will take effect only after
                the corresponding application logic is implemented.
                 Sensitive secrets (for example, payment provider 
                 secret keys) should remain in environment variables
                  rather than the database.
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}

type SettingsSectionProps = {
  title: string;
  description: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  iconClasses: string;
  children: React.ReactNode;
};

function SettingsSection({
  title,
  description,
  icon: Icon,
  iconClasses,
  children,
}: SettingsSectionProps) {
  return (
    <Card>
      <div className="flex items-start gap-4 border-b border-gray-200 pb-5">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClasses}`}
        >
          <Icon className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-950">
            {title}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6">
        {children}
      </div>
    </Card>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  type?: "text" | "email";
  onChange: (value: string) => void;
};

function TextField({
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}: TextFieldProps) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-green-600"
      />
    </div>
  );
}

type NumberFieldProps = {
  label: string;
  value: string;
  step?: string;
  onChange: (value: string) => void;
};

function NumberField({
  label,
  value,
  step = "1",
  onChange,
}: NumberFieldProps) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700">
        {label}
      </label>

      <input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600"
      />
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  onChange: (value: string) => void;
};

function SelectField({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

type ToggleSettingProps = {
  title: string;
  description: string;
  checked: boolean;
  warning?: boolean;
  onChange: (checked: boolean) => void;
};

function ToggleSetting({
  title,
  description,
  checked,
  warning = false,
  onChange,
}: ToggleSettingProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between gap-5 rounded-xl border p-4 text-left transition ${
        warning && checked
          ? "border-red-300 bg-red-50"
          : checked
            ? "border-green-300 bg-green-50"
            : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      <span>
        <span className="block font-bold text-gray-950">
          {title}
        </span>

        <span className="mt-1 block text-sm leading-5 text-gray-600">
          {description}
        </span>
      </span>

      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          warning && checked
            ? "bg-red-600"
            : checked
              ? "bg-green-600"
              : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

function formatLastUpdated(date: string | null) {
  if (!date) {
    return "Not saved yet";
  }

  return new Date(date).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}