pragma solidity 0.8.10;

import {IFollowModule} from '../../../interfaces/IFollowModule.sol';
import {ModuleBase} from '../ModuleBase.sol';
import {FollowValidatorFollowModuleBase} from './FollowValidatorFollowModuleBase.sol';


/**
 * @title NBAGameFollowModule
 * @author dobeck
 *
 * @notice A follow module that allows users to choose their team when following the profile
 */
contract NBATeamFollowModule is IFollowModule, FollowValidatorFollowModuleBase {
    error TeamIDInvalid();

    mapping(uint256 => uint256) internal _nbaTeamByProfile;

    constructor(address hub) ModuleBase(hub) {}

    function initializeFollowModule(uint256 profileId, bytes calldata data)
        external
        override
        onlyHub
        returns (bytes memory)
    {
        return new bytes(0);
    }

    function processFollow(
        address follower,
        uint256 profileId,
        bytes calldata data
    ) external override {
        uint256 teamID = abi.decode(data, (uint256));
        if (teamID < 1 || teamID > 30) revert TeamIDInvalid();

        // set favorite team for profileId
        _nbaTeamByProfile[profileId] = teamID;
    }

    function followModuleTransferHook(
        uint256 profileId,
        address from,
        address to,
        uint256 followNFTTokenId
    ) external override {}
}