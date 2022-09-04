import {
  BackgroundImage,
  Text,
  Title,
  Box,
  Image,
  useMantineTheme,
} from "@mantine/core";

const ProfilePage = ({ user }: { user: any }) => {
  const theme = useMantineTheme();
  return (
    <Box
      sx={{
        display: "block",
        backgroundColor:
          theme.colorScheme === "dark"
            ? theme.colors.dark[6]
            : theme.colors.gray[2],

        textAlign: "center",
        padding: theme.spacing.xl,
        borderRadius: theme.radius.md,
        cursor: "pointer",
        "&:hover": {
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[5]
              : theme.colors.gray[4],
        },
      }}
    >
      <BackgroundImage
        src={
          user.backgroundImage?.url
            ? user.backgroundImage.url
            : "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=720&q=80"
        }
        radius="lg"
      >
        <Title sx={{ color: "aqua", padding: theme.spacing.xl }} order={1}>
          {user.name}
        </Title>

        <div
          style={{
            width: 200,
            marginLeft: "auto",
            marginRight: "auto",
            padding: theme.spacing.lg,
          }}
        >
          <Image
            radius="md"
            height={160}
            src={
              user.profileImage?.url
                ? user.profileImage.url
                : "https://images.unsplash.com/photo-1511216335778-7cb8f49fa7a3?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=720&q=80"
            }
            alt="Random unsplash image"
          />
        </div>
        <Text
          component="span"
          align="center"
          variant="gradient"
          gradient={{ from: "indigo", to: "cyan", deg: 45 }}
          size="xl"
          weight={800}
          style={{ fontFamily: "Greycliff CF, sans-serif" }}
        >
          {user.description}
        </Text>
        <Title
          align="center"
          sx={{ color: theme.colors.grape[5], padding: theme.spacing.xl }}
        >
          [{user.tags}]
        </Title>
      </BackgroundImage>
    </Box>
  );
};

export async function getServerSideProps(context: { params: { addr: any } }) {
  const { addr } = context.params;
  const user = await fetch(
    `${
      process.env.NEXT_PUBLIC_API_ENDPOINT ?? "https://evm.pinsave.app/"
    }api/lukso/l14/${addr}`
  );
  const data = await user.json();

  if (!data) {
    return {
      notFound: true,
    };
  }

  if (data.ProfileData[1].name === "LSP3Profile") {
    const profile = data.ProfileData[1].value.LSP3Profile;
    return {
      props: { user: profile },
    };
  }

  return {
    props: { user: data },
  };
}

export default ProfilePage;
