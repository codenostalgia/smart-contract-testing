require("@nomiclabs/hardhat-waffle");
require("solidity-coverage")
module.exports = {
  solidity: "0.8.0",
  test: {
    // ... other configurations ...
    coverage: {
      reporter: "istanbul",
      dir: "./coverage",
    },
  },
};
