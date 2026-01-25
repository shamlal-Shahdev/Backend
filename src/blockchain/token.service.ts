// src/blockchain/token.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

const WATTSUP_TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function mint(address to, uint256 amount)',
];

@Injectable()
export class TokenService {
  private readonly provider: ethers.JsonRpcProvider;
  private readonly signer: ethers.Wallet;
  private readonly token: ethers.Contract;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('HARDHAT_RPC_URL');
    const tokenAddress = this.configService.get<string>('TOKEN_ADDRESS');
    const treasuryPk = this.configService.get<string>('TREASURY_PRIVATE_KEY');

    if (!rpcUrl || !tokenAddress || !treasuryPk) {
      throw new Error(
        'Blockchain env vars (HARDHAT_RPC_URL, TOKEN_ADDRESS, TREASURY_PRIVATE_KEY) are required',
      );
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(treasuryPk, this.provider);
    this.token = new ethers.Contract(
      tokenAddress,
      WATTSUP_TOKEN_ABI,
      this.signer,
    );
  }

  async getTokenInfo() {
    const [name, symbol, decimalsRaw, totalSupplyRaw] = await Promise.all([
      this.token.name(),
      this.token.symbol(),
      this.token.decimals(),
      this.token.totalSupply(),
    ]);

    const treasuryAddress = await this.signer.getAddress();
    const tokenAddress = await this.token.getAddress();

    // Force everything to JSON-safe primitives
    const decimals = Number(decimalsRaw);
    const totalSupply = totalSupplyRaw.toString();

    return {
      name: String(name),
      symbol: String(symbol),
      decimals,
      totalSupply,
      tokenAddress: String(tokenAddress),
      treasuryAddress: String(treasuryAddress),
    };
  }

  async getTreasuryBalance() {
    const treasuryAddress = await this.signer.getAddress();
    const balanceRaw = await this.token.balanceOf(treasuryAddress);
    const decimalsRaw = await this.token.decimals();

    const decimals = Number(decimalsRaw);
    const raw = balanceRaw.toString();
    const formatted = ethers.formatUnits(balanceRaw, decimals);

    return {
      address: String(treasuryAddress),
      raw,
      formatted,
      decimals,
    };
  }

  async mintTo(
    to: string,
    rewardAmount: number,
  ): Promise<{ txHash: string; blockNumber: number }> {
    const decimalsRaw = await this.token.decimals();
    const decimals = Number(decimalsRaw);

    // Convert human amount (e.g. 100) → token units
    const amount = ethers.parseUnits(rewardAmount.toString(), decimals);

    const tx = await this.token.mint(to, amount);
    const receipt = await tx.wait();

    // Make sure everything is JSON safe
    return {
      txHash: String(tx.hash),
      blockNumber: Number(receipt.blockNumber),
    };
  }

  async getUserBalance(walletAddress: string) {
    if (!walletAddress) {
      return {
        address: null,
        raw: '0',
        formatted: '0',
        decimals: 18,
      };
    }

    const balanceRaw = await this.token.balanceOf(walletAddress);
    const decimalsRaw = await this.token.decimals();

    const decimals = Number(decimalsRaw);
    const raw = balanceRaw.toString();
    const formatted = ethers.formatUnits(balanceRaw, decimals);

    return {
      address: String(walletAddress),
      raw,
      formatted,
      decimals,
    };
  }
}