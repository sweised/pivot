import "server-only";
import Navbar from "@/components/navbar";
import Uniswap from "@/components/uniswap";

function App() {
  return (
    <div className="relative grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-screen">
      <Navbar />
      <Uniswap />
    </div>
  );
}

export default App;
