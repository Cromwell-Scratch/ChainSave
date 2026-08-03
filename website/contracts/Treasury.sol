// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Treasury is Ownable, ReentrancyGuard {
    mapping(bytes32 circleId => uint256 balance)
        private circleBalances;

    mapping(bytes32 circleId => address controller)
        public circleControllers;

    uint256 public totalDeposited;
    uint256 public totalReleased;

    event CircleRegistered(
        bytes32 indexed circleId,
        address indexed controller
    );

    event DepositReceived(
        bytes32 indexed circleId,
        address indexed contributor,
        uint256 amount,
        uint256 timestamp
    );

    event PayoutReleased(
        bytes32 indexed circleId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    error ZeroAddress();
    error ZeroDeposit();
    error ZeroAmount();
    error CircleAlreadyRegistered();
    error CircleNotRegistered();
    error UnauthorizedCircle();
    error InsufficientCircleBalance();
    error TransferFailed();

    constructor(address initialOwner)
        Ownable(initialOwner)
    {}

    modifier onlyCircleController(
        bytes32 circleId
    ) {
        address controller =
            circleControllers[circleId];

        if (controller == address(0)) {
            revert CircleNotRegistered();
        }

        if (msg.sender != controller) {
            revert UnauthorizedCircle();
        }

        _;
    }

    function registerCircle(
        bytes32 circleId,
        address controller
    ) external onlyOwner {
        if (controller == address(0)) {
            revert ZeroAddress();
        }

        if (circleControllers[circleId] != address(0)) {
            revert CircleAlreadyRegistered();
        }

        circleControllers[circleId] = controller;

        emit CircleRegistered(
            circleId,
            controller
        );
    }

    function deposit(
        bytes32 circleId
    ) external payable nonReentrant {
        if (circleControllers[circleId] == address(0)) {
            revert CircleNotRegistered();
        }

        if (msg.value == 0) {
            revert ZeroDeposit();
        }

        circleBalances[circleId] += msg.value;
        totalDeposited += msg.value;

        emit DepositReceived(
            circleId,
            msg.sender,
            msg.value,
            block.timestamp
        );
    }

    function releasePayout(
        bytes32 circleId,
        address payable recipient,
        uint256 amount
    )
        external
        nonReentrant
        onlyCircleController(circleId)
    {
        if (recipient == address(0)) {
            revert ZeroAddress();
        }

        if (amount == 0) {
            revert ZeroAmount();
        }

        if (circleBalances[circleId] < amount) {
            revert InsufficientCircleBalance();
        }

        circleBalances[circleId] -= amount;
        totalReleased += amount;

        (bool success, ) = recipient.call{
            value: amount
        }("");

        if (!success) {
            revert TransferFailed();
        }

        emit PayoutReleased(
            circleId,
            recipient,
            amount,
            block.timestamp
        );
    }

    function getCircleBalance(
        bytes32 circleId
    ) external view returns (uint256) {
        return circleBalances[circleId];
    }
}