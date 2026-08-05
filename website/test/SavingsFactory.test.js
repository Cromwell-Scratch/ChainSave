const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SavingsFactory", function () {
  async function deployFactorySetup() {
    const [
      deployer,
      creator,
      sponsoredUser,
      outsider,
    ] = await ethers.getSigners();

    const Treasury =
      await ethers.getContractFactory(
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

    const factory =
      await SavingsFactory.deploy(
        await treasury.getAddress(),
        deployer.address
      );

    await factory.waitForDeployment();

    await treasury.transferOwnership(
      await factory.getAddress()
    );

    return {
      deployer,
      creator,
      sponsoredUser,
      outsider,
      treasury,
      factory,
    };
  }

  it("creates and registers a normal wallet-paid circle", async function () {
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

  it("allows the platform owner to sponsor circle creation for a user", async function () {
    const {
      deployer,
      sponsoredUser,
      treasury,
      factory,
    } = await deployFactorySetup();

    const circleId = ethers.id(
      "chainsave-sponsored-circle-1"
    );

    const contributionAmount =
      ethers.parseEther("0.001");

    const maxMembers = 4;

    await expect(
      factory.connect(deployer).createCircleFor(
        circleId,
        contributionAmount,
        maxMembers,
        sponsoredUser.address
      )
    ).to.emit(factory, "CircleCreated");

    const circleAddress =
      await factory.circleById(circleId);

    expect(circleAddress).to.not.equal(
      ethers.ZeroAddress
    );

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
    ).to.equal(sponsoredUser.address);

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

  it("rejects sponsored creation from a non-owner account", async function () {
    const {
      outsider,
      sponsoredUser,
      factory,
    } = await deployFactorySetup();

    const circleId = ethers.id(
      "unauthorized-sponsored-circle"
    );

    await expect(
      factory.connect(outsider).createCircleFor(
        circleId,
        ethers.parseEther("0.001"),
        3,
        sponsoredUser.address
      )
    ).to.be.revertedWithCustomError(
      factory,
      "OwnableUnauthorizedAccount"
    );
  });

  it("rejects sponsored creation for the zero address", async function () {
    const {
      deployer,
      factory,
    } = await deployFactorySetup();

    const circleId = ethers.id(
      "zero-address-sponsored-circle"
    );

    await expect(
      factory.connect(deployer).createCircleFor(
        circleId,
        ethers.parseEther("0.001"),
        3,
        ethers.ZeroAddress
      )
    ).to.be.revertedWithCustomError(
      factory,
      "ZeroAddress"
    );
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