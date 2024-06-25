import Link from "next/link";
import { OpenW3mButton } from "./open-w3m-button";

export default function Navbar() {
  return (
    <header className="col-span-2 mx-16 py-4">
      <nav
        className="flex flex-row items-center justify-between"
        aria-label="Global"
      >
        <div className="flex-auto">
          <div>
            <Link href="/">
              <svg
                className="h-16 w-16"
                viewBox="0 0 102 102"
                version="1.1"
                id="svg1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Pivot</title>
                <defs id="defs1" />
                <g id="layer1" transform="translate(-55.097929,-52.078992)">
                  <path
                    id="path1"
                    className="fill-primary"
                    style={{
                      // fill: "#0e7bb4",
                      fillOpacity: 1,
                      strokeWidth: 1.08238,
                    }}
                    d="M 106.04469,52.078992 A 50.946632,50.946632 0 0 0 55.097929,103.02524 50.946632,50.946632 0 0 0 106.04469,153.972 50.946632,50.946632 0 0 0 156.99093,103.02524 50.946632,50.946632 0 0 0 106.04469,52.078992 Z m 0,20.755839 A 30.190598,30.190598 0 0 1 136.2351,103.02524 30.190598,30.190598 0 0 1 106.04469,133.21616 30.190598,30.190598 0 0 1 75.853768,103.02524 30.190598,30.190598 0 0 1 106.04469,72.834831 Z"
                  />
                  <path
                    className="fill-primary"
                    style={{
                      // fill: "#0d5473",
                      fillOpacity: 1,
                      strokeWidth: 0.377383,
                    }}
                    d="m 102.19619,114.55759 c -5.247262,-1.87304 -8.761902,-7.19405 -8.277852,-12.53229 0.38761,-4.274579 3.079,-8.138686 7.014962,-10.071584 1.78767,-0.877901 2.61303,-1.045525 5.14806,-1.045525 2.53503,0 3.36039,0.167624 5.14807,1.045525 2.48784,1.221748 4.96235,3.753017 6.10705,6.247138 1.25351,2.731216 1.15425,7.124286 -0.22441,9.931636 -1.23058,2.50584 -3.77804,4.98555 -6.24105,6.07505 -2.48384,1.09872 -6.16169,1.24713 -8.67483,0.35005 z"
                    id="path5"
                  />
                </g>
              </svg>
            </Link>
          </div>
        </div>
        <div className="justify-self-end">
          <OpenW3mButton />
        </div>
      </nav>
    </header>
  );
}
