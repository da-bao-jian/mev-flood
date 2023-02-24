import { parseEther } from 'ethers/lib/utils'
import { textColors, } from './helpers'

export const getOption = (args: string[], flagIndex: number, argType?: "string" | "number" | "boolean") => {
    if (args.length > flagIndex + 1 || argType === "boolean") {
        // number is default type
        if (!argType || argType === "number") {
            const f = parseFloat(args[flagIndex + 1])
            if (f % 1 !== 0) {
                return f
            } else {
                return parseInt(args[flagIndex + 1])
            }
        }
        else if (argType === "boolean")
            return true
        else if (argType === "string")
            return args[flagIndex + 1]
    } else {
        throw new Error(`option '${args[flagIndex]}' was not specified`)
    }
}

export const getFlagIndex = (args: string[], fullName: string, shortName?: string) => {
    return Math.max(args.indexOf(fullName), shortName ? args.indexOf(shortName) : -1)
}

/**
 * Get CLI args for "search" scripts (dumb-search, smart-search, fake-search)
 * @param programName name of script for console readability
 * @returns start and end indices for wallets to use from `src/output/wallets.json`
 */
export const getSearchArgs = (programName: string) => {
    const helpMessage = (program: string) => `search on multiple wallets (defined in \`src/output/wallets.json\`)

Usage:
    yarn ${program} <first_wallet_index> <last_wallet_index> [mempool]

Example:
    # run with a single wallet
    yarn ${program} 13

    # run with 25 wallets on flashbots
    yarn ${program} 0 25

    # run with 4 wallets on mempool
    yarn ${program} 0 25 mempool
`
    if (process.argv.length > 2) {
        if (process.argv[2].includes("help")) {
            console.log(helpMessage(programName))
            process.exit(0)
        }
    } else {
        console.error("one or two wallet indices are required")
        console.log(helpMessage(programName))
        process.exit(1)
    }
    
    let [startIdx, endIdx] = process.argv.slice(2)
    if (!endIdx) {
        endIdx = `${parseInt(startIdx) + 1}`
    }
    return {startIdx, endIdx}
}

/**
 * Get CLI args for sendPrivateTx script.
 */
export const getSendPrivateTxArgs = () => {
    const helpMessage = `send a sample private tx.

Usage:
    yarn script.sendPrivateTx [dummy]

Example:
    # send private tx to lottery contract (lottery_mev.sol must be deployed on target chain)
    yarn script.sendPrivateTx

    # send private tx to uniswapV2 router (works on any chain)
    yarn script.sendPrivateTx dummy
`

    if (process.argv.length > 2) {
        if (process.argv[2].includes("help")) {
            console.log(helpMessage)
            return undefined
        } else if (process.argv[2].includes("dummy")) {
            return {
                dummy: true
            }
        }
    }
    return {
        dummy: false
    }
}

/**
 * Get CLI args for cancelPrivateTx script.
 */
 export const getCancelPrivateTxArgs = () => {
    const helpMessage = `cancel a private tx.

Usage:
    yarn script.cancelPrivateTx <tx_hash>

Example:
    yarn script.cancelPrivateTx 0x52485869d1aa64a4fb029edaf94e6b978ad32ea1879adabab38639dd462324ac
`

    if (process.argv.length > 2) {
        if (process.argv[2].includes("help")) {
            console.log(helpMessage)
        } else {
            return process.argv[2]
        }
    }
    return undefined
}

/**
 * Get CLI args for sendProtectTx script.
 */
 export const getSendProtectTxArgs = () => {
    let dummy = false
    let fast = false
    const helpMessage = `send a sample Protect tx.

Usage:
    yarn script.sendProtectTx [dummy] [fast]

Example:
    # send lottery contract tx to Protect (lottery_mev.sol must be deployed on target chain)
    yarn script.sendProtectTx

    # send uniswapV2 router tx to Protect (works on any chain)
    yarn script.sendProtectTx dummy

    # send lottery contract tx to Protect with fast mode
    yarn script.sendProtectTx fast

    # send uniswapV2 router tx to Protect w/ fast mode
    yarn script.sendProtectTx fast dummy
    # or
    yarn script.sendProtectTx dummy fast
`

    if (process.argv.length > 2) {
        if (process.argv[2].includes("help")) {
            console.log(helpMessage)
            return undefined
        } 
        const args = `${process.argv[2]}&${process.argv[3]}`
        if (args.includes("dummy")) {
            dummy = true
        }
        if (args.includes("fast")) {
            fast = true
        }
    }
    return {
        dummy,
        fast,
    }
}

export const useMempool = process.argv.length > 4 && process.argv[4] == "mempool"

