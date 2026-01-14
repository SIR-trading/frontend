/**
 * Build-time data generation script
 * This script fetches contract addresses and system parameters at build time
 * and saves them to public/build-data.json for runtime use
 */

import { fetchBuildTimeData, validateIncentives } from '../src/lib/buildTimeData';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { getChainIncentiveConfigs } from '../src/data/uniswapIncentives';
import type { Address } from 'viem';

async function main() {
  try {
    // Fetch data from contracts
    const data = await fetchBuildTimeData();

    console.log('✅ Build-time contract data generated successfully!');
    console.log('📊 Contract Addresses:');
    console.log('   Assistant:', data.contractAddresses.assistant);
    console.log('   Vault:', data.contractAddresses.vault);
    console.log('   SIR:', data.contractAddresses.sir);
    console.log('   Oracle:', data.contractAddresses.oracle);
    console.log('   System Control:', data.contractAddresses.systemControl);
    console.log('   System Control Owner:', data.contractAddresses.systemControlOwner);
    console.log('   Uniswap V3 Staker:', data.contractAddresses.uniswapV3Staker);
    console.log('   NFT Position Manager:', data.contractAddresses.nftPositionManager);
    console.log('   SIR/WETH 1% Pool:', data.contractAddresses.sirWethPool1Percent);
    console.log('   Contributors:', data.contractAddresses.contributors);
    console.log('⚙️  System Parameters:');
    console.log('   Base Fee:', `${(data.systemParams.baseFee * 100).toFixed(2)}%`);
    console.log('   LP Fee:', `${(data.systemParams.lpFee * 100).toFixed(2)}%`);
    if (data.systemParams.lpLockTime !== undefined) {
      console.log('   LP Lock Time:', `${data.systemParams.lpLockTime} seconds (${(data.systemParams.lpLockTime / 86400).toFixed(1)} days)`);
    } else {
      console.log('   LP Lock Time: Not supported on this chain');
    }
    console.log('   Timestamp Issuance Start:', `${data.timestampIssuanceStart} (${new Date(data.timestampIssuanceStart * 1000).toISOString()})`);

    if (data.contributorConstants) {
      console.log('📈 Contributor Constants (HyperEVM):');
      console.log('   Issuance Rate:', data.contributorConstants.issuanceRate.toString());
      console.log('   LP Issuance (First 3 Years):', data.contributorConstants.lpIssuanceFirst3Years.toString());
    } else {
      console.log('⏭️  Contributor Constants: Not applicable (non-HyperEVM chain)');
    }
    console.log('');

    // Validate incentives exist on-chain
    const incentiveConfigs = getChainIncentiveConfigs();

    // Add rewardToken and pool from build-data to each incentive config
    const incentives: Array<{
      rewardToken: Address;
      pool: Address;
      startTime: bigint;
      endTime: bigint;
      refundee: Address;
    }> = incentiveConfigs.map(config => ({
      rewardToken: data.contractAddresses.sir,
      pool: data.contractAddresses.sirWethPool1Percent,
      startTime: config.startTime,
      endTime: config.endTime,
      refundee: config.refundee,
    }));

    await validateIncentives(
      incentives,
      data.contractAddresses.uniswapV3Staker
    );

    // Write to public directory only if validation passes
    const outputPath = join(process.cwd(), 'public', 'build-data.json');
    writeFileSync(outputPath, JSON.stringify(data, null, 2));

    console.log('📄 Saved to:', outputPath);

  } catch (error) {
    console.error('❌ Failed to generate build-time data:', error);
    process.exit(1);
  }
}

// Run the script
void main();
