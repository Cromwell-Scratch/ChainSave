// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ITreasury {
    function deposit(
        bytes32 circleId
    ) external payable;

    function releasePayout(
        bytes32 circleId,
        address payable recipient,
        uint256 amount
    ) external;

    function getCircleBalance(
        bytes32 circleId
    ) external view returns (uint256);
}

contract SavingsCircle is Ownable, ReentrancyGuard {
    enum CircleStatus {
        Draft,
        Ready,
        Active,
        Completed,
        Cancelled
    }

    struct Member {
        address wallet;
        bool active;
        uint256 totalContributed;
        bool receivedPayout;
    }

    bytes32 public immutable circleId;
    uint256 public immutable contributionAmount;
    uint256 public immutable maxMembers;

    ITreasury public immutable treasury;

    CircleStatus public status;

    uint256 public memberCount;
    uint256 public currentRound;
    uint256 public totalContributions;
    uint256 public totalPayouts;

    mapping(address => Member) public members;

    mapping(uint256 round => mapping(address member => bool paid))
        public roundContributions;

    mapping(uint256 round => uint256 count)
        public roundContributionCount;

    address[] private memberAddresses;
    address[] private payoutOrder;

    event MemberAdded(
        address indexed member,
        uint256 memberNumber
    );

    event CircleReady(
        uint256 memberCount,
        uint256 timestamp
    );

    event CircleStarted(
        uint256 firstRound,
        address indexed firstRecipient,
        uint256 timestamp
    );

    event ContributionMade(
        uint256 indexed round,
        address indexed member,
        uint256 amount,
        uint256 memberTotal,
        uint256 roundContributionCount,
        uint256 timestamp
    );

    event PayoutCompleted(
        uint256 indexed round,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    event CircleCompleted(
        uint256 totalRounds,
        uint256 totalContributions,
        uint256 totalPayouts,
        uint256 timestamp
    );

    event CircleCancelled(
        uint256 timestamp
    );

    event CircleStatusChanged(
        CircleStatus previousStatus,
        CircleStatus newStatus,
        uint256 timestamp
    );

    error ZeroAddress();
    error InvalidContributionAmount();
    error InvalidMaximumMembers();
    error MemberAlreadyExists();
    error CircleIsFull();
    error CircleNotFull();
    error NotCircleMember();
    error IncorrectContributionAmount();
    error AlreadyContributedThisRound();
    error CircleNotActive();
    error CircleNotDraft();
    error CircleCannotBeCancelled();
    error InvalidStatusTransition();

    constructor(
        bytes32 _circleId,
        uint256 _contributionAmount,
        uint256 _maxMembers,
        address initialOwner,
        address treasuryAddress
    ) Ownable(initialOwner) {
        if (_contributionAmount == 0) {
            revert InvalidContributionAmount();
        }

        if (_maxMembers < 2) {
            revert InvalidMaximumMembers();
        }

        if (
            initialOwner == address(0) ||
            treasuryAddress == address(0)
        ) {
            revert ZeroAddress();
        }

        circleId = _circleId;
contributionAmount = _contributionAmount;
maxMembers = _maxMembers;
treasury = ITreasury(treasuryAddress);

status = CircleStatus.Draft;

// Automatically register the owner as the first member.
members[initialOwner] = Member({
    wallet: initialOwner,
    active: true,
    totalContributed: 0,
    receivedPayout: false
});

memberAddresses.push(initialOwner);

memberCount = 1;

emit MemberAdded(
    initialOwner,
    memberCount
);
    }

    function addMember(
        address memberWallet
    ) external onlyOwner {
        if (status != CircleStatus.Draft) {
            revert CircleNotDraft();
        }

        if (memberWallet == address(0)) {
            revert ZeroAddress();
        }

        if (members[memberWallet].active) {
            revert MemberAlreadyExists();
        }

        if (memberCount >= maxMembers) {
            revert CircleIsFull();
        }

        members[memberWallet] = Member({
            wallet: memberWallet,
            active: true,
            totalContributed: 0,
            receivedPayout: false
        });

        memberAddresses.push(memberWallet);
        memberCount += 1;

        emit MemberAdded(
            memberWallet,
            memberCount
        );

        if (memberCount == maxMembers) {
            _changeStatus(CircleStatus.Ready);

            emit CircleReady(
                memberCount,
                block.timestamp
            );
        }
    }

    function startCircle()
        external
        onlyOwner
    {
        if (status != CircleStatus.Ready) {
            revert InvalidStatusTransition();
        }

        if (memberCount != maxMembers) {
            revert CircleNotFull();
        }

        for (
            uint256 index = 0;
            index < memberAddresses.length;
            index++
        ) {
            payoutOrder.push(
                memberAddresses[index]
            );
        }

        currentRound = 0;

        _changeStatus(CircleStatus.Active);

        emit CircleStarted(
            currentRound,
            payoutOrder[currentRound],
            block.timestamp
        );
    }

    function contribute()
        external
        payable
        nonReentrant
    {
        if (status != CircleStatus.Active) {
            revert CircleNotActive();
        }

        Member storage member =
            members[msg.sender];

        if (!member.active) {
            revert NotCircleMember();
        }

        if (
            roundContributions[currentRound][msg.sender]
        ) {
            revert AlreadyContributedThisRound();
        }

        if (msg.value != contributionAmount) {
            revert IncorrectContributionAmount();
        }

        roundContributions[currentRound][msg.sender] = true;
        roundContributionCount[currentRound] += 1;

        member.totalContributed += msg.value;
        totalContributions += msg.value;

        treasury.deposit{value: msg.value}(
            circleId
        );

        emit ContributionMade(
            currentRound,
            msg.sender,
            msg.value,
            member.totalContributed,
            roundContributionCount[currentRound],
            block.timestamp
        );

        if (
            roundContributionCount[currentRound] ==
            memberCount
        ) {
            _completeCurrentRound();
        }
    }

    function cancelCircle()
        external
        onlyOwner
    {
        if (
            status != CircleStatus.Draft &&
            status != CircleStatus.Ready
        ) {
            revert CircleCannotBeCancelled();
        }

        _changeStatus(CircleStatus.Cancelled);

        emit CircleCancelled(
            block.timestamp
        );
    }

    function _completeCurrentRound()
        internal
    {
        address recipient =
            payoutOrder[currentRound];

        uint256 payoutAmount =
            contributionAmount * memberCount;

        members[recipient].receivedPayout = true;
        totalPayouts += payoutAmount;

        treasury.releasePayout(
            circleId,
            payable(recipient),
            payoutAmount
        );

        emit PayoutCompleted(
            currentRound,
            recipient,
            payoutAmount,
            block.timestamp
        );

        if (
            currentRound + 1 ==
            payoutOrder.length
        ) {
            _changeStatus(
                CircleStatus.Completed
            );

            emit CircleCompleted(
                payoutOrder.length,
                totalContributions,
                totalPayouts,
                block.timestamp
            );

            return;
        }

        currentRound += 1;
    }

    function _changeStatus(
        CircleStatus newStatus
    ) internal {
        CircleStatus previousStatus = status;
        status = newStatus;

        emit CircleStatusChanged(
            previousStatus,
            newStatus,
            block.timestamp
        );
    }

    function isMember(
        address memberWallet
    ) external view returns (bool) {
        return members[memberWallet].active;
    }

    function hasContributed(
        uint256 round,
        address memberWallet
    ) external view returns (bool) {
        return roundContributions[round][memberWallet];
    }

    function currentRecipient()
        external
        view
        returns (address)
    {
        if (
            status != CircleStatus.Active ||
            payoutOrder.length == 0
        ) {
            return address(0);
        }

        return payoutOrder[currentRound];
    }

    function getMembers()
        external
        view
        returns (address[] memory)
    {
        return memberAddresses;
    }

    function getPayoutOrder()
        external
        view
        returns (address[] memory)
    {
        return payoutOrder;
    }

    function getTreasuryBalance()
        external
        view
        returns (uint256)
    {
        return treasury.getCircleBalance(
            circleId
        );
    }
}