import { Signer } from "ethers";

declare global {
    namespace NodeJS {
        interface Global {
            accounts: Signer[]
            owner: Signer
        }
    }
    namespace Mocha {
        interface MochaOptions {
            require: string | string[]
        }
    }
}

export {}