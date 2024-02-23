import {
  PublicKey,
  PrivateKey,
  Mina,
  AccountUpdate,
  MerkleMap,
  MerkleMapWitness,
  Field,
  VerificationKey,
  UInt64,
  Signature,
} from 'o1js';

import { MerkleMapContract } from '../NFTsMapContract.js';
import { compareLogStates, getTreeRoot } from './AppState.js';
import { logTokenBalances, getTokenBalances } from './TokenBalances.js';
import { NFTtoHash, Nft } from './Nft.js';

export async function setFee(
  zkAppPrivateKey: PrivateKey,
  deployerPk: PrivateKey,
  contract: MerkleMapContract,
  fee: UInt64 = UInt64.one
) {
  const deployerAddress: PublicKey = deployerPk.toPublicKey();
  const feeFields: Field[] = fee.toFields();
  const feeSignature: Signature = Signature.create(zkAppPrivateKey, feeFields);

  const txn: Mina.Transaction = await Mina.transaction(deployerAddress, () => {
    contract.setFee(fee, feeSignature);
  });

  await sendWaitTx(txn, [deployerPk], false);
}

export async function initNft(
  pubKey: PublicKey,
  pk: PrivateKey,
  _NFT: Nft,
  zkAppInstance: MerkleMapContract,
  merkleMap: MerkleMap,
  compile: boolean = false,
  live: boolean = true,
  displayLogs: boolean = false
) {
  if (compile) {
    await MerkleMapContract.compile();
  }

  const nftId: Field = _NFT.id;
  const witnessNFT: MerkleMapWitness = merkleMap.getWitness(nftId);

  const txOptions = createTxOptions(pubKey, live);

  const init_mint_tx: Mina.Transaction = await Mina.transaction(
    txOptions,
    () => {
      zkAppInstance.initNft(_NFT, witnessNFT);
    }
  );

  await sendWaitTx(init_mint_tx, [pk], live);

  // the tx should execute before we set the map value
  merkleMap.set(nftId, NFTtoHash(_NFT));

  if (displayLogs) {
    compareLogStates(zkAppInstance, merkleMap);
  }
}

export async function mintNftFromMap(
  pk: PrivateKey,
  _NFT: Nft,
  zkAppInstance: MerkleMapContract,
  merkleMap: MerkleMap,
  compile: boolean = false,
  live: boolean = true,
  displayLogs: boolean = false
) {
  const pubKey: PublicKey = pk.toPublicKey();
  const nftId: Field = _NFT.id;

  // ensure that local map matches on-chain

  if (displayLogs) {
    const match =
      merkleMap.getRoot().toString() ===
      (await getTreeRoot(zkAppInstance)).toString();
    console.log('it is a tree root state match', match);
  }

  const witnessNFT: MerkleMapWitness = merkleMap.getWitness(nftId);

  await mintNFT(pk, _NFT, zkAppInstance, witnessNFT, compile, live);

  if (displayLogs) {
    logTokenBalances(pubKey, zkAppInstance);
    compareLogStates(zkAppInstance, merkleMap);
  }
}

export async function mintNFT(
  pk: PrivateKey,
  _NFT: Nft,
  zkAppInstance: MerkleMapContract,
  merkleMapWitness: MerkleMapWitness,
  compile: boolean = false,
  live = true
) {
  if (compile) {
    await MerkleMapContract.compile();
  }
  const pubKey: PublicKey = pk.toPublicKey();
  const txOptions = createTxOptions(pubKey, live);

  const mint_tx = await createMintTx(
    pubKey,
    zkAppInstance,
    _NFT,
    merkleMapWitness,
    txOptions
  );

  await sendWaitTx(mint_tx, [pk], live);
}

export async function createMintTx(
  pubKey: PublicKey,
  zkAppInstance: MerkleMapContract,
  _NFT: Nft,
  merkleMapWitness: MerkleMapWitness,
  txOptions: TxOptions
) {
  const recipientBalance = getTokenBalances(pubKey, zkAppInstance);
  let mint_tx: Mina.Transaction;

  if (recipientBalance > 0) {
    mint_tx = await Mina.transaction(txOptions, () => {
      zkAppInstance.mintNft(_NFT, merkleMapWitness);
    });
  } else {
    mint_tx = await Mina.transaction(txOptions, () => {
      AccountUpdate.fundNewAccount(pubKey);
      zkAppInstance.mintNft(_NFT, merkleMapWitness);
    });
  }
  return mint_tx;
}

export async function createNotFirstMintTx(
  zkAppInstance: MerkleMapContract,
  _NFT: Nft,
  merkleMapWitness: MerkleMapWitness,
  txOptions: TxOptions
) {
  const mint_tx: Mina.Transaction = await Mina.transaction(txOptions, () => {
    zkAppInstance.mintNft(_NFT, merkleMapWitness);
  });

  return mint_tx;
}

