import { defaultAbiCoder } from 'ethers/lib/utils';
import { task } from 'hardhat/config';
import {
  FollowNFT__factory,
  LensHub__factory,
  NBAGameReferenceModule__factory,
} from '../typechain-types';
import { CreateProfileDataStruct, PostDataStruct, CommentDataStruct } from '../typechain-types/LensHub';
import {
  waitForTx,
  initEnv,
  getAddrs,
  ProtocolState,
  ZERO_ADDRESS,
  deployContract,
} from './helpers/utils';

task('test-nba-reference', 'tests the NBAGameReferenceModule').setAction(async ({}, hre) => {
    const [governance, , user] = await initEnv(hre);
    const addrs = getAddrs();
    const freeCollectModuleAddr = addrs['free collect module'];
    const lensHub = LensHub__factory.connect(addrs['lensHub proxy'], governance);

    await waitForTx(lensHub.setState(ProtocolState.Unpaused));
    await waitForTx(lensHub.whitelistProfileCreator(user.address, true));

    const inputProfileStruct: CreateProfileDataStruct = {
        to: user.address,
        handle: 'farquad4',
        imageURI:
          'https://ipfs.fleek.co/ipfs/ghostplantghostplantghostplantghostplantghostplantghostplan',
        followModule: ZERO_ADDRESS,
        followModuleInitData: [],
        followNFTURI:
          'https://ipfs.fleek.co/ipfs/ghostplantghostplantghostplantghostplantghostplantghostplan',
      };
      await waitForTx(lensHub.connect(user).createProfile(inputProfileStruct));

    // deploying NBAGameReferenceModule
    const nbaGameReferenceModule = await deployContract(
      new NBAGameReferenceModule__factory(governance).deploy(lensHub.address)
    );

    // whitelist NBAGameReferenceModule
    await waitForTx(lensHub.whitelistReferenceModule(nbaGameReferenceModule.address, true));

    // create post and set reference module w inputs: homeTeam = 2, awayTeam = 3, gameDateTime = 1665266353
    const inputPostStruct: PostDataStruct = {
        profileId: 1,
        contentURI: 'https://ipfs.io/ipfs/Qmby8QocUU2sPZL46rZeMctAuF5nrCc7eR1PPkooCztWPz',
        collectModule: freeCollectModuleAddr,
        collectModuleInitData: defaultAbiCoder.encode(['bool'], [true]),
        referenceModule: nbaGameReferenceModule.address,
        referenceModuleInitData: '0x35f0536eb1',
      };
    await waitForTx(lensHub.connect(user).post(inputPostStruct));
    console.log(await lensHub.getPub(1, 1));

    const inputBadCommentStruct: CommentDataStruct = {
        profileId: 1,
        contentURI: 'https://ipfs.io/ipfs/Qmby8QocUU2sPZL46rZeMctAuF5nrCc7eR1PPkooCztWPz',
        profileIdPointed: 1,
        pubIdPointed: 1,
        referenceModuleData: [4],
        collectModule: freeCollectModuleAddr,
        collectModuleInitData: defaultAbiCoder.encode(['bool'], [true]),
        referenceModule: nbaGameReferenceModule.address,
        referenceModuleInitData: [],
    }
    try {
        await waitForTx(lensHub.connect(user).comment(inputBadCommentStruct));
      } catch (e) {
        console.log(`Expected failure occurred! Error: ${e}`);
      }

    const inputCommentStruct: CommentDataStruct = {
        profileId: 1,
        contentURI: 'https://ipfs.io/ipfs/Qmby8QocUU2sPZL46rZeMctAuF5nrCc7eR1PPkooCztWPz',
        profileIdPointed: 1,
        pubIdPointed: 1,
        referenceModuleData: [4],
        collectModule: freeCollectModuleAddr,
        collectModuleInitData: defaultAbiCoder.encode(['bool'], [true]),
        referenceModule: nbaGameReferenceModule.address,
        referenceModuleInitData: [],
    }

    await waitForTx(lensHub.connect(user).comment(inputCommentStruct));

});