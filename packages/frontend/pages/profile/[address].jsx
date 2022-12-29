import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { Orbis } from "@orbisclub/orbis-sdk";

import {
  Text,
  Paper,
  Title,
  TextInput,
  Textarea,
  Group,
  Button,
  Image,
  Center,
  MediaQuery,
} from "@mantine/core";

let orbis = new Orbis();

function Post() {
  const router = useRouter();
  const { address } = router.query;

  const [user, setUser] = useState();

  useEffect(() => {
    async function ABC() {
      let res = await orbis.isConnected();

      if (res) {
        let { data, error } = await orbis.getDids(address);
        console.log(data);
        setUser(data[0]);
      }

      if (!res) {
        let res = await orbis.connect();
        setUser(res);
      }
    }
    ABC();
  }, [address]);

  return (
    <>
      {user && user.details ? (
        <Paper
          withBorder
          shadow="xl"
          p="xl"
          radius="xl"
          sx={{ maxWidth: "900px", backgroundColor: "#82c7fc1d" }}
          mx="auto"
        >
          <div style={{ width: 400, marginLeft: "auto", marginRight: "auto" }}>
            <Center>
              <Title> {user.details.profile?.username}</Title>
            </Center>
            <Image
              radius="md"
              src={user.details.profile?.pfp}
              alt={user.details.profile?.username}
            />
          </div>
        </Paper>
      ) : null}
    </>
  );
}

export default Post;