export const getDeployLiquidArgs = () => {
    let shouldDeploy = true
    let shouldMintTokens = true
    let shouldBootstrapLiquidity = true
    let shouldApproveTokens = true
    let autoAccept = false
    let numPairs = 1
    let sendToMempool = false
    let wethMintAmountAdmin: number = 100
    let wethMintAmountUser: number = 5.1

    const helpMessage = `
    ${textColors.Bright}script.liquid${textColors.Reset}: deploy a uniswap v2 environment w/ bootstrapped liquidity.
    Deployment details are written to \`src/output/${process.env.NODE_ENV}/uniBootstrap$N.json\`
    where $N increments numerically.

Usage:
    yarn script.liquid [options]

Options:
    --deploy-only *         Only deploy contracts, don't bootstrap liquidity.
    --mint-only *           Only mint tokens.
    --bootstrap-only *      Only bootstrap liquidity, don't deploy contracts.
    --approve-only *        Only approve uni router to spend your tokens.
    -p, --num-pairs         Number of DAI pairs to deploy (if deploying). 
                            That number of DAI tokens will be created, and a unique 
                            WETH_DAI pair will be deployed on each UniswapV2 
                            clone for each DAI token.
    -w, --weth-mint-admin   Amount of WETH to mint for admin (default: 100).
    -W, --weth-mint-user    Amount of WETH to mint for user (default: 5.1).
    -m, --mempool           Send transactions to mempool instead of Flashbots.
    -y                      Auto-accept prompts (non-interactive mode).

    (*) passing multiple --X-only params will cause none of them to execute.

Example:
    # default; deploy contracts and bootstrap liquidity
    yarn script.liquid

    # only deploy contracts
    yarn script.liquid --deploy-only

    # enable degen mode
    yarn script.liquid --swap-only -y

    # deploy 4 DAI contracts 
`
    if (process.argv.length > 2) {
        const args = process.argv.slice(2)
        if (args.toString().includes("help")) {
            console.log(helpMessage)
            process.exit(0)
        } 
        if (args.includes("--deploy-only")) {
            shouldBootstrapLiquidity = false
            shouldMintTokens = false
            shouldApproveTokens = false
        }
        if (args.includes("--mint-only")) {
            shouldDeploy = false
            shouldBootstrapLiquidity = false
            shouldApproveTokens = false
        }
        if (args.includes("--bootstrap-only")) {
            shouldDeploy = false
            shouldMintTokens = false
            shouldApproveTokens = false
        }
        if (args.includes("--approve-only")) {
            shouldDeploy = false
            shouldBootstrapLiquidity = false
            shouldMintTokens = false
        }
        if (args.includes("--num-pairs") || args.includes("-p")) {
            numPairs = getOption(args, getFlagIndex(args, "--num-pairs", "-p"), "number") as number
        }
        if (args.includes("--weth-admin") || args.includes("-w")) {
            wethMintAmountAdmin = getOption(args, getFlagIndex(args, "--weth-admin", "-w"), "number") as number
        }
        if (args.includes("--weth-user") || args.includes("-u")) {
            wethMintAmountUser = getOption(args, getFlagIndex(args, "--weth-user", "-u"), "number") as number
        }
        if (args.includes("--mempool") || args.includes("-m")) {
            sendToMempool = true
        }
        if (args.includes("-y")) {
            autoAccept = true
        }
    }
    return {
        shouldApproveTokens,
        shouldDeploy,
        shouldBootstrapLiquidity,
        shouldMintTokens,
        autoAccept,
        numPairs,
        sendToMempool,
        wethMintAmountAdmin,
        wethMintAmountUser,
    }
}
//TODO: use a legit cli parser
const genHelpMessage = (description: string, usage: string, options: string, examples: string) => `\
${description}

${textColors.Underscore}Usage:${textColors.Reset}
${usage}

${textColors.Underscore}Options:${textColors.Reset}
    ${textColors.Bright}--help${textColors.Reset}\t\t\tPrint this help message.
${options}

${textColors.Underscore}Examples:${textColors.Reset}
${examples}
`

