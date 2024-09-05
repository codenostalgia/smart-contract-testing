const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ForsageProxy Contract Test Cases ", () => {
  let ForsageProxy, owner, account1, account2, account3, account4, account5;

  beforeEach(async () => {
    ForsageProxy = await ethers.getContractFactory("ForsageProxy");
    [owner, account1, account2, account3, account4, account5] =
      await ethers.getSigners();
    ForsageProxy = await ForsageProxy.deploy();
    await ForsageProxy.deployed();
  });

  it("FP001", async () => {
    let SmartMatrixForsage = await ethers.getContractFactory(
      "SmartMatrixForsage"
    );
    [owner, account1, account2, account3, account4, account5] =
      await ethers.getSigners();
    SmartMatrixForsage = await SmartMatrixForsage.deploy();
    await SmartMatrixForsage.deployed();
    await ForsageProxy.setImplementation(SmartMatrixForsage.address);
    expect(await ForsageProxy.implAddress()).to.equal(
      SmartMatrixForsage.address
    );
  });

  it("FP002", async () => {
    await expect(
      ForsageProxy.connect(account2).setImplementation(account1.address)
    ).to.revertedWith("Ownable: caller is not the owner");
  });

  it("FP003", async () => {
    await expect(
      ForsageProxy.setImplementation(ethers.constants.AddressZero)
    ).to.revertedWith("Implementation cannot be zero address");
  });

  // skipped testing of delegate calls
  ////////////////////////

  it("FP007", async () => {
    await ForsageProxy.transferOwnership(account1.address);
    expect(await ForsageProxy.contractOwner()).to.equal(account1.address);
  });

  it("FP008", async () => {
    await expect(
      ForsageProxy.connect(account2).transferOwnership(account1.address)
    ).to.revertedWith("Ownable: caller is not the owner");
  });

  it("FP009", async () => {
    await ForsageProxy.renounceOwnership();
    expect(await ForsageProxy.contractOwner()).to.equal(
      ethers.constants.AddressZero
    );
  });
});
