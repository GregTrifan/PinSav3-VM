import { Field, PublicKey, MerkleMap } from 'o1js';

import { storeNFTMap } from './merkleMap.js';
import { NFT, NFTMetadata, createNFT } from './NFT.js';

export function generateDummyCollectionMap(
  pubKey: PublicKey,
  map: MerkleMap,
  totalNumber: number = 2
) {
  let nftArray: NFT[] = [];
  let nftMetadataArray: NFTMetadata[] = [];
  for (let i = 0; i <= totalNumber; i++) {
    // Generate NFT metadata
    const nftMetadata: NFTMetadata = generateDummyNFTMetadata(i, pubKey);
    // Store NFT in the Merkle map
    const nft: NFT = storeNFTMap(nftMetadata, map);
    // Add the NFT and its metadata to the arrays
    nftArray.push(nft);
    nftMetadataArray.push(nftMetadata);
  }
  return {
    nftArray: nftArray,
    nftMetadata: nftMetadataArray,
  };
}

export function generateDummyCollectionWithMap(pubKey: PublicKey) {
  const map: MerkleMap = new MerkleMap();
  const nftArray = generateDummyCollectionMap(pubKey, map);
  return { map: map, ...nftArray };
}

export function generateDummyNFTMetadata(
  id: number,
  pubKey: PublicKey
): NFTMetadata {
  const nftMetadata = {
    name: 'DSPYT - into CodeVerse',
    description:
      'Join our community to explore the latest trends in data science, share insights on blockchain technology, and participate in DAO',
    id: Field(id),
    cid: 'https://dspyt.com/DSPYT.png',
    owner: pubKey,
    isMinted: '0',
  };
  return nftMetadata;
}

export function generateDummyNFT(id: number, pubKey: PublicKey) {
  const nftMetadata: NFTMetadata = generateDummyNFTMetadata(id, pubKey);
  const nftHashed: NFT = createNFT(nftMetadata);
  return { nftHashed: nftHashed, nftMetadata: nftMetadata };
}
