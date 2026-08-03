export const ROOTSTOCK_TESTNET_CHAIN_ID = 31;

const treasuryAddress =
  process.env.NEXT_PUBLIC_TREASURY_ADDRESS;

const savingsFactoryAddress =
  process.env.NEXT_PUBLIC_SAVINGS_FACTORY_ADDRESS;

if (!treasuryAddress) {
  throw new Error(
    "NEXT_PUBLIC_TREASURY_ADDRESS is missing from .env.local"
  );
}

if (!savingsFactoryAddress) {
  throw new Error(
    "NEXT_PUBLIC_SAVINGS_FACTORY_ADDRESS is missing from .env.local"
  );
}

export const TREASURY_ADDRESS =
  treasuryAddress as `0x${string}`;

export const SAVINGS_FACTORY_ADDRESS =
  savingsFactoryAddress as `0x${string}`;

export const SAVINGS_FACTORY_ABI = [
  {
    type: "function",
    name: "createCircle",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "circleId",
        type: "bytes32",
      },
      {
        name: "contributionAmount",
        type: "uint256",
      },
      {
        name: "maxMembers",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "circleAddress",
        type: "address",
      },
    ],
  },
  {
    type: "function",
    name: "circleById",
    stateMutability: "view",
    inputs: [
      {
        name: "circleId",
        type: "bytes32",
      },
    ],
    outputs: [
      {
        name: "circleAddress",
        type: "address",
      },
    ],
  },
  {
    type: "function",
    name: "totalCircles",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "event",
    name: "CircleCreated",
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "circleId",
        type: "bytes32",
      },
      {
        indexed: true,
        name: "circleAddress",
        type: "address",
      },
      {
        indexed: true,
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        name: "contributionAmount",
        type: "uint256",
      },
      {
        indexed: false,
        name: "maxMembers",
        type: "uint256",
      },
    ],
  },
] as const;

export const TREASURY_ABI = [
  {
    type: "function",
    name: "getCircleBalance",
    stateMutability: "view",
    inputs: [
      {
        name: "circleId",
        type: "bytes32",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "circleControllers",
    stateMutability: "view",
    inputs: [
      {
        name: "circleId",
        type: "bytes32",
      },
    ],
    outputs: [
      {
        name: "controller",
        type: "address",
      },
    ],
  },
] as const;
export const SAVINGS_CIRCLE_ABI = [
  {
    type: "function",
    name: "addMember",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "memberWallet",
        type: "address",
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "contribute",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "startCircle",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "circleId",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
      },
    ],
  },
  {
    type: "function",
    name: "contributionAmount",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "status",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
      },
    ],
  },
  {
    type: "function",
    name: "memberCount",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
] as const;