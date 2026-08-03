// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./SavingsCircle.sol";
import "./Treasury.sol";

contract SavingsFactory is Ownable {

    Treasury public immutable treasury;

    address[] public deployedCircles;

    event CircleCreated(
        bytes32 indexed circleId,
        address indexed circleAddress,
        address indexed owner
    );

    constructor(
        address treasuryAddress,
        address initialOwner
    ) Ownable(initialOwner) {
        treasury = Treasury(treasuryAddress);
    }

}