// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./TripToken.sol";

/**
 * @title CarbonOffsetRegistry
 * @dev On-chain registry for retiring $TRIP tokens and minting immutable CO2 offset certificates.
 */
contract CarbonOffsetRegistry is Ownable {
    TripToken public immutable tripToken;

    struct OffsetCertificate {
        uint256 id;
        address offsetter;
        uint256 tokensBurned;
        uint256 co2OffsetGrams; // Stored in grams for integer precision (1 kg = 1,000 g)
        string projectCategory; // e.g. "Reforestation", "Solar Mobility", "Clean Transit"
        string memo;
        uint256 timestamp;
    }

    uint256 private _certificateCounter;
    mapping(uint256 => OffsetCertificate) public certificates;
    mapping(address => uint256[]) private _userCertificates;
    
    uint256 public totalCo2RetiredGrams;
    uint256 public totalTokensBurned;

    event CertificateIssued(
        uint256 indexed certificateId,
        address indexed offsetter,
        uint256 tokensBurned,
        uint256 co2OffsetGrams,
        string projectCategory,
        uint256 timestamp
    );

    constructor(address _tripTokenAddress, address initialOwner) Ownable(initialOwner) {
        require(_tripTokenAddress != address(0), "Invalid token address");
        tripToken = TripToken(_tripTokenAddress);
    }

    /**
     * @notice Retire $TRIP tokens to offset carbon emissions and receive an on-chain certificate.
     * @dev User must approve this contract to spend `tokensToBurn` before calling.
     * @param tokensToBurn Amount of $TRIP (18 decimals) to retire
     * @param co2OffsetGrams Amount of CO2 in grams being retired
     * @param projectCategory Category of climate impact
     * @param memo Custom note or dedication
     */
    function retireAndOffset(
        uint256 tokensToBurn,
        uint256 co2OffsetGrams,
        string calldata projectCategory,
        string calldata memo
    ) external returns (uint256) {
        require(tokensToBurn > 0, "CarbonOffset: Must burn > 0 tokens");
        require(co2OffsetGrams > 0, "CarbonOffset: Offset must be > 0 grams");

        // Transfer tokens from user to this contract
        bool success = tripToken.transferFrom(msg.sender, address(this), tokensToBurn);
        require(success, "CarbonOffset: Token transfer failed");

        // Burn the transferred tokens
        tripToken.burn(tokensToBurn);

        _certificateCounter++;
        uint256 certId = _certificateCounter;

        certificates[certId] = OffsetCertificate({
            id: certId,
            offsetter: msg.sender,
            tokensBurned: tokensToBurn,
            co2OffsetGrams: co2OffsetGrams,
            projectCategory: projectCategory,
            memo: memo,
            timestamp: block.timestamp
        });

        _userCertificates[msg.sender].push(certId);
        totalCo2RetiredGrams += co2OffsetGrams;
        totalTokensBurned += tokensToBurn;

        emit CertificateIssued(
            certId,
            msg.sender,
            tokensToBurn,
            co2OffsetGrams,
            projectCategory,
            block.timestamp
        );

        return certId;
    }

    /**
     * @notice Get all certificate IDs issued to a specific user.
     */
    function getUserCertificates(address user) external view returns (uint256[] memory) {
        return _userCertificates[user];
    }

    /**
     * @notice Total number of certificates issued.
     */
    function totalCertificates() external view returns (uint256) {
        return _certificateCounter;
    }
}
