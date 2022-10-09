// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import {IReferenceModule} from '../../../interfaces/IReferenceModule.sol';
import {ModuleBase} from '../ModuleBase.sol';
import {FollowValidationModuleBase} from '../FollowValidationModuleBase.sol';
import {IERC721} from '@openzeppelin/contracts/token/ERC721/IERC721.sol';

/**
 * @title NBAGameReferenceModule
 * @author dobeck
 *
 * @notice A reference module that adds game info to PubID and allows users to "call it" aka choose a winner
 */
contract NBAGameReferenceModule is FollowValidationModuleBase, IReferenceModule {

    error HomeTeamIdInvalid();
    error AwayTeamIdInvalid();
    error CallItTeamIdInvalid();
    
    struct NBAGameInfo {
        uint homeTeam;
        uint awayTeam;
        uint128 gameDateTime;
    }

    NBAGameInfo game;

    mapping(uint256 => NBAGameInfo) internal _nbaGameByPubId;

    constructor(address hub) ModuleBase(hub) {}

    /**
     * @dev Set home team, away team, and UNIX datetime of game start
     */
    function initializeReferenceModule(
        uint256 profileId,
        uint256 pubId,
        bytes calldata data
    ) external override returns (bytes memory) {

        // extract and decode calldata
        uint homeTeam = uint(uint8(data[0]));
        uint awayTeam = uint(uint8(data[1]));
        uint128 gameDateTime = abi.decode(data[2:], (uint128));

        // verify that a valid team (1-30) was chosen
        if (homeTeam < 1 || homeTeam > 30) revert HomeTeamIdInvalid();
        if (awayTeam < 1 || awayTeam > 30) revert AwayTeamIdInvalid();

        // add game info to _nbaGameByPubId
        game = NBAGameInfo(homeTeam, awayTeam, gameDateTime);
        _nbaGameByPubId[pubId] = game;

        return new bytes(0);

    }

    /**
     * @notice Validates that the user is choosing a valid team when "calling game"
     */
    function processComment(
        uint256 profileId,
        uint256 profileIdPointed,
        uint256 pubIdPointed,
        bytes calldata data
    ) external view override {
        uint256 callItTeam = abi.decode(data, (uint256));

        if (callItTeam != _nbaGameByPubId[pubIdPointed].homeTeam && callItTeam != _nbaGameByPubId[pubIdPointed].awayTeam) revert CallItTeamIdInvalid();

    }

    /**
     * @notice Validates that the user is choosing a valid team when "calling game"
     */
    function processMirror(
        uint256 profileId,
        uint256 profileIdPointed,
        uint256 pubIdPointed,
        bytes calldata data
    ) external view override {
        uint256 callItTeam = abi.decode(data, (uint256));

        if (callItTeam != _nbaGameByPubId[pubIdPointed].homeTeam && callItTeam != _nbaGameByPubId[pubIdPointed].awayTeam) revert CallItTeamIdInvalid();

    }

}