export async function transferNft(
  pk: PrivateKey,
  recipient: PublicKey,
  _NFT: Nft,
  zkAppInstance: MerkleMapContract,
  merkleMap: MerkleMap,
  zkAppPrivateKey: PrivateKey,
  live: boolean = true,
  displayLogs: boolean = false
) {
  const pubKey: PublicKey = pk.toPublicKey();
  const nftId: Field = _NFT.id;
  const witnessNFT: MerkleMapWitness = merkleMap.getWitness(nftId);

  const transferSignature: Signature = Signature.create(
    zkAppPrivateKey,
    Nft.toFields(_NFT)
  );

  const recipientBalance = getTokenBalances(recipient, zkAppInstance);

  let nft_transfer_tx: Mina.Transaction;
  if (recipientBalance > 0) {
    nft_transfer_tx = await Mina.transaction(pubKey, () => {
      zkAppInstance.transfer(_NFT, recipient, witnessNFT, transferSignature);
    });
  } else {
    nft_transfer_tx = await Mina.transaction(pubKey, () => {
      AccountUpdate.fundNewAccount(pubKey);
      zkAppInstance.transfer(_NFT, recipient, witnessNFT, transferSignature);
    });
  }

  await sendWaitTx(nft_transfer_tx, [pk], live);

  _NFT.changeOwner(recipient);

  merkleMap.set(nftId, NFTtoHash(_NFT));

  if (displayLogs) {
    logTokenBalances(pubKey, zkAppInstance);
    logTokenBalances(recipient, zkAppInstance);

    compareLogStates(zkAppInstance, merkleMap);
  }
}

export async function initRootWithApp(
  zkAppPrivateKey: PrivateKey,
  pk: PrivateKey,
  merkleMap: MerkleMap,
  totalInited: number,
  compile: boolean = false,
  live: boolean = true
) {
  const zkAppPub: PublicKey = zkAppPrivateKey.toPublicKey();
  if (compile) {
    await MerkleMapContract.compile();
  }
  const zkAppInstance: MerkleMapContract = new MerkleMapContract(zkAppPub);
  await initAppRoot(
    zkAppPrivateKey,
    pk,
    zkAppInstance,
    merkleMap,
    totalInited,
    live
  );
}

export async function initAppRoot(
  zkAppPrivateKey: PrivateKey,
  pk: PrivateKey,
  zkAppInstance: MerkleMapContract,
  merkleMap: MerkleMap,
  totalInited: number,
  live: boolean = true,
  displayLogs: boolean = false
) {
  const pubKey: PublicKey = pk.toPublicKey();
  const rootBefore: Field = merkleMap.getRoot();
  const totalSupplied: UInt64 = UInt64.from(totalInited);

  const rootSignature: Signature = Signature.create(
    zkAppPrivateKey,
    zkAppInstance.address.toFields()
  );

  const txOptions = createTxOptions(pubKey, live);

  const init_tx: Mina.Transaction = await Mina.transaction(txOptions, () => {
    zkAppInstance.initRoot(
      rootBefore,
      totalSupplied,
      UInt64.zero,
      new UInt64(255),
      rootSignature
    );
  });

  await sendWaitTx(init_tx, [pk], live);

  if (displayLogs) {
    compareLogStates(zkAppInstance, merkleMap);
  }
}

export async function deployApp(
  pk: PrivateKey,
  proofsEnabled: boolean = true,
  live: boolean = true,
  displayLogs: boolean = false
): Promise<{
  merkleMap: MerkleMap;
  zkAppInstance: MerkleMapContract;
  zkAppPk: PrivateKey;
}> {
  let verificationKey: VerificationKey | undefined;

  if (proofsEnabled) {
    ({ verificationKey } = await MerkleMapContract.compile());
    console.log('compiled');
  }

  const zkAppPrivateKey: PrivateKey = PrivateKey.random();
  const zkAppAddress: PublicKey = zkAppPrivateKey.toPublicKey();

  const zkAppInstance: MerkleMapContract = new MerkleMapContract(zkAppAddress);
  const merkleMap: MerkleMap = new MerkleMap();

  const pubKey: PublicKey = pk.toPublicKey();

  const deployTxnOptions = createTxOptions(pubKey, live);

  const deployTx: Mina.Transaction = await Mina.transaction(
    deployTxnOptions,
    () => {
      AccountUpdate.fundNewAccount(pubKey);
      zkAppInstance.deploy({ verificationKey, zkappKey: zkAppPrivateKey });
    }
  );

  await sendWaitTx(deployTx, [pk], live);

  if (displayLogs) {
    compareLogStates(zkAppInstance, merkleMap, live);
  }

  return {
    merkleMap: merkleMap,
    zkAppInstance: zkAppInstance,
    zkAppPk: zkAppPrivateKey,
  };
}

async function sendWaitTx(
  tx: Mina.Transaction,
  pks: PrivateKey[],
  live: boolean = true
) {
  tx.sign(pks);
  await tx.prove();

  let pendingTx = await tx.send();

  if (live) {
    console.log(`Got pending transaction with hash ${pendingTx.hash()}`);

    // Wait until transaction is included in a block
    await pendingTx.wait();
    if (!pendingTx.isSuccess) {
      throw new Error('tx not successful');
    }
  }
}

export function createTxOptions(
  pubKey: PublicKey,
  live: boolean = true,
  fee: number = 100_000_000
) {
  const txOptions: { sender: PublicKey; fee?: number } = {
    sender: pubKey,
  };
  if (live) {
    txOptions.fee = fee;
  }
  return txOptions;
}

export type TxOptions = {
  sender: PublicKey;
  fee?: number | undefined;
};
