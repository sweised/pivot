import "server-only";
import { Box, Grid } from "@radix-ui/themes";
import Navbar from "./components/navbar";

function App() {
  return (
    <Grid as="div" columns={"repeat(12, minmax(0,1fr)"} rows={"auto 1fr"}>
      <Box as="div" gridColumn={"1 / -1"}>
        <Navbar />
      </Box>
      <Box as="div" gridColumn={"1 / span 9"}>
        <p>Hello there</p>
      </Box>
      <Box as="div" gridColumn={"10 / span 3"}>
        <p>Hello again</p>
      </Box>
    </Grid>
  );
}

export default App;
