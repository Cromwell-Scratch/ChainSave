require("dotenv").config({
  path: ".env.local",
});

const { ethers } = require("hardhat");
const {
  createClient,
} = require("@supabase/supabase-js");

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_KEY;

const FACTORY_ADDRESS =
  process.env
    .NEXT_PUBLIC_SAVINGS_FACTORY_ADDRESS;

const FACTORY_ABI = [
  "function circleById(bytes32 circleId) view returns (address circleAddress)",
];

function requireEnvironment() {
  if (!SUPABASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is missing from .env.local."
    );
  }

  if (!SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing from .env.local."
    );
  }

  if (!FACTORY_ADDRESS) {
    throw new Error(
      "NEXT_PUBLIC_SAVINGS_FACTORY_ADDRESS is missing from .env.local."
    );
  }
}

async function ensureOwnerMembership({
  supabase,
  circle,
}) {
  const {
    data: existingMember,
    error: memberLookupError,
  } = await supabase
    .from("circle_members")
    .select("id")
    .eq("circle_id", circle.id)
    .eq("user_id", circle.owner_id)
    .maybeSingle();

  if (memberLookupError) {
    throw memberLookupError;
  }

  if (existingMember) {
    console.log(
      "Owner membership already exists."
    );

    return;
  }

  const {
    data: ownerResult,
    error: ownerLookupError,
  } =
    await supabase.auth.admin.getUserById(
      circle.owner_id
    );

  if (
    ownerLookupError ||
    !ownerResult.user?.email
  ) {
    throw new Error(
      `Unable to load the owner email for circle ${circle.id}.`
    );
  }

  const ownerEmail =
    ownerResult.user.email
      .trim()
      .toLowerCase();

  const {
    error: ownerInsertError,
  } = await supabase
    .from("circle_members")
    .insert({
      circle_id: circle.id,
      user_id: circle.owner_id,
      email: ownerEmail,
      role: "owner",
      status: "accepted",
      joined_at:
        new Date().toISOString(),
      invited_by: circle.owner_id,
    });

  if (ownerInsertError) {
    throw ownerInsertError;
  }

  console.log(
    "Owner membership restored."
  );
}

async function reconcilePayment({
  supabase,
  factory,
  payment,
}) {
  console.log(
    "\n--------------------------------"
  );

  console.log(
    "Payment breakdown:",
    payment.id
  );

  console.log(
    "Circle ID:",
    payment.circle_id
  );

  const {
    data: circle,
    error: circleError,
  } = await supabase
    .from("circles")
    .select(
      `
        id,
        owner_id,
        name,
        blockchain_circle_id,
        creation_tx_hash,
        contract_address,
        blockchain_status
      `
    )
    .eq("id", payment.circle_id)
    .single();

  if (circleError) {
    throw circleError;
  }

  console.log(
    "Circle:",
    circle.name
  );

  console.log(
    "Current status:",
    circle.blockchain_status
  );

  if (!circle.blockchain_circle_id) {
    throw new Error(
      "The circle is missing its blockchain_circle_id."
    );
  }

  if (!circle.creation_tx_hash) {
    throw new Error(
      "The circle is missing its creation transaction hash."
    );
  }

  console.log(
    "Transaction:",
    circle.creation_tx_hash
  );

  const receipt =
    await ethers.provider
      .getTransactionReceipt(
        circle.creation_tx_hash
      );

  if (!receipt) {
    throw new Error(
      "The Rootstock transaction receipt was not found."
    );
  }

  if (receipt.status !== 1) {
    throw new Error(
      "The Rootstock transaction was not successful."
    );
  }

  console.log(
    "Rootstock transaction confirmed."
  );

  const onchainAddress =
    await factory.circleById(
      circle.blockchain_circle_id
    );

  if (
    !onchainAddress ||
    onchainAddress ===
      ethers.ZeroAddress
  ) {
    throw new Error(
      "SavingsFactory returned a zero circle address."
    );
  }

  const normalizedContractAddress =
    ethers.getAddress(
      onchainAddress
    );

  console.log(
    "Recovered contract address:",
    normalizedContractAddress
  );

  const gasUsed =
    receipt.gasUsed ??
    BigInt(0);

  const gasPrice =
    receipt.gasPrice ??
    BigInt(0);

  const actualGasWei =
    gasUsed * gasPrice;

  const actualGasRbtc =
    Number(actualGasWei) / 1e18;

  console.log(
    "Gas used:",
    gasUsed.toString()
  );

  console.log(
    "Gas price:",
    gasPrice.toString()
  );

  console.log(
    "Actual gas RBTC:",
    actualGasRbtc
  );

  const {
    data: finalizeResult,
    error: finalizeError,
  } = await supabase.rpc(
    "finalize_circle_creation_charge",
    {
      p_payment_breakdown_id:
        payment.id,

      p_blockchain_tx_hash:
        circle.creation_tx_hash,

      p_actual_gas_rbtc:
        actualGasRbtc,
    }
  );

  if (finalizeError) {
    throw new Error(
      `Finance finalization failed: ${finalizeError.message}`
    );
  }

  console.log(
    "Finance settlement finalized:",
    finalizeResult
  );

  const {
    error: circleUpdateError,
  } = await supabase
    .from("circles")
    .update({
      contract_address:
        normalizedContractAddress,

      blockchain_status:
        "confirmed",
    })
    .eq("id", circle.id);

  if (circleUpdateError) {
    throw circleUpdateError;
  }

  console.log(
    "Circle database record updated."
  );

  try {
    await ensureOwnerMembership({
      supabase,
      circle,
    });
  } catch (membershipError) {
    await supabase
      .from("circles")
      .update({
        blockchain_status:
          "confirmed_member_sync_failed",
      })
      .eq("id", circle.id);

    throw membershipError;
  }

  console.log(
    `Successfully reconciled "${circle.name}".`
  );

  return {
    circleId: circle.id,
    contractAddress:
      normalizedContractAddress,
    transactionHash:
      circle.creation_tx_hash,
    paymentBreakdownId:
      payment.id,
  };
}

