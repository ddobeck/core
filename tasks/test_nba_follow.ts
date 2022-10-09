import { defaultAbiCoder } from 'ethers/lib/utils';
import { task } from 'hardhat/config';
import {
  FollowNFT__factory,
  LensHub__factory,
  NBATeamFollowModule__factory,
} from '../typechain-types';
import { CreateProfileDataStruct } from '../typechain-types/LensHub';
import {
  waitForTx,
  initEnv,
  getAddrs,
  ProtocolState,
  ZERO_ADDRESS,
  deployContract,
} from './helpers/utils';

task('test-nba-follow', 'tests the NBATeamFollowModule').setAction(async ({}, hre) => {
    const [governance, , user] = await initEnv(hre);
    const addrs = getAddrs();
    const lensHub = LensHub__factory.connect(addrs['lensHub proxy'], governance);
  
    await waitForTx(lensHub.setState(ProtocolState.Unpaused));
    await waitForTx(lensHub.whitelistProfileCreator(user.address, true));
  
    const inputStruct: CreateProfileDataStruct = {
      to: user.address,
      handle: 'farquad2',
      imageURI:
        'https://ipfs.fleek.co/ipfs/ghostplantghostplantghostplantghostplantghostplantghostplan',
      followModule: ZERO_ADDRESS,
      followModuleInitData: [],
      followNFTURI:
        'https://ipfs.fleek.co/ipfs/ghostplantghostplantghostplantghostplantghostplantghostplan',
    };
    await waitForTx(lensHub.connect(user).createProfile(inputStruct));
  
    // deploying NBATeamCodeFollow
    const nbaTeamFollowModule = await deployContract(
      new NBATeamFollowModule__factory(governance).deploy(lensHub.address)
    );
  
    // whitelist NBATeamCodeFollow
    await waitForTx(lensHub.whitelistFollowModule(nbaTeamFollowModule.address, true));
  
    // set NBATeamCodeFollow as Follow
    await waitForTx(lensHub.connect(user).setFollowModule(1, nbaTeamFollowModule.address, []));
  
    const badData = defaultAbiCoder.encode(['uint256'], ['0']);
    
    try {
      await waitForTx(lensHub.connect(user).follow([1], [badData]));
    } catch (e) {
      console.log(`Expected failure occurred! Error: ${e}`);
    }

    const data = defaultAbiCoder.encode(['uint256'], ['16']);

    await waitForTx(lensHub.connect(user).follow([1], [data]));
  
    const followNFTAddr = await lensHub.getFollowNFT(1);
    const followNFT = FollowNFT__factory.connect(followNFTAddr, user);
  
    const totalSupply = await followNFT.totalSupply();
    const ownerOf = await followNFT.ownerOf(1);
  
    console.log(`Follow NFT total supply (should be 1): ${totalSupply}`);
    console.log(
      `Follow NFT owner of ID 1: ${ownerOf}, with team: ${data} user address (should be the same): ${user.address}`
    );
  
  });