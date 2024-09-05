// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract Proxy {
    function _delegate(address implementation) internal {
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(
                gas(),
                implementation,
                0,
                calldatasize(),
                0,
                0
            )
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    function _implementation() internal view virtual returns (address);

    function _fallback() internal {
        _beforeFallback();
        _delegate(_implementation());
    }

    fallback() external payable {
        _fallback();
    }

    receive() external payable {
        _fallback();
    }

    function _beforeFallback() internal virtual {}
}

contract ForsageProxy is Proxy {
    address public implAddress;
    address public contractOwner;

    constructor() {
        contractOwner = msg.sender;
    }

    modifier ownerAccessOnly() {
        require(
            msg.sender == contractOwner,
            "Ownable: caller is not the owner"
        );
        _;
    }

    function _implementation() internal view override returns (address) {
        return implAddress;
    }

    function setImplementation(address _address) public ownerAccessOnly {
        require(
            _address != address(0),
            "Implementation cannot be zero address"
        );
        require(isContract(_address), "Error: Provide Contract Address");

        implAddress = _address;
    }

    function transferOwnership(address _address) public ownerAccessOnly {
        contractOwner = _address;
    }

    function renounceOwnership() public ownerAccessOnly {
        contractOwner = address(0);
    }

    function isContract(address addr) internal view returns (bool) {
        uint size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }
}
