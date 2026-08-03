// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ITreasury {
    function deposit(
        bytes32 circleId
    ) external payable;

    function getCircleBalance(
        bytes32 circleId
    ) external view returns (uint256);
}

contract SavingsCircle is Ownable, ReentrancyGuard {
    struct Member {
        address wallet;
        bool active;
        uint256 totalContributed;
    }

    bytes32 public immutable circleId;
    uint256 public immutable contributionAmount;
    uint256 public immutable maxMembers;

    ITreasury public immutable treasury;

    uint256 public memberCount;
    uint256 public totalContributions;

    mapping(address => Member) public members;
    address[] private memberAddresses;

    event MemberAdded(
        address indexed member,
        uint256 memberNumber
    );

    event ContributionMade(
        address indexed member,
        uint256 amount,
        uint256 memberTotal,
        uint256 circleTotal,
        uint256 timestamp
    );

    error ZeroAddress();
    error InvalidContributionAmount();
    error InvalidMaximumMembers();
    error MemberAlreadyExists();
    error CircleIsFull();
    error NotCircleMember();
    error IncorrectContributionAmount();

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
    }

    function addMember(
        address memberWallet
    ) external onlyOwner {
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
            totalContributed: 0
        });

        memberAddresses.push(memberWallet);
        memberCount += 1;

        emit MemberAdded(
            memberWallet,
            memberCount
        );
    }

    function contribute()
        external
        payable
        nonReentrant
    {
        Member storage member = members[msg.sender];

        if (!member.active) {
            revert NotCircleMember();
        }

        if (msg.value != contributionAmount) {
            revert IncorrectContributionAmount();
        }

        member.totalContributed += msg.value;
        totalContributions += msg.value;

        treasury.deposit{value: msg.value}(
            circleId
        );

        emit ContributionMade(
            msg.sender,
            msg.value,
            member.totalContributed,
            totalContributions,
            block.timestamp
        );
    }

    function isMember(
        address memberWallet
    ) external view returns (bool) {
        return members[memberWallet].active;
    }

    function getMembers()
        external
        view
        returns (address[] memory)
    {
        return memberAddresses;
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