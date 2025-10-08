/**
 * Build-time data generation script
 * This script fetches contract addresses and system parameters at build time
 * and saves them to public/build-data.json for runtime use
 */

import { fetchBuildTimeData } from '../src/lib/buildTimeData';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function main() {
  try {
    // Fetch data from contracts
    const data = await fetchBuildTimeData();
    
    // Write to public directory
    const outputPath = join(process.cwd(), 'public', 'build-data.json');
    writeFileSync(outputPath, JSON.stringify(data, null, 2));
    
    console.log('✅ Build-time contract data generated successfully!');
    console.log('📄 Saved to:', outputPath);
    console.log('📊 Contract Addresses:');
    console.log('   Assistant:', data.contractAddresses.assistant);
    console.log('   Vault:', data.contractAddresses.vault);
    console.log('   SIR:', data.contractAddresses.sir);
    console.log('   Oracle:', data.contractAddresses.oracle);
    console.log('   System Control:', data.contractAddresses.systemControl);
    console.log('   Uniswap V3 Staker:', data.contractAddresses.uniswapV3Staker);
    console.log('   NFT Position Manager:', data.contractAddresses.nftPositionManager);
    console.log('   SIR/WETH 1% Pool:', data.contractAddresses.sirWethPool1Percent);
    console.log('⚙️  System Parameters:');
    console.log('   Base Fee:', `${(data.systemParams.baseFee * 100).toFixed(2)}%`);
    
  } catch (error) {
    console.error('❌ Failed to generate build-time data:', error);
    process.exit(1);
  }
}

// Run the script
void main();