export const getSwapdArgs = () => {
    const minUsdFlag = "--min-usd"
    const minUsdShort = "-m"
    const maxUsdFlag = "--max-usd"
    const maxUsdShort = "-M"
    const numSwapsFlag = "--num-swaps"
    const numSwapsShort = "-n"
    const numPairsFlag = "--num-pairs"
    const numPairsShort = "-p"
    const exchangeFlag = "--exchange"
    const exchangeShort = "-e"
    const daiIndexFlag = "--dai-number"
    const daiIndexShort = "-d"
    const swapWethForDaiFlag = "--buy-dai"
    const swapWethForDaiShort = "-b"
    const swapDaiForWethFlag = "--buy-eth"
    const swapDaiForWethShort = "-s"
    const mintWethAmountFlag = "--mint-weth"
    const mintWethAmountShort = "-w"

    const description = "randomly swap on every block with multiple wallets (defined in \`src/output/wallets.json\`)"
    const usage = `\
    yarn swapd <first_wallet_index> [last_wallet_index] [OPTIONS...]
`
    const options = `\
    ${minUsdShort}\t${minUsdFlag}\t\tMinimum amount to spend (USD value in either asset).
    ${maxUsdShort}\t${maxUsdFlag}\t\tMaximum amount to spend (USD value in either asset).
    ${numSwapsShort}\t${numSwapsFlag}\t\tNumber of swaps to execute per wallet.
    ${numPairsShort}\t${numPairsFlag}\t\tNumber of pairs to choose from; one is selected randomly.
    ${exchangeShort}\t${exchangeFlag}\t\tExchange to swap on ("A" or "B").
    ${daiIndexShort}\t${daiIndexFlag}\t\tIndex of deployed DAI token to trade with.
    ${swapWethForDaiShort}\t${swapWethForDaiFlag}\t\tSwaps WETH for DAI if set.
    ${swapDaiForWethShort}\t${swapDaiForWethFlag}\t\tSwaps DAI for WETH if set.
    ${mintWethAmountShort}\t${mintWethAmountFlag}\t\tAmount of WETH to mint from each wallet, if balance is lower than this amount.
`
    const examples = `\
    # run with a single wallet
    yarn swapd 13

    # run with 25 wallets
    yarn swapd 0 25

    # run with 10 wallets, each sending 5 swaps per block
    yarn swapd 10 21 ${numSwapsShort} 5

    # do the same with 5 trading pairs to choose from
    yarn swapd 10 21 ${numSwapsShort} 5 ${numPairsFlag} 5

    # swap with dai token 2 on exchange A
    yarn swapd 13 ${exchangeShort} A -d 2

    # swap up to $5000 worth of ETH into DAI
    yarn swapd 13 ${maxUsdShort} 5000 ${swapWethForDaiFlag}
`
    const helpMessage = genHelpMessage(description, usage, options, examples)
    // TODO: replace these horrible arg parsers
    
    const args = process.argv.slice(2)
    let numSwaps = 1
    let numPairs = 1
    let minUsd = 100
    let maxUsd = 5000
    let exchange = undefined
    let daiIndex = 0
    let swapWethForDai = undefined
    let mintWethAmount = 20
    
    if (args.length > 0) {
        if (args.reduce((prv, crr) => `${prv} ${crr}`).includes("help")) {
            console.log(helpMessage)
            process.exit(0)
        } else {
            if (args.includes(numSwapsFlag) || args.includes(numSwapsShort)) {
                const flagIndex = getFlagIndex(args, numSwapsFlag)
                numSwaps = getOption(args, flagIndex) as number
            }
            if (args.includes(numPairsFlag) || args.includes(numPairsShort)) {
                const flagIndex = getFlagIndex(args, numPairsFlag, numPairsShort)
                numPairs = Math.max(getOption(args, flagIndex) as number, numPairs)
            }
            if (args.includes(minUsdFlag) || args.includes(minUsdShort)) {
                const flagIndex = getFlagIndex(args, minUsdFlag, minUsdShort)
                minUsd = getOption(args, flagIndex) as number
            }
            if (args.includes(maxUsdFlag) || args.includes(maxUsdShort)) {
                const flagIndex = getFlagIndex(args, maxUsdFlag, maxUsdShort)
                maxUsd = getOption(args, flagIndex) as number
            }
            if (args.includes(exchangeFlag) || args.includes(exchangeShort)) {
                const flagIndex = getFlagIndex(args, exchangeFlag, exchangeShort)
                exchange = getOption(args, flagIndex, "string") as string
            }
            if (args.includes(daiIndexFlag) || args.includes(daiIndexShort)) {
                const flagIndex = getFlagIndex(args, daiIndexFlag, daiIndexShort)
                daiIndex = getOption(args, flagIndex, "number") as number
            }
            if (args.includes(swapWethForDaiFlag) || args.includes(swapWethForDaiShort)) {
                const flagIndex = getFlagIndex(args, swapWethForDaiFlag, swapWethForDaiShort)
                swapWethForDai = getOption(args, flagIndex, "boolean") as boolean
            }
            if (args.includes(swapDaiForWethFlag) || args.includes(swapDaiForWethShort)) {
                const flagIndex = getFlagIndex(args, swapDaiForWethFlag, swapDaiForWethShort)
                swapWethForDai = !(getOption(args, flagIndex, "boolean") as boolean)
            }
            if (args.includes(mintWethAmountFlag) || args.includes(mintWethAmountShort)) {
                const flagIndex = getFlagIndex(args, mintWethAmountFlag, mintWethAmountShort)
                mintWethAmount = getOption(args, flagIndex, "number") as number
            }

        }
    } else {
        console.error("one or two wallet indices are required")
        console.log(helpMessage)
        process.exit(1)
    }
    
    let [startIdx, endIdx] = args
    return {
        startIdx: parseInt(startIdx),
        endIdx: (!endIdx || endIdx[0] == '-') ? parseInt(startIdx) + 1 : parseInt(endIdx),
        numSwaps,
        numPairs,
        minUsd,
        maxUsd,
        exchange,
        daiIndex,
        swapWethForDai,
        mintWethAmount: parseEther(mintWethAmount.toString()),
    }
}

