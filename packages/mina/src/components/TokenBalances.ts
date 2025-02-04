import { PublicKey, Mina, Field, fetchAccount, UInt64 } from 'o1js';

export function getMinaBalance(address: PublicKey) {
  let balance: bigint = 0n;
  try {
    balance = Mina.getBalance(address).value.toBigInt();
  } catch (e) {}
  return balance;
}

export async function getTokenAddressBalance(
  address: PublicKey,
  tokenId: Field = Field(1)
) {
  let balance: bigint = 0n;
  try {
    await fetchAccount({ publicKey: address, tokenId: tokenId });
    const fetchedBalance: bigint = Mina.getBalance(
      address,
      tokenId
    ).value.toBigInt();
    balance = fetchedBalance / BigInt(1e9);
  } catch (e) {}
  return balance;
}
