// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SmartMatrixForsageBasic {
    address public implAddress;
    address public contractOwner;
    address public multisig;
    bool public initialized;
    mapping(address => User) public users;
    uint256 public lastUserId;
    mapping(uint256 => address) public idToAddress;
    mapping(uint256 => address) public userIds;
    bool public locked;
    uint8 public LAST_LEVEL;
    mapping(uint8 => uint256) public levelPrice;
    uint256 public BASIC_PRICE;

    struct User {
        uint256 id;
        address referrer;
        uint256 partnersCount;
        mapping(uint8 => bool) activeX3Levels;
        mapping(uint8 => bool) activeX6Levels;
        mapping(uint8 => X3) x3Matrix;
        mapping(uint8 => X6) x6Matrix;
    }

    struct X3 {
        address currentReferrer;
        address[] referrals;
        bool blocked;
        uint256 reinvestCount;
    }

    struct X6 {
        address currentReferrer;
        address[] firstLevelReferrals;
        address[] secondLevelReferrals;
        bool blocked;
        uint256 reinvestCount;
        address closedPart;
    }
}

contract SmartMatrixForsage is SmartMatrixForsageBasic {
    modifier onlyContractOwner() {
        require(
            msg.sender == contractOwner,
            "Ownable: caller is not the owner"
        );
        _;
    }

    modifier onlyUnlocked() {
        require(!locked || msg.sender == contractOwner, "onlyUnlocked");
        _;
    }

    function initialize(address _ownerAddress, address _multisig) public {
        require(!initialized, "Contract instance has already been initialized");
        initialized = true;

        User storage user = users[_ownerAddress];

        user.id = 1;
        user.referrer = address(0);
        user.partnersCount = uint256(0);
        idToAddress[1] = _ownerAddress;
        contractOwner = _ownerAddress;

        multisig = _multisig;
        lastUserId = 2;

        LAST_LEVEL = 12;
        locked = true;

        BASIC_PRICE = 5e18;
        levelPrice[1] = BASIC_PRICE;
        for (uint8 i = 2; i <= 8; i++) {
            levelPrice[i] = levelPrice[i - 1] * 2;
        }

        levelPrice[9] = 1250e18;
        levelPrice[10] = 2500e18;
        levelPrice[11] = 5000e18;
        levelPrice[12] = 9900e18;
    }

    function isUserExists(address user) public view returns (bool) {
        return (users[user].id != 0);
    }

    function changeLock() external onlyContractOwner {
        locked = !locked;
    }

    function register(
        address userAddress,
        address referrerAddress
    ) public onlyUnlocked {
        require(!isUserExists(userAddress), "user exists");
        require(isUserExists(referrerAddress), "referrer not exists");

        User storage user = users[userAddress];
        user.id = lastUserId;
        user.referrer = referrerAddress;
        user.partnersCount = 0;

        users[userAddress].referrer = referrerAddress;
        users[userAddress].activeX3Levels[1] = true;
        users[userAddress].activeX6Levels[1] = true;
        users[referrerAddress].partnersCount++;

        idToAddress[lastUserId] = userAddress;
        userIds[lastUserId] = userAddress;
        lastUserId++;
    }

    function _buyNewLevel(
        address _userAddress,
        uint8 matrix,
        uint8 level
    ) public payable onlyUnlocked {
        require(
            isUserExists(_userAddress),
            "user is not exists. Register first."
        );
        require(matrix == 1 || matrix == 2, "invalid matrix");
        require(msg.value >= levelPrice[level], "insufficient funds");
        require(level > 1 && level <= LAST_LEVEL, "invalid level");

        if (matrix == 1) {
            require(
                users[_userAddress].activeX3Levels[level - 1],
                "buy previous level first"
            );
            require(
                !users[_userAddress].activeX3Levels[level],
                "level already activated"
            );

            if (users[_userAddress].x3Matrix[level - 1].blocked) {
                users[_userAddress].x3Matrix[level - 1].blocked = false;
            }

            // address freeX3Referrer = findFreeX3Referrer(_userAddress, level);
            // users[_userAddress].x3Matrix[level].currentReferrer = freeX3Referrer;
            users[_userAddress].activeX3Levels[level] = true;
            // updateX3Referrer(_userAddress, freeX3Referrer, level);

            // emit Upgrade(_userAddress, freeX3Referrer, 1, level);
        } else {
            require(
                users[_userAddress].activeX6Levels[level - 1],
                "buy previous level first"
            );
            require(
                !users[_userAddress].activeX6Levels[level],
                "level already activated"
            );

            if (users[_userAddress].x6Matrix[level - 1].blocked) {
                users[_userAddress].x6Matrix[level - 1].blocked = false;
            }

            // address freeX6Referrer = findFreeX6Referrer(_userAddress, level);

            users[_userAddress].activeX6Levels[level] = true;
            // updateX6Referrer(_userAddress, freeX6Referrer, level);

            // emit Upgrade(_userAddress, freeX6Referrer, 2, level);
        }
    }

    // function findFreeX3Referrer(address userAddress, uint8 level) public view returns(address) {
    //     while (true) {
    //         if (users[users[userAddress].referrer].activeX3Levels[level]) {
    //             return users[userAddress].referrer;
    //         }

    //         userAddress = users[userAddress].referrer;
    //     }
    // }

    // function findFreeX6Referrer(address userAddress, uint8 level) public view returns(address) {
    //     while (true) {
    //         if (users[users[userAddress].referrer].activeX6Levels[level]) {
    //             return users[userAddress].referrer;
    //         }

    //         userAddress = users[userAddress].referrer;
    //     }
    // }

    function lockContract() public onlyContractOwner {
        locked = true;
    }

    function unlockContract() public onlyContractOwner {
        locked = false;
    }

    function transferOwnership(address _address) public onlyContractOwner {
        contractOwner = _address;
    }

    function renounceOwnership() public onlyContractOwner {
        contractOwner = address(0);
    }

    function getUserLevel(
        address useraddress
    ) public view returns (uint256 x3level, uint256 x6level) {
        x3level = 0;
        x6level = 0;

        for (uint8 i = 1; i <= LAST_LEVEL; i++) {
            if (users[useraddress].activeX3Levels[i]) {
                x3level++;
            } else {
                break;
            }
        }

        for (uint8 i = 1; i <= LAST_LEVEL; i++) {
            if (users[useraddress].activeX6Levels[i]) {
                x6level++;
            } else {
                break;
            }
        }
    }

    function getUserReferrer(
        address useraddress
    ) public view returns (address) {
        return users[useraddress].referrer;
    }

    function getUserMatrix(
        address useraddress
    ) public view returns (X3 memory x3, X6 memory x6) {
        for (uint8 i = 1; i < LAST_LEVEL; i++) {
            if (users[useraddress].activeX3Levels[i]) {
                x3 = users[useraddress].x3Matrix[i];
                break;
            }
        }

        for (uint8 i = 1; i < LAST_LEVEL; i++) {
            if (users[useraddress].activeX6Levels[i]) {
                x6 = users[useraddress].x6Matrix[i];
                break;
            }
        }
    }

    function getUserID(address useraddress) public view returns (uint256) {
        return users[useraddress].id;
    }

    function getUserWallet(uint256 id) public view returns (address) {
        return idToAddress[id];
    }
}