// TODO: specify deployment via cli params
export const getArbdArgs = () => {
    const description = "Monitor mempool for arbitrage opportunities, backrun user when profit detected."
    const minProfitFlag = "--min-profit"
    const minProfitShort = "-m"
    const maxProfitFlag = "--max-profit"
    const maxProfitShort = "-M"
    const mintWethAmountFlag = "--mint-weth"
    const mintWethAmountShort = "-w"
    const options = `\
    ${minProfitShort}, ${minProfitFlag}\t\tMinimum profit an arbitrage should achieve, in gwei. (default=100)
    ${maxProfitShort}, ${maxProfitFlag}\t\tMaximum profit an arbitrage should achieve, in gwei. (default=inf)
    ${mintWethAmountShort}\t${mintWethAmountFlag}\t\tAmount of WETH to mint from each wallet, if balance is lower than this amount.
`
    const usage = `\
    yarn swapd <first_wallet_index> [last_wallet_index] [OPTIONS...]
`
    const examples = `\
    # run arb bot with wallet 13
    yarn arbd 13

    # run arb bot with minimum profit threshold of 0.2 ETH
    yarn arbd -m 0.2

    # run arb bot that only executes opportunities that profit between 1 - 10 ETH
    yarn arbd -m 1 -M 10
`
    const helpMessage = genHelpMessage(description, usage, options, examples)

    const args = process.argv.slice(2)
    let minProfit = 100
    let maxProfit = -1 // -1 is interpreted as unlimited
    let mintWethAmount = 20

    if (args.length > 0) {
        if (args.reduce((prv, crr) => `${prv} ${crr}`).includes("help")) {
            console.log(helpMessage)
            process.exit(0)
        } else {
            if (args.includes(minProfitFlag) || args.includes("-m")) {
                const flagIndex = getFlagIndex(args, minProfitFlag, "-m")
                minProfit = getOption(args, flagIndex) as number
            }
            if (args.includes(maxProfitFlag) || args.includes("-M")) {
                const flagIndex = getFlagIndex(args, maxProfitFlag, "-M")
                maxProfit = getOption(args, flagIndex) as number
            }
        }
    } else {
        console.error("one or two wallet indices are required")
        console.log(helpMessage)
        process.exit(1)
    }
    console.log(args)
    let walletIdx = parseInt(args[0])
    return {
        walletIdx,
        minProfit,
        maxProfit,
    }
}

export const getFundWalletsArgs = () => {
    const description = "Fund wallets with ETH."
    const usage = `\
    yarn script.fundWallets [OPTIONS]
`
    const ethFlag = "--eth"
    const ethShort = "-e"
    const options = `\
    ${ethShort}, ${ethFlag}\t\t\tAmount of ETH to send to each wallet. (default=50)
`
    const examples = `\
    # fund wallets with 50 ETH each (default)
    yarn script.fundWallets

    # fund wallets with 1 ETH
    yarn script.fundWallets -e 1
`
    const helpMessage = genHelpMessage(description, usage, options, examples)
    let eth: number | undefined = 50

    const args = process.argv.slice(2)
    if (args.length > 0) {
        if (args.reduce((prv, crr) => `${prv} ${crr}`).includes("help")) {
            console.log(helpMessage)
            process.exit(0)
        }
    }
    
    if (args.includes(ethFlag) || args.includes(ethShort)) {
        const ethFlagIndex = getFlagIndex(args, ethFlag, ethShort)
        eth = getOption(args, ethFlagIndex, "number") as number
    }
    return {
        eth,
    }
}
