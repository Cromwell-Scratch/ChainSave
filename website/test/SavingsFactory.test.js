const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SavingsFactory", function () {
  async function deployFactorySetup() {
    const [deployer, creator] = await ethers.getSigners();

    const Treasury = await ethers.getContractFactory(
      "Treasury"
    );

    const treasury = await Treasury.deploy(
      deployer.address
    );

    await treasury.waitForDeployment();

    const SavingsFactory =
      await ethers.getContractFactory(
        "SavingsFactory"
      );

    const factory = await SavingsFactory.deploy(
      await treasury.getAddress(),
      deployer.address
    );

    await factory.waitForDeployment();

    // The factory must own Treasury so it can
    // register every newly deployed circle.
    await treasury.transferOwnership(
      await factory.getAddress()
    );

    return {
      deployer,
      creator,
      treasury,
      factory,
    };
  }

  it("creates and registers a new savings circle", async function () {
    const {
      creator,
      treasury,
      factory,
    } = await deployFactorySetup();

    const circleId = ethers.id(
      "chainsave-circle-factory-1"
    );

    const contributionAmount =
      ethers.parseEther("0.001");

    const maxMembers = 5;

    await expect(
      factory.connect(creator).createCircle(
        circleId,
        contributionAmount,
        maxMembers
      )
    ).to.emit(factory, "CircleCreated");

    const circleAddress =
      await factory.circleById(circleId);

    expect(circleAddress).to.not.equal(
      ethers.ZeroAddress
    );

    expect(
      await factory.totalCircles()
    ).to.equal(1);

    expect(
      await treasury.circleControllers(circleId)
    ).to.equal(circleAddress);

    const circle =
      await ethers.getContractAt(
        "SavingsCircle",
        circleAddress
      );

    expect(
      await circle.owner()
    ).to.equal(creator.address);

    expect(
      await circle.circleId()
    ).to.equal(circleId);

    expect(
      await circle.contributionAmount()
    ).to.equal(contributionAmount);

    expect(
      await circle.maxMembers()
    ).to.equal(maxMembers);
  });

  it("rejects duplicate circle IDs", async function () {
    const {
      creator,
      factory,
    } = await deployFactorySetup();

    const circleId = ethers.id(
      "duplicate-circle"
    );

    await factory.connect(creator).createCircle(
      circleId,
      ethers.parseEther("0.001"),
      5
    );

    await expect(
      factory.connect(creator).createCircle(
        circleId,
        ethers.parseEther("0.001"),
        5
      )
    ).to.be.revertedWithCustomError(
      factory,
      "CircleAlreadyExists"
    );
  });
});