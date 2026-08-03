const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");

describe("SavingsCircle and Treasury", function () {
  async function deployFixture() {
    const [
      owner,
      member1,
      member2,
      member3,
      outsider,
    ] = await ethers.getSigners();

    const circleId = ethers.id(
      "chainsave-circle-test"
    );

    const contributionAmount =
      ethers.parseEther("0.001");

    const maxMembers = 3;

    const Treasury =
      await ethers.getContractFactory("Treasury");

    const treasury = await Treasury.deploy(
      owner.address
    );

    await treasury.waitForDeployment();

    const SavingsCircle =
      await ethers.getContractFactory(
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

    await treasury.registerCircle(
      circleId,
      await circle.getAddress()
    );

    return {
      owner,
      member1,
      member2,
      member3,
      outsider,
      circleId,
      contributionAmount,
      maxMembers,
      treasury,
      circle,
    };
  }

  async function prepareActiveCircle() {
    const setup = await loadFixture(
      deployFixture
    );

    const {
      circle,
      member1,
      member2,
      member3,
    } = setup;

    await circle.addMember(member1.address);
    await circle.addMember(member2.address);
    await circle.addMember(member3.address);

    await circle.startCircle();

    return setup;
  }

  it("starts in Draft status", async function () {
    const { circle } = await loadFixture(
      deployFixture
    );

    expect(await circle.status()).to.equal(0);
  });

  it("allows the owner to add members", async function () {
    const {
      circle,
      member1,
    } = await loadFixture(deployFixture);

    await expect(
      circle.addMember(member1.address)
    )
      .to.emit(circle, "MemberAdded")
      .withArgs(member1.address, 1);

    expect(
      await circle.isMember(member1.address)
    ).to.equal(true);

    expect(
      await circle.memberCount()
    ).to.equal(1);
  });

  it("rejects duplicate members", async function () {
    const {
      circle,
      member1,
    } = await loadFixture(deployFixture);

    await circle.addMember(member1.address);

    await expect(
      circle.addMember(member1.address)
    ).to.be.revertedWithCustomError(
      circle,
      "MemberAlreadyExists"
    );
  });

  it("rejects member additions from non-owners", async function () {
    const {
      circle,
      member1,
      outsider,
    } = await loadFixture(deployFixture);

    await expect(
      circle
        .connect(outsider)
        .addMember(member1.address)
    ).to.be.revertedWithCustomError(
      circle,
      "OwnableUnauthorizedAccount"
    );
  });

  it("automatically becomes Ready when full", async function () {
    const {
      circle,
      member1,
      member2,
      member3,
    } = await loadFixture(deployFixture);

    await circle.addMember(member1.address);
    await circle.addMember(member2.address);

    await expect(
      circle.addMember(member3.address)
    ).to.emit(circle, "CircleReady");

    expect(await circle.status()).to.equal(1);
    expect(await circle.memberCount()).to.equal(3);
  });

  it("cannot start before the circle is full", async function () {
    const {
      circle,
      member1,
    } = await loadFixture(deployFixture);

    await circle.addMember(member1.address);

    await expect(
      circle.startCircle()
    ).to.be.revertedWithCustomError(
      circle,
      "InvalidStatusTransition"
    );
  });

  it("starts successfully after becoming Ready", async function () {
    const {
      circle,
      member1,
      member2,
      member3,
    } = await loadFixture(deployFixture);

    await circle.addMember(member1.address);
    await circle.addMember(member2.address);
    await circle.addMember(member3.address);

    await expect(
      circle.startCircle()
    ).to.emit(circle, "CircleStarted");

    expect(await circle.status()).to.equal(2);
    expect(await circle.currentRound()).to.equal(0);

    expect(
      await circle.currentRecipient()
    ).to.equal(member1.address);
  });

  it("rejects contributions before activation", async function () {
    const {
      circle,
      member1,
      contributionAmount,
    } = await loadFixture(deployFixture);

    await circle.addMember(member1.address);

    await expect(
      circle.connect(member1).contribute({
        value: contributionAmount,
      })
    ).to.be.revertedWithCustomError(
      circle,
      "CircleNotActive"
    );
  });

  it("rejects contributions from non-members", async function () {
    const {
      circle,
      outsider,
      contributionAmount,
    } = await prepareActiveCircle();

    await expect(
      circle.connect(outsider).contribute({
        value: contributionAmount,
      })
    ).to.be.revertedWithCustomError(
      circle,
      "NotCircleMember"
    );
  });

  it("rejects an incorrect contribution amount", async function () {
    const {
      circle,
      member1,
    } = await prepareActiveCircle();

    await expect(
      circle.connect(member1).contribute({
        value: ethers.parseEther("0.002"),
      })
    ).to.be.revertedWithCustomError(
      circle,
      "IncorrectContributionAmount"
    );
  });

  it("rejects duplicate contributions in one round", async function () {
    const {
      circle,
      member1,
      contributionAmount,
    } = await prepareActiveCircle();

    await circle.connect(member1).contribute({
      value: contributionAmount,
    });

    await expect(
      circle.connect(member1).contribute({
        value: contributionAmount,
      })
    ).to.be.revertedWithCustomError(
      circle,
      "AlreadyContributedThisRound"
    );
  });

  it("records a valid contribution", async function () {
    const {
      circle,
      treasury,
      circleId,
      member1,
      contributionAmount,
    } = await prepareActiveCircle();

    await expect(
      circle.connect(member1).contribute({
        value: contributionAmount,
      })
    ).to.emit(circle, "ContributionMade");

    expect(
      await circle.hasContributed(
        0,
        member1.address
      )
    ).to.equal(true);

    expect(
      await treasury.getCircleBalance(circleId)
    ).to.equal(contributionAmount);
  });

  it("automatically pays the first recipient when the round is full", async function () {
    const {
      circle,
      treasury,
      circleId,
      member1,
      member2,
      member3,
      contributionAmount,
    } = await prepareActiveCircle();

    await circle.connect(member1).contribute({
      value: contributionAmount,
    });

    await circle.connect(member2).contribute({
      value: contributionAmount,
    });

    await expect(
  circle.connect(member3).contribute({
    value: contributionAmount,
  })
).to.emit(circle, "PayoutCompleted");

    expect(
      await treasury.getCircleBalance(circleId)
    ).to.equal(0);

    expect(
      await circle.currentRound()
    ).to.equal(1);

    expect(
      await circle.currentRecipient()
    ).to.equal(member2.address);

    const memberData =
      await circle.members(member1.address);

    expect(memberData.receivedPayout).to.equal(
      true
    );
  });

  it("completes the circle after the final payout", async function () {
    const {
      circle,
      member1,
      member2,
      member3,
      contributionAmount,
    } = await prepareActiveCircle();

    const members = [
      member1,
      member2,
      member3,
    ];

    for (let round = 0; round < 3; round++) {
      for (const member of members) {
        await circle
          .connect(member)
          .contribute({
            value: contributionAmount,
          });
      }
    }

    expect(await circle.status()).to.equal(3);
    expect(await circle.currentRecipient()).to.equal(
      ethers.ZeroAddress
    );

    expect(
      await circle.totalPayouts()
    ).to.equal(
      contributionAmount * 3n * 3n
    );
  });

  it("rejects contributions after completion", async function () {
    const {
      circle,
      member1,
      member2,
      member3,
      contributionAmount,
    } = await prepareActiveCircle();

    const members = [
      member1,
      member2,
      member3,
    ];

    for (let round = 0; round < 3; round++) {
      for (const member of members) {
        await circle
          .connect(member)
          .contribute({
            value: contributionAmount,
          });
      }
    }

    await expect(
      circle.connect(member1).contribute({
        value: contributionAmount,
      })
    ).to.be.revertedWithCustomError(
      circle,
      "CircleNotActive"
    );
  });

  it("allows cancellation before activation", async function () {
    const { circle } = await loadFixture(
      deployFixture
    );

    await expect(
      circle.cancelCircle()
    ).to.emit(circle, "CircleCancelled");

    expect(await circle.status()).to.equal(4);
  });

  it("rejects cancellation after activation", async function () {
    const { circle } =
      await prepareActiveCircle();

    await expect(
      circle.cancelCircle()
    ).to.be.revertedWithCustomError(
      circle,
      "CircleCannotBeCancelled"
    );
  });
});