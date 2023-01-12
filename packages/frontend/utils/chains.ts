import { CHAINS, type ChainName } from "@/constants/chains";

export const getCurrentChain = (chainId: number) => {
  return Object.keys(CHAINS).find(
    (key) => CHAINS[key as keyof typeof CHAINS] === chainId
  ) as ChainName;
};
