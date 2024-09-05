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

  it("E005", async () => {
    await expect(
      ForsageProxy.setImplementation(account1.address)
    ).to.revertedWith("Error: Provide Contract Address");
  });
});
