import { Injectable, Logger, OnModuleInit, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { UserWalletService } from '../user-wallet/user-wallet.service';
import { WalletService } from './wallet.service';
const WATTSUP_TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function mint(address to, uint256 amount)',
  'function transfer(address to, uint256 amount) returns (bool)',
];
@Injectable()
export class TokenService implements OnModuleInit {
  private readonly logger = new Logger(TokenService.name);
  private readonly provider: ethers.JsonRpcProvider;
  private readonly signer: ethers.Wallet;
  private readonly token: ethers.Contract;
  private readonly rpcUrl: string;
  private readonly tokenAddress: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly userWalletService: UserWalletService,
    private readonly walletService: WalletService,
  ) {
    const rpcUrl = this.configService.get<string>('HARDHAT_RPC_URL');
    const tokenAddress = this.configService.get<string>('TOKEN_ADDRESS');
    const treasuryPk = this.configService.get<string>('TREASURY_PRIVATE_KEY');
    if (!rpcUrl || !tokenAddress || !treasuryPk) {
      throw new Error(
        'Blockchain env vars (HARDHAT_RPC_URL, TOKEN_ADDRESS, TREASURY_PRIVATE_KEY) are required',
      );
    }
    this.rpcUrl = rpcUrl;
    this.tokenAddress = tokenAddress;
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(treasuryPk, this.provider);
    this.token = new ethers.Contract(
      tokenAddress,
      WATTSUP_TOKEN_ABI,
      this.signer,
    );
  }

  async onModuleInit(): Promise<void> {
    try {
      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);
      const latestBlock = await this.provider.getBlockNumber();
      const code = await this.provider.getCode(this.tokenAddress);
      const hasCode = code !== '0x';
      const signerAddress = await this.signer.getAddress();
      let decimals: number | null = null;
      let decimalsError: string | null = null;

      try {
        const decimalsRaw = await this.token.decimals();
        decimals = Number(decimalsRaw);
      } catch (error) {
        decimalsError = error instanceof Error ? error.message : String(error);
      }

      this.logger.log(
        `Blockchain health-check: rpc=${this.rpcUrl} chain=${network.name} chainId=${chainId} block=${latestBlock} token=${this.tokenAddress} hasCode=${hasCode} codeSize=${code.length} decimals=${
          decimals ?? 'n/a'
        } signer=${signerAddress}`,
      );
      if (decimalsError) {
        this.logger.error(
          `Token decimals() check failed for ${this.tokenAddress}: ${decimalsError}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Blockchain health-check failed: rpc=${this.rpcUrl} token=${this.tokenAddress} error=${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
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
    const amount = ethers.parseUnits(rewardAmount.toString(), decimals);
    const tx = await this.token.mint(to, amount);
    const receipt = await tx.wait();
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

  private async ensureGasForAddress(address: string): Promise<void> {
    const balance = await this.provider.getBalance(address);
    const minGas = ethers.parseEther('0.01');
    if (balance < minGas) {
      this.logger.log(`Funding gas for ${address}`);
      const tx = await this.signer.sendTransaction({
        to: address,
        value: ethers.parseEther('0.1'),
      });
      await tx.wait();
    }
  }

  async transferFromUser(
    fromUserId: number,
    toAddress: string,
    amount: number,
  ): Promise<{ txHash: string; blockNumber: number }> {
    const walletEntity =
      await this.userWalletService.findByUserIdWithPrivateKey(fromUserId);
    if (!walletEntity?.encryptedPrivateKey) {
      throw new BadRequestException(
        `No on-chain wallet found for user ${fromUserId}. Complete KYC to receive a wallet.`,
      );
    }

    const fromAddress = walletEntity.address;
    await this.ensureGasForAddress(fromAddress);

    const onChainBalance = await this.getUserBalance(fromAddress);
    if (parseFloat(onChainBalance.formatted) < amount) {
      throw new BadRequestException(
        'Insufficient WATT tokens for this purchase. Open Wallet and sync your balance, or earn more tokens first.',
      );
    }

    const privateKey = this.walletService.decryptPrivateKey(
      walletEntity.encryptedPrivateKey,
    );
    const userSigner = new ethers.Wallet(privateKey, this.provider);
    const decimals = Number(await this.token.decimals());
    const tokenAmount = ethers.parseUnits(amount.toString(), decimals);
    const tokenWithUserSigner = this.token.connect(userSigner) as ethers.Contract;

    this.logger.log(
      `Transferring ${amount} WATT from user ${fromUserId} (${fromAddress}) to ${toAddress}`,
    );

    const tx = await tokenWithUserSigner.transfer(toAddress, tokenAmount);
    const receipt = await tx.wait();

    this.logger.log(
      `Transfer confirmed: tx=${tx.hash} block=${receipt.blockNumber}`,
    );

    return {
      txHash: String(tx.hash),
      blockNumber: Number(receipt.blockNumber),
    };
  }
}
