// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Algoz {
    using ECDSA for bytes32;
    using ECDSA for bytes;

    //mapping(bytes32 => bool) public consumed_token;
    address public __algoz_signer;
    bool public __algoz_enabled;
    uint public __algoz_ttl;
    bool private __algoz_initialized;
    uint public __algoz_prev_token;

    function init_algoz(address _token_verifier, bool _verify_enabled, uint _proof_expiry_length) public {
        //require(_proof_expiry_length>0, "proof_expiry_length must be greater than 0");
        __algoz_signer = _token_verifier;
        __algoz_enabled = _verify_enabled; // should be true if the contract wants to use Algoz
        __algoz_ttl = _proof_expiry_length; // ideally set this value to 3
        __algoz_initialized = true;
    }

    function algoz_validate(bytes32 expiry_token
                          , bytes32 auth_token
                          , bytes calldata signature_token)
    public {
        if(!__algoz_enabled) return;
        uint signed_block_no = uint256(expiry_token);

        // verify if the token has been used in the past
        //require(!consumed_token[auth_token]); // verify if the token has been used in the past

        // require a higher block number to prevent replay attacks
        require(signed_block_no > __algoz_prev_token, 'AlgozInvalidToken');

        // expire this proof if the current blocknumber > the expiry blocknumber
        if (__algoz_ttl > 0) {
          require(SafeMath.add(signed_block_no, __algoz_ttl) <= block.number, 'AlgozExpiredError');
        }

        // check if the signature_token authenticates with algoz public key
        require(abi.encodePacked(expiry_token, auth_token)
                   .toEthSignedMessageHash()
                   .recover(signature_token) == __algoz_signer, 'AlgozSignatureError');

        //consumed_token[auth_token] = true;
        __algoz_prev_token = signed_block_no;
    }
}
