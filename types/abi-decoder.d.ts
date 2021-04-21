declare module 'abi-decoder' {
    namespace ABI {
        type Type = "function" | "constructor" | "event" | "fallback"
        type StateMutabilityType = "pure" | "view" | "nonpayable" | "payable"

        interface Item {
            type: Type
            anonymous?: boolean
            constant?: boolean
            gas?: number
            inputs?: Input[]
            name?: string
            outputs?: Output[]
            payable?: boolean
            stateMutability?: StateMutabilityType
        }

        interface Input {
            name: string
            type: string
            indexed?: boolean
            components?: Input[]
            internalType?: string
        }

        interface Output {
            name: string;
            type: string;
            components?: Output[];
            internalType?: string;
        }
    }
    
    interface DecodedMethod {
        name: string
        params: DecodedMethodParams[]
    }

    interface DecodedMethodParams {
        name: string,
        value?: any,
        type: string
    }

    interface LogItem {
        transactionIndex: string
        logIndex: string
        blockNumber: string
        transactionHash: string
        blockHash: string
        data: string
        topics: string[]
        address: string
    }
    
    function getABIs(): ABI.Item[]
    function addABI(items: ABI.Item[]): void
    function getMethodIDs(): Record<string, ABI.Item>
    function decodeMethod(data: string): DecodedMethod | undefined
    function decodeLogs(logs: LogItem[]): any
    function removeABI(items: ABI.Item[]): void
}
