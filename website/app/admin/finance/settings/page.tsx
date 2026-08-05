"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type FeeType =
  | "percentage"
  | "fixed";

type DepositFeeMode =
  | "platform_absorbs"
  | "user_pays";

type FinanceSettings = {
  id: string;
  currency: string;

  platform_fee_type: FeeType;
  platform_fee_value: number;
  minimum_platform_fee: number;

  contribution_fee_type: FeeType;
  contribution_fee_value: number;
  minimum_contribution_fee: number;
  maximum_contribution_fee: number;

  withdrawal_fee_type: FeeType;
  withdrawal_fee_value: number;
  minimum_withdrawal_fee: number;
  maximum_withdrawal_fee: number;

  maximum_user_network_fee: number;
  gas_fee_buffer_percentage: number;

  deposit_fee_mode: DepositFeeMode;
  payouts_are_free: boolean;
  is_active: boolean;
};

export default function FinanceSettingsPage() {
  const [settings, setSettings] =
    useState<FinanceSettings | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const loadSettings =
    useCallback(async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { session },
          error: sessionError,
        } =
          await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session?.access_token) {
          throw new Error(
            "Your admin session has expired."
          );
        }

        const response = await fetch(
          "/api/admin/finance/settings",
          {
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
            cache: "no-store",
          }
        );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.error ??
              "Unable to load finance settings."
          );
        }

        setSettings({
          ...result.settings,

          platform_fee_value: Number(
            result.settings
              .platform_fee_value
          ),

          minimum_platform_fee: Number(
            result.settings
              .minimum_platform_fee
          ),

          contribution_fee_value: Number(
            result.settings
              .contribution_fee_value
          ),

          minimum_contribution_fee:
            Number(
              result.settings
                .minimum_contribution_fee
            ),

          maximum_contribution_fee:
            Number(
              result.settings
                .maximum_contribution_fee
            ),

          withdrawal_fee_value: Number(
            result.settings
              .withdrawal_fee_value
          ),

          minimum_withdrawal_fee:
            Number(
              result.settings
                .minimum_withdrawal_fee
            ),

          maximum_withdrawal_fee:
            Number(
              result.settings
                .maximum_withdrawal_fee
            ),

          maximum_user_network_fee:
            Number(
              result.settings
                .maximum_user_network_fee
            ),

          gas_fee_buffer_percentage:
            Number(
              result.settings
                .gas_fee_buffer_percentage
            ),
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load finance settings."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  function updateSetting<
    Key extends keyof FinanceSettings,
  >(
    key: Key,
    value: FinanceSettings[Key]
  ) {
    setSettings((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [key]: value,
      };
    });

    setMessage("");
    setErrorMessage("");
  }

  async function saveSettings() {
    if (!settings) {
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      validateSettings(settings);

      const {
        data: { session },
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.access_token) {
        throw new Error(
          "Your admin session has expired."
        );
      }

      const response = await fetch(
        "/api/admin/finance/settings",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${session.access_token}`,
          },

          body: JSON.stringify({
            id: settings.id,

            platform_fee_type:
              settings.platform_fee_type,

            platform_fee_value:
              settings.platform_fee_value,

            minimum_platform_fee:
              settings.minimum_platform_fee,

            contribution_fee_type:
              settings.contribution_fee_type,

            contribution_fee_value:
              settings.contribution_fee_value,

            minimum_contribution_fee:
              settings
                .minimum_contribution_fee,

            maximum_contribution_fee:
              settings
                .maximum_contribution_fee,

            withdrawal_fee_type:
              settings.withdrawal_fee_type,

            withdrawal_fee_value:
              settings.withdrawal_fee_value,

            minimum_withdrawal_fee:
              settings
                .minimum_withdrawal_fee,

            maximum_withdrawal_fee:
              settings
                .maximum_withdrawal_fee,

            maximum_user_network_fee:
              settings
                .maximum_user_network_fee,

            gas_fee_buffer_percentage:
              settings
                .gas_fee_buffer_percentage,

            deposit_fee_mode:
              settings.deposit_fee_mode,

            payouts_are_free:
              settings.payouts_are_free,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ??
            "Unable to save finance settings."
        );
      }

      setSettings({
        ...result.settings,

        platform_fee_value: Number(
          result.settings
            .platform_fee_value
        ),

        minimum_platform_fee: Number(
          result.settings
            .minimum_platform_fee
        ),

        contribution_fee_value: Number(
          result.settings
            .contribution_fee_value
        ),

        minimum_contribution_fee:
          Number(
            result.settings
              .minimum_contribution_fee
          ),

        maximum_contribution_fee:
          Number(
            result.settings
              .maximum_contribution_fee
          ),

        withdrawal_fee_value: Number(
          result.settings
            .withdrawal_fee_value
        ),

        minimum_withdrawal_fee:
          Number(
            result.settings
              .minimum_withdrawal_fee
          ),

        maximum_withdrawal_fee:
          Number(
            result.settings
              .maximum_withdrawal_fee
          ),

        maximum_user_network_fee:
          Number(
            result.settings
              .maximum_user_network_fee
          ),

        gas_fee_buffer_percentage:
          Number(
            result.settings
              .gas_fee_buffer_percentage
          ),
      });

      setMessage(
        "Finance settings saved successfully."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save finance settings."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-600">
          Loading finance settings...
        </p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8">
        <p className="rounded-xl bg-red-50 px-4 py-3 font-medium text-red-700">
          {errorMessage ||
            "Finance settings could not be loaded."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
            Finance
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Finance Settings
          </h1>

          <p className="mt-2 text-gray-600">
            Control ChainSave fees and
            platform payment policies.
          </p>
        </div>

        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "Saving..."
            : "Save Settings"}
        </button>
      </div>

      {message && (
        <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 font-medium text-green-700">
          {message}
        </p>
      )}

      {errorMessage && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
          {errorMessage}
        </p>
      )}

      <SettingsCard
        title="Circle Creation Fees"
        description="Fees charged when a new savings circle is created."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <SelectField
            label="Fee Type"
            value={
              settings.platform_fee_type
            }
            onChange={(value) =>
              updateSetting(
                "platform_fee_type",
                value as FeeType
              )
            }
          />

          <NumberField
            label={
              settings.platform_fee_type ===
              "percentage"
                ? "Fee Value (%)"
                : `Fee Value (${settings.currency})`
            }
            value={
              settings.platform_fee_value
            }
            onChange={(value) =>
              updateSetting(
                "platform_fee_value",
                value
              )
            }
          />

          <NumberField
            label={`Minimum Fee (${settings.currency})`}
            value={
              settings.minimum_platform_fee
            }
            onChange={(value) =>
              updateSetting(
                "minimum_platform_fee",
                value
              )
            }
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Contribution Fees"
        description="Service fees charged whenever a member contributes."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SelectField
            label="Fee Type"
            value={
              settings
                .contribution_fee_type
            }
            onChange={(value) =>
              updateSetting(
                "contribution_fee_type",
                value as FeeType
              )
            }
          />

          <NumberField
            label={
              settings
                .contribution_fee_type ===
              "percentage"
                ? "Fee Value (%)"
                : `Fee Value (${settings.currency})`
            }
            value={
              settings
                .contribution_fee_value
            }
            onChange={(value) =>
              updateSetting(
                "contribution_fee_value",
                value
              )
            }
          />

          <NumberField
            label={`Minimum Fee (${settings.currency})`}
            value={
              settings
                .minimum_contribution_fee
            }
            onChange={(value) =>
              updateSetting(
                "minimum_contribution_fee",
                value
              )
            }
          />

          <NumberField
            label={`Maximum Fee (${settings.currency})`}
            value={
              settings
                .maximum_contribution_fee
            }
            onChange={(value) =>
              updateSetting(
                "maximum_contribution_fee",
                value
              )
            }
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Withdrawal Fees"
        description="Fees charged when users withdraw funds."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SelectField
            label="Fee Type"
            value={
              settings.withdrawal_fee_type
            }
            onChange={(value) =>
              updateSetting(
                "withdrawal_fee_type",
                value as FeeType
              )
            }
          />

          <NumberField
            label={
              settings
                .withdrawal_fee_type ===
              "percentage"
                ? "Fee Value (%)"
                : `Fee Value (${settings.currency})`
            }
            value={
              settings.withdrawal_fee_value
            }
            onChange={(value) =>
              updateSetting(
                "withdrawal_fee_value",
                value
              )
            }
          />

          <NumberField
            label={`Minimum Fee (${settings.currency})`}
            value={
              settings
                .minimum_withdrawal_fee
            }
            onChange={(value) =>
              updateSetting(
                "minimum_withdrawal_fee",
                value
              )
            }
          />

          <NumberField
            label={`Maximum Fee (${settings.currency})`}
            value={
              settings
                .maximum_withdrawal_fee
            }
            onChange={(value) =>
              updateSetting(
                "maximum_withdrawal_fee",
                value
              )
            }
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Network and Payment Policies"
        description="Control network subsidies, deposits, and payouts."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <NumberField
            label={`Maximum User Network Fee (${settings.currency})`}
            value={
              settings
                .maximum_user_network_fee
            }
            onChange={(value) =>
              updateSetting(
                "maximum_user_network_fee",
                value
              )
            }
          />

          <NumberField
            label="Gas Buffer (%)"
            value={
              settings
                .gas_fee_buffer_percentage
            }
            onChange={(value) =>
              updateSetting(
                "gas_fee_buffer_percentage",
                value
              )
            }
          />

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Deposit Processor Fee
            </label>

            <select
              value={
                settings.deposit_fee_mode
              }
              onChange={(event) =>
                updateSetting(
                  "deposit_fee_mode",
                  event.target
                    .value as DepositFeeMode
                )
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
            >
              <option value="platform_absorbs">
                ChainSave absorbs fee
              </option>

              <option value="user_pays">
                User pays fee
              </option>
            </select>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
            <div>
              <p className="font-semibold text-gray-900">
                Free payouts
              </p>

              <p className="mt-1 text-sm text-gray-500">
                ChainSave will not charge a
                payout service fee.
              </p>
            </div>

            <input
              type="checkbox"
              checked={
                settings.payouts_are_free
              }
              onChange={(event) =>
                updateSetting(
                  "payouts_are_free",
                  event.target.checked
                )
              }
              className="h-5 w-5 accent-green-700"
            />
          </label>
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="rounded-xl bg-green-700 px-8 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "Saving Settings..."
            : "Save Finance Settings"}
        </button>
      </div>
    </div>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">
        {title}
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        {description}
      </p>

      <div className="mt-6">
        {children}
      </div>
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) =>
          onChange(
            Number(event.target.value)
          )
        }
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: FeeType;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
      >
        <option value="percentage">
          Percentage
        </option>

        <option value="fixed">
          Fixed amount
        </option>
      </select>
    </div>
  );
}

function validateSettings(
  settings: FinanceSettings
) {
  const numericValues = [
    settings.platform_fee_value,
    settings.minimum_platform_fee,

    settings.contribution_fee_value,
    settings.minimum_contribution_fee,
    settings.maximum_contribution_fee,

    settings.withdrawal_fee_value,
    settings.minimum_withdrawal_fee,
    settings.maximum_withdrawal_fee,

    settings.maximum_user_network_fee,
    settings.gas_fee_buffer_percentage,
  ];

  if (
    numericValues.some(
      (value) =>
        !Number.isFinite(value) ||
        value < 0
    )
  ) {
    throw new Error(
      "Finance settings cannot contain negative or invalid values."
    );
  }

  if (
    settings
      .minimum_contribution_fee >
    settings
      .maximum_contribution_fee
  ) {
    throw new Error(
      "The minimum contribution fee cannot exceed the maximum contribution fee."
    );
  }

  if (
    settings.minimum_withdrawal_fee >
    settings.maximum_withdrawal_fee
  ) {
    throw new Error(
      "The minimum withdrawal fee cannot exceed the maximum withdrawal fee."
    );
  }
}