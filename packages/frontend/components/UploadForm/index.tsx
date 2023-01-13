import BigNumber from "bignumber.js";
import {
  Text,
  Paper,
  Title,
  TextInput,
  Textarea,
  Group,
  Button,
  Image,
  Input,
  Center,
  MediaQuery,
  NativeSelect,
} from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import { showNotification, updateNotification } from "@mantine/notifications";
import ReactPlayer from "react-player";
import React, { useState, useContext } from "react";
import { Upload, Replace } from "tabler-icons-react";
import { useAccount, useSigner, useNetwork } from "wagmi";

import { UploadPost } from "@/services/upload";
import { MainContext } from "@/utils/context";

export const dropzoneChildren = (image: File | undefined) => {
  if (image) {
    let link = URL.createObjectURL(image);
    return (
      <Group
        position="center"
        spacing="xl"
        style={{ minHeight: 220, pointerEvents: "none" }}
      >
        {image.type[0] === "i" ? (
          <Image
            src={link}
            alt="uploaded image"
            my="md"
            radius="lg"
            sx={{ maxWidth: "240px" }}
          />
        ) : (
          <ReactPlayer url={link} />
        )}
        <Group sx={{ color: "#3a3a3a79" }}>
          <MediaQuery
            query="(max-width:500px)"
            styles={{
              marginLeft: "auto",
              marginRight: "auto",
              maxHeight: "30px",
            }}
          >
            <Replace size={40} />
          </MediaQuery>
          <Text size="md" inline align="center">
            Click/Drag here to replace image
          </Text>
        </Group>
      </Group>
    );
  }
  return (
    <Group
      position="center"
      spacing="xl"
      style={{ minHeight: 220, pointerEvents: "none" }}
    >
      <Upload size={80} />
      <div>
        <Text size="xl" inline>
          Drag image here or click to select a image
        </Text>
        <Text size="sm" color="dimmed" inline mt={7}>
          Image should not exceed 5mb
        </Text>
      </div>
    </Group>
  );
};

const UploadForm = () => {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const [title, setTitle] = useState<string>("");
  const [desc, setDesc] = useState<string>("");
  const [postReceiver, setPostReceiver] = useState<string>("");
  const [image, setImage] = useState<File | undefined>();

  const [provider, setProvider] = useState<string>("NFT.Storage");

  const [amount, setAmount] = useState<string>();

  const { bundlrInstance, initialiseBundlr, balance, fetchBalance } =
    useContext(MainContext);

  async function initialize() {
    initialiseBundlr();
  }

  function filledPost() {
    return desc !== "" && title !== "";
  }

  async function fundWallet() {
    if (!amount) return;
    const amountParsed = parseInput(amount);
    let response = await bundlrInstance.fund(amountParsed);
    console.log("Wallet funded: ", response);
    fetchBalance();
  }

  function parseInput(input: string) {
    const conv = new BigNumber(input).multipliedBy(
      bundlrInstance.currencyConfig.base[1]
    );
    if (conv.isLessThan(1)) {
      console.log("error: value too small");
      return;
    } else {
      return conv;
    }
  }

  const startUpload = async (storageProvider: string) => {
    showNotification({
      id: "upload-post",
      loading: true,
      title: "Uploading post",
      message: "Data will be loaded in a couple of seconds",
      autoClose: false,
      disallowClose: true,
    });

    const check = filledPost();

    if (signer && image && check && chain) {
      if (postReceiver) {
        UploadPost(
          signer,
          postReceiver,
          {
            name: title,
            description: desc,
            image: image,
          },
          chain.id,
          storageProvider,
          bundlrInstance
        );
      }

      if (!postReceiver && address) {
        UploadPost(
          signer,
          address,
          {
            name: title,
            description: desc,
            image: image,
          },
          chain.id,
          storageProvider,
          bundlrInstance
        );
      }
    }

    if (!signer) {
      updateNotification({
        id: "upload-post",
        color: "red",
        title: "Failed to upload post",
        message: "Check if you've connected the wallet",
      });
    }

    if (!check) {
      updateNotification({
        id: "upload-post",
        color: "red",
        title: "Failed to upload post",
        message: "Check if you've completed the post",
      });
    }

    if (!image) {
      updateNotification({
        id: "upload-post",
        color: "red",
        title: "Failed to upload post",
        message: "Check if you've uploaded an image",
      });
    }
  };

  return (
    <Paper
      withBorder
      shadow="xl"
      p="xl"
      radius="lg"
      sx={{ maxWidth: "900px" }}
      mx="auto"
    >
      <Title my="lg" align="center">
        Upload a new Post
      </Title>
      <TextInput
        required
        label="Title"
        placeholder="Post Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        my="lg"
        required
        onChange={(e) => setDesc(e.target.value)}
        value={desc}
        label="Description"
        placeholder="Describe your post here"
      />
      <Textarea
        my="lg"
        onChange={(e) => setPostReceiver(e.target.value)}
        value={postReceiver}
        label="Post Receiver"
        placeholder="Enter Address You Want To Receive The NFT"
      />
      <Dropzone
        mt="md"
        onReject={(files) => console.log("rejected files", files)}
        onDrop={(files) => setImage(files[0])}
        maxSize={25000000}
        multiple={false}
        accept={[
          MIME_TYPES.png,
          MIME_TYPES.jpeg,
          MIME_TYPES.webp,
          MIME_TYPES.svg,
          MIME_TYPES.gif,
          MIME_TYPES.mp4,
        ]}
      >
        {() => dropzoneChildren(image)}
      </Dropzone>

      <Group position="center" sx={{ padding: 15 }}>
        <Button
          component="a"
          radius="lg"
          mt="md"
          onClick={() => startUpload(provider)}
        >
          Upload Post
        </Button>
      </Group>
      <Center>
        <NativeSelect
          placeholder="Pick IPFS Provider"
          value={provider}
          onChange={(event) => setProvider(event.currentTarget.value)}
          size="sm"
          data={["NFT.Storage", "NFTPort", "Arweave"]}
        />
      </Center>
      <Group position="center">
        {provider === "Arweave" && !balance && (
          <Button onClick={initialize}>Initialize</Button>
        )}
        {provider === "Arweave" && balance && (
          <div>
            <Title mt="md" order={4}>
              Balance: {balance}
            </Title>
            <Input size="xs" onChange={(e) => setAmount(e.target.value)} />
            <Button mt="md" size="xs" onClick={fundWallet}>
              Fund Wallet
            </Button>
          </div>
        )}
      </Group>
    </Paper>
  );
};

export default UploadForm;
