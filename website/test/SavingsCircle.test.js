const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SavingsCircle and Treasury", function () {
  async function deployContracts() {
    const [owner, member] = await ethers.getSigners();

    const circleId = ethers.id("chainsave-circle-1");
    const contributionAmount = ethers.parseEther("0.001");
    const maxMembers = 5;

    const Treasury = await ethers.getContractFactory(
      "Treasury"
    );

    const treasury = await Treasury.deploy(owner.address);
    await treasury.waitForDeployment();

    const SavingsCircle = await ethers.getContractFactory(
      "SavingsCircle"
    );

    const circle = await SavingsCircle.deploy(
      circleId,
      contributionAmount,
      maxMembers,
      owner.address,
      await treasury.getAddress()
    );

    await circle.waitForDeployment();

    // Authorize this SavingsCircle contract to control
    // its Treasury balance.
    await treasury.registerCircle(
      circleId,
      await circle.getAddress()
    );

    return {
      owner,
      member,
      circleId,
      contributionAmount,
      treasury,
      circle,
    };
  }

  it("allows an added member to contribute tRBTC", async function () {
    const {
      member,
      circleId,
      contributionAmount,
      treasury,
      circle,
    } = await deployContracts();

    await circle.addMember(member.address);

    await expect(
  circle.connect(member).contribute({
    value: contributionAmount,
  })
).to.emit(circle, "ContributionMade");

    expect(
      await treasury.getCircleBalance(circleId)
    ).to.equal(contributionAmount);

    expect(
      await circle.totalContributions()
    ).to.equal(contributionAmount);

    const memberData = await circle.members(
      member.address
    );

    expect(memberData.totalContributed).to.equal(
      contributionAmount
    );
  });

  it("rejects contributions from non-members", async function () {
    const {
      member,
      contributionAmount,
      circle,
    } = await deployContracts();

    await expect(
      circle.connect(member).contribute({
        value: contributionAmount,
      })
    ).to.be.revertedWithCustomError(
      circle,
      "NotCircleMember"
    );
  });

  it("rejects an incorrect contribution amount", async function () {
    const {
      member,
      circle,
    } = await deployContracts();

    await circle.addMember(member.address);

    await expect(
      circle.connect(member).contribute({
        value: ethers.parseEther("0.002"),
      })
    ).to.be.revertedWithCustomError(
      circle,
      "IncorrectContributionAmount"
    );
  });
});