// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title TripBadgeNFT ($TBADGE)
 * @dev Soulbound ERC-721 NFT for Tripchain achievement badges.
 * Non-transferable tokens that prove eco-travel accomplishments on-chain.
 */
contract TripBadgeNFT is ERC721URIStorage, Ownable, EIP712 {
    using ECDSA for bytes32;

    uint256 private _nextTokenId;
    address public validatorSigner;

    // Typehash for EIP-712 structured data signing
    bytes32 public constant BADGE_MINT_TYPEHASH = keccak256(
        "BadgeVoucher(address recipient,uint256 badgeId,string uri,uint256 nonce,uint256 deadline)"
    );

    // Track used nonces per user
    mapping(address => mapping(uint256 => bool)) public usedNonces;
    
    // Mapping of user address to badgeId to prevent duplicate minting of the same badge type
    mapping(address => mapping(uint256 => bool)) public hasMintedBadge;

    event BadgeMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        uint256 indexed badgeId,
        string tokenUri
    );
    event ValidatorSignerUpdated(address indexed previousSigner, address indexed newSigner);

    constructor(
        address initialOwner,
        address _validatorSigner
    ) ERC721("Tripchain Achievement Badge", "TBADGE") Ownable(initialOwner) EIP712("TripchainBadges", "1.0") {
        require(_validatorSigner != address(0), "Invalid validator signer");
        validatorSigner = _validatorSigner;
        _nextTokenId = 1;
    }

    /**
     * @notice Set or rotate validator signer.
     */
    function setValidatorSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid signer address");
        emit ValidatorSignerUpdated(validatorSigner, _newSigner);
        validatorSigner = _newSigner;
    }

    /**
     * @notice Mint an achievement badge NFT using authorized signature from Tripchain backend.
     */
    function mintBadgeWithSignature(
        uint256 badgeId,
        string calldata uri,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external returns (uint256) {
        require(block.timestamp <= deadline, "TripBadgeNFT: Voucher expired");
        require(!usedNonces[msg.sender][nonce], "TripBadgeNFT: Nonce already used");
        require(!hasMintedBadge[msg.sender][badgeId], "TripBadgeNFT: Badge already minted by recipient");

        // Hash typed struct data
        bytes32 structHash = keccak256(
            abi.encode(
                BADGE_MINT_TYPEHASH,
                msg.sender,
                badgeId,
                keccak256(bytes(uri)),
                nonce,
                deadline
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);
        require(signer == validatorSigner, "TripBadgeNFT: Invalid validator signature");

        usedNonces[msg.sender][nonce] = true;
        hasMintedBadge[msg.sender][badgeId] = true;

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        emit BadgeMinted(msg.sender, tokenId, badgeId, uri);
        return tokenId;
    }

    /**
     * @dev Enforce Soulbound mechanics (non-transferable).
     * Disallows transfers between addresses. Allows minting (from == 0) and burning (to == 0).
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("TripBadgeNFT: Badges are Soulbound and non-transferable");
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Total minted badges counter.
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}
