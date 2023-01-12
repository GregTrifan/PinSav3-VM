import { ethers, Signer } from "ethers";
import { NFTStorage } from "nft.storage";
import { updateNotification } from "@mantine/notifications";

import { getContractInfo } from "@/utils/contracts";

export type PostData = {
  name: string;
  description: string;
  image: File;
};

export type Post = PostData & {
  image: string;
  token_id: number;
};

export async function UploadPost(
  signer: Signer,
  accAddress: string,
  data: PostData,
  chain?: number,
  provider?: string
) {
  try {
    let metadata_url;
    const { address, abi } = getContractInfo(chain);
    const contract = new ethers.Contract(address, abi, signer);

    if (provider === "NFT.Storage") {
      const client = new NFTStorage({
        token: process.env.NEXT_PUBLIC_TOKEN as string,
      });

      const metadata = await client.store({
        ...data,
      });

      metadata_url = metadata.url;
    }

    if (provider === "NFTPort") {
      let image_ipfs;
      const formData = new FormData();
      formData.append("file", data.image);
      const options = {
        method: "POST",
        body: formData,
        headers: {
          Authorization: process.env.NEXT_PUBLIC_NFTPORT as string,
        },
      };

      const rawResponse = await fetch(
        "https://api.nftport.xyz/v0/files",
        options
      );
      const content = await rawResponse.json();

      console.log(content);
      image_ipfs =
        "ipfs://" +
        content.ipfs_url.substring(content.ipfs_url.indexOf("ipfs/") + 5);

      console.log(image_ipfs);
      const optionsPost = {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          Authorization: process.env.NEXT_PUBLIC_NFTPORT as string,
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          file_url: image_ipfs,
        }),
      };
      const rawMetadataResponse = await fetch(
        "https://api.nftport.xyz/v0/metadata",
        optionsPost
      );
      const metadata = await rawMetadataResponse.json();

      metadata_url = metadata.metadata_uri;
      console.log(metadata_url);
    }

    if (chain === 80001) {
      console.log(metadata_url);
      await contract.mintPost(accAddress, metadata_url);
    }

    if (chain === 250 || chain === 56) {
      try {
        const id = ethers.BigNumber.from(ethers.utils.randomBytes(32));
        const Id = ethers.utils.hexZeroPad(
          ethers.BigNumber.from(id).toHexString(),
          32
        );
        const token = await contract.createPost(accAddress, metadata_url, Id);
        token.wait();
        console.log(token);
      } catch (e) {
        console.log(e);
      }
    }

    updateNotification({
      id: "upload-post",
      color: "teal",
      title: "Post uploaded successfully!!",
      message: "",
    });
  } catch (error) {
    updateNotification({
      id: "upload-post",
      color: "red",
      title: "Failed to upload post",
      message: `${error}`,
    });
  }
}