async function main() {
  requireEnvironment();

  console.log(
    "--------------------------------"
  );

  console.log(
    "ChainSave Circle Reconciliation"
  );

  console.log(
    "--------------------------------"
  );

  console.log(
    "Factory:",
    FACTORY_ADDRESS
  );

  const network =
    await ethers.provider.getNetwork();

  console.log(
    "Network chain ID:",
    network.chainId.toString()
  );

  if (network.chainId !== BigInt(31)) {
    throw new Error(
      "This script must run on Rootstock Testnet, chain ID 31."
    );
  }

  const supabase = createClient(
    SUPABASE_URL,
    SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const factory =
    new ethers.Contract(
      FACTORY_ADDRESS,
      FACTORY_ABI,
      ethers.provider
    );

  const {
    data: pendingPayments,
    error: pendingError,
  } = await supabase
    .from("payment_fee_breakdowns")
    .select(
      `
        id,
        circle_id,
        payment_status,
        total_charged,
        created_at
      `
    )
    .eq(
      "payment_type",
      "circle_creation"
    )
    .eq(
      "payment_status",
      "pending"
    )
    .order("created_at", {
      ascending: true,
    });

  if (pendingError) {
    throw pendingError;
  }

  if (!pendingPayments?.length) {
    console.log(
      "No pending circle-creation payments were found."
    );

    return;
  }

  console.log(
    `Found ${pendingPayments.length} pending circle creation(s).`
  );

  let successful = 0;
  let failed = 0;

  for (
    const payment of pendingPayments
  ) {
    try {
      await reconcilePayment({
        supabase,
        factory,
        payment,
      });

      successful += 1;
    } catch (error) {
      failed += 1;

      console.error(
        `Failed to reconcile payment ${payment.id}:`,
        error instanceof Error
          ? error.message
          : error
      );
    }
  }

  console.log(
    "\n--------------------------------"
  );

  console.log(
    "RECONCILIATION COMPLETE"
  );

  console.log(
    "--------------------------------"
  );

  console.log(
    "Successful:",
    successful
  );

  console.log(
    "Failed:",
    failed
  );

  console.log(
    "\nImportant: invited-member emails from the failed requests cannot be recovered automatically. Re-invite those users from each circle page."
  );
}

main().catch((error) => {
  console.error(
    "Reconciliation script failed:",
    error
  );

  process.exitCode = 1;
});