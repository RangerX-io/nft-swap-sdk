import { NftSwapV4 } from '../../src/sdk/v4/NftSwapV4';
import { UserFacingERC721AssetDataSerializedV4, UserFacingERC20AssetDataSerializedV4 } from '../../src/sdk/v4/types';
import { ethers } from 'ethers';

jest.setTimeout(300 * 1000);

// Supply a provider, signer, and chain id to get started
// Signer is optional if you only need read-only methods

// proxy address: 0xDef1C0ded9bec7F1a1670819833240f027b25EfF
// mainnet: https://etherscan.io/address/0x4aF649FFde640CEb34b1AfaBa3e0Bb8e9698cb01#code
// ropsten: https://ropsten.etherscan.io/address/0x72657b338391c6A55120EB786a2b4FecED7D3Be2
// goerli: https://goerli.etherscan.io/address/0xf91bb752490473b8342a3e964e855b9f9a2a668e
// polygon: https://polygonscan.com/address/0xaA7d950A3Cef61d7Efe65501d998CB008b51467A
// bsc: https://bscscan.com/address/0xf14Ab1cd4AA58a9Ac8078AB8DEf8fD71fE984763

// sample transaction on ropsten: https://ropsten.etherscan.io/tx/0x316769bc70b7498a532f630f6025d43dde5d05d84d0ae422b149e4c6cc2fa54b
// sample transaction on rposten(with fee): https://ropsten.etherscan.io/tx/0x0a69250e6c5dd046d455b742bf932488158f2b860574bb5bc5ae15d9919d3fc8
// sample transaction on goerli: https://goerli.etherscan.io/tx/0x316769bc70b7498a532f630f6025d43dde5d05d84d0ae422b149e4c6cc2fa54b
// sample transaction on goerli(with fee): https://goerli.etherscan.io/tx/0x0a69250e6c5dd046d455b742bf932488158f2b860574bb5bc5ae15d9919d3fc8

const MAKER_PVK = "9e0392c9a2ddffbb2fd26318e00b60dbaf56333b22c0d4e9e9e64ac70ad1e9d1";
const MAKER_ADDR = "0x3c7ed5834863f6a55946AEfDC079F1141a726982";

const TAKER_PVK = "e402f220a754d0624907961cb733e6876aab8e87dfeb6607a76f22059a99a928";
const TAKER_ADDR = "0x3A63DfB819f43Bc7a078F544a75fb5F40e632434";

// const TAKER_PVK = "9e0392c9a2ddffbb2fd26318e00b60dbaf56333b22c0d4e9e9e64ac70ad1e9d1";
// const TAKER_ADDR = "0x3c7ed5834863f6a55946AEfDC079F1141a726982";

// const MAKER_PVK = "e402f220a754d0624907961cb733e6876aab8e87dfeb6607a76f22059a99a928";
// const MAKER_ADDR = "0x3A63DfB819f43Bc7a078F544a75fb5F40e632434";
// PROVIDER = "https://matic-mumbai.chainstacklabs.com";
const PROVIDER = "https://goerli.infura.io/v3/13bbb90e81d346c49bc1037e514b715a";

const CHAIN_ID = 5;
describe('NFTSwapV4', () => {
  it('utility functions on class work properly with erc721 sell order', async () => {
    const provider = new ethers.providers.JsonRpcProvider(PROVIDER)
    const signerForMaker = new ethers.Wallet(MAKER_PVK, provider);
    let nftSwapSdk = new NftSwapV4(provider, signerForMaker, CHAIN_ID);

    // mumbai
    const TEST_NFT_TOKEN: UserFacingERC721AssetDataSerializedV4 = {
      tokenAddress: "0xed0a6619729E55C014952975C39eA6057e8f8364", // RXNFT goerli contract address
      tokenId: '1',
      type: 'ERC721', // 'ERC721' or 'ERC1155'
    };

    const ONE_RXT: UserFacingERC20AssetDataSerializedV4 = {
      tokenAddress: "0x58E9E5dA59199F702683c0237da1822Be3940678", // RXT goerli contract address
      amount: '1000000', // 1 USDT
      type: 'ERC20',
    };

    const walletAddressMaker = MAKER_ADDR;

    const approvalStatusForMaker = await nftSwapSdk.loadApprovalStatus(
      TEST_NFT_TOKEN,
      walletAddressMaker
    );
    console.log({ approvalStatusForMaker })
    if (!approvalStatusForMaker.contractApproved) {
      const approvalTx = await nftSwapSdk.approveTokenOrNftByAsset(
        TEST_NFT_TOKEN,
        walletAddressMaker
      );
      console.log({ approvalTx })
      const approvalTxReceipt = await approvalTx.wait();
      console.log(
        `Approved ${TEST_NFT_TOKEN.tokenAddress} contract to swap with 0x v4 (txHash: ${approvalTxReceipt.transactionHash})`
      );
    }
    // Build order
    // let tx = await nftSwapSdk.approveTokenOrNftByAsset(TEST_NFT_TOKEN, walletAddressMaker);
    // console.log({ tx })
    const order = nftSwapSdk.buildOrder(
      TEST_NFT_TOKEN, // Maker asset to swap
      ONE_RXT, // Taker asset to swap
      walletAddressMaker, // Maker address
      {
        // fees: [
        //     {
        //         amount: '10000000000000000', // 0.01 USDT fee
        //         recipient: '0xe917063Ea98d736cf2cd62efF1AeF116A79CA248', // test 3 address 
        //     },
        // ],
      }
    );
    console.log({ order })
    // Sign order so order is now fillable
    const signedOrder = await nftSwapSdk.signOrder(order);

    console.log({ signedOrder })

    // const postedOrder = await nftSwapSdk.postOrder(signedOrder, chainId.toString());
    // console.log({ postedOrder })

    // const fetchedOrder = await nftSwapSdk.getOrders({ nonce: signedOrder.nonce })
    // console.log({ fetchedOrder: fetchedOrder.orders })

    // const canceledOrder = await nftSwapSdk.cancelOrder(signedOrder.nonce);
    // console.log({ canceledOrder })

    /* [Part 2: Taker that wants to buy the punk fills trade] */
    console.log("Part 2...")
    const signerForTaker = new ethers.Wallet(TAKER_PVK, provider);

    nftSwapSdk = new NftSwapV4(provider, signerForTaker, CHAIN_ID);

    const walletAddressTaker = TAKER_ADDR;
    console.log({walletAddressTaker})

    const approvalStatusForTaker = await nftSwapSdk.loadApprovalStatus(
      ONE_RXT,
      walletAddressTaker
    );
    console.log({ approvalStatusForTaker })
    if (!approvalStatusForTaker.contractApproved) {
      const approvalTx = await nftSwapSdk.approveTokenOrNftByAsset(
        ONE_RXT,
        walletAddressTaker
      );
      console.log({ approvalTx })
      const approvalTxReceipt = await approvalTx.wait();
      console.log(
        `Approved ${ONE_RXT.tokenAddress} contract to swap with 0x. TxHash: ${approvalTxReceipt.transactionHash})`
      );
    }

    // fill order
    const fillTx = await nftSwapSdk.fillSignedOrder(signedOrder);
    console.log({ fillTx })
    const fillTxReceipt = await nftSwapSdk.awaitTransactionHash(fillTx.hash);
    console.log({ fillTxReceipt })
    console.log(`🎉 🥳 Order filled. TxHash: ${fillTxReceipt.transactionHash}`);

  });
});
