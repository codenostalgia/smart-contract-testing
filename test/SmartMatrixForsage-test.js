const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SmartMatrixForsage Contract Test Cases ", () => {
  let SmartMatrixForsage,
    ForsageProxy,
    owner,
    account1,
    account2,
    account3,
    account4,
    account5;

  beforeEach(async () => {
    ForsageProxy = await ethers.getContractFactory("ForsageProxy");
    [proxyOwner] = await ethers.getSigners();
    ForsageProxy = await ForsageProxy.deploy();
    await ForsageProxy.deployed();

    SmartMatrixForsage = await ethers.getContractFactory("SmartMatrixForsage");
    [owner, account1, account2, account3, account4, account5] =
      await ethers.getSigners();
    SmartMatrixForsage = await SmartMatrixForsage.deploy();
    await SmartMatrixForsage.deployed();

    ForsageProxy.setImplementation(SmartMatrixForsage.address);
  });

  it("SMF001", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    expect(await SmartMatrixForsage.contractOwner()).to.equal(owner.address);
    expect(await SmartMatrixForsage.multisig()).to.equal(account5.address);
  });

  it("SMF002", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await expect(
      SmartMatrixForsage.initialize(owner.address, account1.address)
    ).to.revertedWith("Contract instance has already been initialized");
  });

  it("SMF003", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await SmartMatrixForsage.register(account2.address, owner.address);
    expect(await SmartMatrixForsage.idToAddress(2)).to.equal(account2.address);
    expect(await SmartMatrixForsage.getUserReferrer(account2.address)).to.equal(
      owner.address
    );
  });

  it("SMF004", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await SmartMatrixForsage.register(account2.address, owner.address);
    await expect(
      SmartMatrixForsage.register(account2.address, owner.address)
    ).to.revertedWith("user exists");
  });

  it("SMF005", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await expect(
      SmartMatrixForsage.register(account2.address, account3.address)
    ).to.revertedWith("referrer not exists");
  });

  it("SMF006", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await SmartMatrixForsage.lockContract();
    await expect(
      SmartMatrixForsage.connect(account2).register(
        account2.address,
        owner.address
      )
    ).to.revertedWith("onlyUnlocked");
  });

  it("SMF007", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await SmartMatrixForsage.register(account1.address, owner.address);
    const options = { value: ethers.utils.parseEther("11") };
    await SmartMatrixForsage._buyNewLevel(account1.address, 1, 2, options);
    const levels = await SmartMatrixForsage.getUserLevel(account1.address);
    expect(levels[0]).to.equal(2);
    const matrices = await SmartMatrixForsage.getUserMatrix(account1.address);
    expect(matrices).to.not.equal(null);
  });

  it("SMF008", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await SmartMatrixForsage.register(account1.address, owner.address);
    const options = { value: ethers.utils.parseEther("11") };
    await SmartMatrixForsage._buyNewLevel(account1.address, 2, 2, options);
    const levels = await SmartMatrixForsage.getUserLevel(account1.address);
    expect(levels[1]).to.equal(2);
    const matrices = await SmartMatrixForsage.getUserMatrix(account1.address);
    expect(matrices).to.not.equal(null);
  });

  it("SMF009", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await SmartMatrixForsage.register(account1.address, owner.address);
    const options = { value: ethers.utils.parseEther("21") };
    await expect(
      SmartMatrixForsage._buyNewLevel(account1.address, 1, 3, options)
    ).to.revertedWith("buy previous level first");
  });

  it("SMF010", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await SmartMatrixForsage.register(account1.address, owner.address);
    const options = { value: ethers.utils.parseEther("11") };
    await SmartMatrixForsage._buyNewLevel(account1.address, 1, 2, options);
    await expect(
      SmartMatrixForsage._buyNewLevel(account1.address, 1, 2, options)
    ).to.revertedWith("level already activated");
  });

  it("SMF011", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await SmartMatrixForsage.register(account1.address, owner.address);
    await expect(
      SmartMatrixForsage._buyNewLevel(account1.address, 1, 2)
    ).to.revertedWith("insufficient funds");
  });

  it("SMF012", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await SmartMatrixForsage.register(account1.address, owner.address);
    await SmartMatrixForsage.lockContract();
    const options = { value: ethers.utils.parseEther("11") };
    await expect(
      SmartMatrixForsage.connect(account3)._buyNewLevel(
        account1.address,
        1,
        2,
        options
      )
    ).to.revertedWith("onlyUnlocked");
  });

  it("SMF013", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await SmartMatrixForsage.lockContract();
    expect(await SmartMatrixForsage.locked()).to.equal(true);
  });

  it("SMF014", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await SmartMatrixForsage.unlockContract();
    expect(await SmartMatrixForsage.locked()).to.equal(false);
  });

  it("SMF015", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await SmartMatrixForsage.transferOwnership(account1.address);
    expect(await SmartMatrixForsage.contractOwner()).to.equal(account1.address);
  });

  it("SMF016", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await expect(
      SmartMatrixForsage.connect(account2).transferOwnership(account1.address)
    ).to.revertedWith("Ownable: caller is not the owner");
  });

  it("SMF017", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await SmartMatrixForsage.renounceOwnership();
    expect(await SmartMatrixForsage.contractOwner()).to.equal(
      ethers.constants.AddressZero
    );
  });

  it("SMF018", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await SmartMatrixForsage.register(account1.address, owner.address);
    const options = { value: ethers.utils.parseEther("11") };
    await SmartMatrixForsage._buyNewLevel(account1.address, 2, 2, options);
    const options2 = { value: ethers.utils.parseEther("21") };
    await SmartMatrixForsage._buyNewLevel(account1.address, 2, 3, options2);
    const levels = await SmartMatrixForsage.getUserLevel(account1.address);
    expect(levels[1]).to.equal(3);
  });

  it("SMF019", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await SmartMatrixForsage.register(account1.address, owner.address);
    const referrer = await SmartMatrixForsage.getUserReferrer(account1.address);
    expect(referrer).to.equal(owner.address);
  });

  it("SMF020", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await SmartMatrixForsage.register(account1.address, owner.address);
    const options = { value: ethers.utils.parseEther("11") };
    await SmartMatrixForsage._buyNewLevel(account1.address, 2, 2, options);
    const options2 = { value: ethers.utils.parseEther("21") };
    await SmartMatrixForsage._buyNewLevel(account1.address, 2, 3, options2);
    const matrices = await SmartMatrixForsage.getUserMatrix(account1.address);
    expect(matrices).to.not.equal(null);
  });

  it("SMF021", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await SmartMatrixForsage.register(account1.address, owner.address);
    expect(await SmartMatrixForsage.getUserID(account1.address)).to.equal(2);
  });

  it("SMF022", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await SmartMatrixForsage.register(account1.address, owner.address);
    expect(await SmartMatrixForsage.getUserWallet(2)).to.equal(
      account1.address
    );
  });

  it("SMF023", async () => {
    await SmartMatrixForsage.initialize(owner.address, account5.address);
    await SmartMatrixForsage.register(account1.address, owner.address);
    expect(await SmartMatrixForsage.isUserExists(account1.address)).to.equal(
      true
    );
    expect(await SmartMatrixForsage.isUserExists(account2.address)).to.equal(
      false
    );
  });
});
