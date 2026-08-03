// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import "./SavingsCircle.sol";
import "./Treasury.sol";

contract SavingsFactory is Ownable {
    Treasury public immutable treasury;

    address[] public deployedCircles;

    mapping(bytes32 circleId => address circleAddress)
        public circleById;

    event CircleCreated(
        bytes32 indexed circleId,
        address indexed circleAddress,
        address indexed owner,
        uint256 contributionAmount,
        uint256 maxMembers
    );

    error ZeroAddress();
    error CircleAlreadyExists();

    constructor(
        address treasuryAddress,
        address initialOwner
    ) Ownable(initialOwner) {
        if (
            treasuryAddress == address(0) ||
            initialOwner == address(0)
        ) {
            revert ZeroAddress();
        }

        treasury = Treasury(treasuryAddress);
    }

    function createCircle(
        bytes32 circleId,
        uint256 contributionAmount,
        uint256 maxMembers
    ) external returns (address circleAddress) {
        if (circleById[circleId] != address(0)) {
            revert CircleAlreadyExists();
        }

        SavingsCircle circle = new SavingsCircle(
            circleId,
            contributionAmount,
            maxMembers,
            msg.sender,
            address(treasury)
        );

        circleAddress = address(circle);

        circleById[circleId] = circleAddress;
        deployedCircles.push(circleAddress);

        treasury.registerCircle(
            circleId,
            circleAddress
        );

        emit CircleCreated(
            circleId,
            circleAddress,
            msg.sender,
            contributionAmount,
            maxMembers
        );
    }

    function totalCircles()
        external
        view
        returns (uint256)
    {
        return deployedCircles.length;
    }

    function getDeployedCircles()
        external
        view
        returns (address[] memory)
    {
        return deployedCircles;
    }
}