import "server-only";
import ClientComponent from "./client-component";

function App() {
  console.log("woohoo server-only");
  return (
    <>
      <ClientComponent />
    </>
  );
}

export default App;
