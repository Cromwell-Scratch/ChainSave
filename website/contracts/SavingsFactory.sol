// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {SavingsCircle} from "./SavingsCircle.sol";
import {Treasury} from "./Treasury.sol";

contract SavingsFactory is Ownable {
    Treasury public immutable treasury;

    address[] private deployedCircles;

    mapping(bytes32 circleId => address circleAddress)
        public circleById;

    event CircleCreated(
        bytes32 indexed circleId,
        address indexed circleAddress,
        address indexed circleOwner,
        address transactionSender,
        uint256 contributionAmount,
        uint256 maxMembers,
        bool sponsored
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

    /**
     * @notice Normal wallet-paid creation.
     * @dev The caller pays gas and becomes the circle owner.
     */
    function createCircle(
        bytes32 circleId,
        uint256 contributionAmount,
        uint256 maxMembers
    ) external returns (address circleAddress) {
        return _createCircle(
            circleId,
            contributionAmount,
            maxMembers,
            msg.sender,
            false
        );
    }

    /**
     * @notice Platform-sponsored circle creation.
     * @dev Only the ChainSave platform relayer/owner can call
     * this function. The supplied user becomes circle owner.
     */
    function createCircleFor(
        bytes32 circleId,
        uint256 contributionAmount,
        uint256 maxMembers,
        address circleOwner
    )
        external
        onlyOwner
        returns (address circleAddress)
    {
        if (circleOwner == address(0)) {
            revert ZeroAddress();
        }

        return _createCircle(
            circleId,
            contributionAmount,
            maxMembers,
            circleOwner,
            true
        );
    }

    function _createCircle(
        bytes32 circleId,
        uint256 contributionAmount,
        uint256 maxMembers,
        address circleOwner,
        bool sponsored
    )
        internal
        returns (address circleAddress)
    {
        if (circleById[circleId] != address(0)) {
            revert CircleAlreadyExists();
        }

        SavingsCircle circle = new SavingsCircle(
            circleId,
            contributionAmount,
            maxMembers,
            circleOwner,
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
            circleOwner,
            msg.sender,
            contributionAmount,
            maxMembers,
            sponsored
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