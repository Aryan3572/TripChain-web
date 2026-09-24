// frontend/src/context/Web3Context.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { ethers } from "ethers";
import confetti from "canvas-confetti";
import contractsData from "../contracts/contracts.json";
import Web3WalletModal from "../components/Web3WalletModal";

const Web3Context = createContext(null);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [tripBalance, setTripBalance] = useState("0");
  const [rewardStats, setRewardStats] = useState(null);
  const [txPending, setTxPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const contractAddresses = useMemo(() => contractsData?.addresses || {}, []);

  // Fetch on-chain $TRIP token balance safely without throwing
  const refreshBalance = useCallback(
    async (currentAccount, currentProvider) => {
      const acc = currentAccount || account;
      const prov = currentProvider || provider;
      if (!acc || !prov || !contractAddresses.TripToken) return;

      try {
        const net = await prov.getNetwork().catch(() => null);
        if (!net) return;

        // If user's wallet is on a different network (e.g. Ethereum Mainnet instead of localhost/Amoy),
        // avoid querying non-existent contract to prevent call exception loops
        const targetChainId = Number(contractAddresses.chainId || 31337);
        if (Number(net.chainId) !== targetChainId && Number(net.chainId) !== 80002) {
          setTripBalance("0.00");
          return;
        }

        const tokenContract = new ethers.Contract(
          contractAddresses.TripToken,
          contractsData.TripTokenAbi,
          prov
        );
        const rawBalance = await tokenContract.balanceOf(acc);
        const formatted = ethers.formatEther(rawBalance);
        setTripBalance(parseFloat(formatted).toFixed(2));
      } catch (err) {
        // Silently default to 0.00 if contract call fails
        setTripBalance("0.00");
      }
    },
    [account, provider, contractAddresses]
  );

  // Fetch pending off-chain reward stats from backend
  const fetchRewardStats = useCallback(async () => {
    const token = localStorage.getItem("tripchain_token");
    if (!token) return;

    try {
      const apiBase = process.env.REACT_APP_API_BASE || "http://localhost:5000";
      const res = await fetch(`${apiBase}/api/web3/rewards/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRewardStats(data);
      }
    } catch (err) {
      // Silently ignore background stats error
    }
  }, []);

  // Connect Real Wallet (MetaMask)
  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setShowWalletModal(true);
      return null;
    }

    setIsConnecting(true);
    setStatusMessage("Connecting to Web3 wallet...");
    try {
      const p = new ethers.BrowserProvider(window.ethereum);
      const accounts = await p.send("eth_requestAccounts", []);
      const net = await p.getNetwork();
      const s = await p.getSigner();

      const selectedAccount = accounts[0];
      setProvider(p);
      setSigner(s);
      setAccount(selectedAccount);
      setChainId(Number(net.chainId));
      setIsDemoMode(false);
      setShowWalletModal(false);

      localStorage.setItem("tripchain_wallet_connected", "true");
      await refreshBalance(selectedAccount, p);
      setStatusMessage("");
      return { account: selectedAccount, signer: s, chainId: Number(net.chainId) };
    } catch (err) {
      console.warn("connectWallet cancelled or failed:", err.message);
      setStatusMessage("");
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [refreshBalance]);

  // Connect Demo Sandbox Wallet
  const connectDemoWallet = useCallback(() => {
    const demoAccount = "0x71C8F39a2B343940129F0b070D3094892c90Demo";
    setAccount(demoAccount);
    setIsDemoMode(true);
    setTripBalance("150.00");
    setChainId(31337);
    setShowWalletModal(false);
    localStorage.setItem("tripchain_wallet_connected", "demo");
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    setStatusMessage("");
  }, []);

  // Switch MetaMask Network to Hardhat Localhost (Chain 31337)
  const switchNetworkToLocalhost = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return false;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x7a69" }], // 31337 in hex
      });
      setChainId(31337);
      return true;
    } catch (switchError) {
      if (switchError.code === 4902 || switchError.message?.includes("4902")) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x7a69",
                chainName: "Hardhat Localhost",
                rpcUrls: ["http://127.0.0.1:8545"],
                nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
              },
            ],
          });
          setChainId(31337);
          return true;
        } catch (addError) {
          console.warn("Could not add Hardhat network:", addError);
          return false;
        }
      }
      return false;
    }
  }, []);

  // Disconnect
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setTripBalance("0");
    setIsDemoMode(false);
    localStorage.removeItem("tripchain_wallet_connected");
  }, []);

  // Sign In with Ethereum (SIWE)
  const loginWithWallet = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setShowWalletModal(true);
      return { success: false, error: "Please install MetaMask or try Demo Mode" };
    }

    setIsConnecting(true);
    setStatusMessage("Connecting to Web3 wallet...");
    try {
      const p = new ethers.BrowserProvider(window.ethereum);
      const accounts = await p.send("eth_requestAccounts", []);
      const net = await p.getNetwork();
      const s = await p.getSigner();

      const activeAccount = accounts[0];
      setProvider(p);
      setSigner(s);
      setAccount(activeAccount);
      setChainId(Number(net.chainId));
      setIsDemoMode(false);
      localStorage.setItem("tripchain_wallet_connected", "true");

      const apiBase = process.env.REACT_APP_API_BASE || "http://localhost:5000";

      // 1. Get nonce from backend
      setStatusMessage("Requesting challenge nonce...");
      const nonceRes = await fetch(`${apiBase}/api/web3/nonce?address=${activeAccount}`);
      const { nonce } = await nonceRes.json();

      // 2. Build SIWE message
      const domain = window.location.host;
      const origin = window.location.origin;
      const statement = "Sign in to Tripchain to access decentralized eco-rewards and on-chain badges.";

      const message = `${domain} wants you to sign in with your Ethereum account:
${activeAccount}

${statement}

URI: ${origin}
Version: 1
Chain ID: ${net.chainId}
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;

      // 3. User signs message in MetaMask
      setStatusMessage("Please sign the message in MetaMask...");
      const signature = await s.signMessage(message);

      // 4. Send to backend for verification & JWT issuance
      setStatusMessage("Verifying signature with Tripchain Oracle...");
      const verifyRes = await fetch(`${apiBase}/api/web3/verify-wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.message || "Wallet authentication failed");
      }

      localStorage.setItem("tripchain_token", verifyData.token);
      localStorage.setItem("tripchain_userEmail", verifyData.user.email);
      localStorage.setItem("tripchain_userName", verifyData.user.name);

      setStatusMessage("");
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      return { success: true, user: verifyData.user };
    } catch (err) {
      console.warn("loginWithWallet error:", err);
      setStatusMessage("");
      return { success: false, error: err.message };
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Sign In with Demo Sandbox Account (1-click without MetaMask)
  const loginWithDemo = useCallback(async () => {
    setIsConnecting(true);
    setStatusMessage("Activating Demo Sandbox session...");
    try {
      const apiBase = process.env.REACT_APP_API_BASE || "http://localhost:5000";
      let userData = {
        name: "Demo Sandbox Pilot",
        email: "demo.pilot@tripchain.eth",
        walletAddress: "0x71C8F39a2B343940129F0b070D3094892c90Demo",
      };

      try {
        const res = await fetch(`${apiBase}/api/web3/demo-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            localStorage.setItem("tripchain_token", data.token);
            userData = data.user || userData;
          }
        }
      } catch (e) {
        console.warn("Backend demo-login endpoint not reachable, running client-side demo mode", e);
        if (!localStorage.getItem("tripchain_token")) {
          localStorage.setItem("tripchain_token", "demo_sandbox_jwt_token");
        }
      }

      localStorage.setItem("tripchain_userEmail", userData.email);
      localStorage.setItem("tripchain_userName", userData.name);

      // Connect demo wallet in context
      connectDemoWallet();
      setStatusMessage("");
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      return { success: true, user: userData };
    } catch (err) {
      console.warn("loginWithDemo error:", err);
      setStatusMessage("");
      return { success: false, error: err.message };
    } finally {
      setIsConnecting(false);
    }
  }, [connectDemoWallet]);

  // Claim $TRIP Tokens
  const claimRewards = useCallback(async () => {
    if (!account) {
      setShowWalletModal(true);
      return;
    }

    setTxPending(true);
    setStatusMessage("Requesting signed reward voucher from Tripchain backend...");

    try {
      const token = localStorage.getItem("tripchain_token");
      const apiBase = process.env.REACT_APP_API_BASE || "http://localhost:5000";

      if (isDemoMode) {
        setStatusMessage("Confirming claim in Demo Sandbox...");
        await new Promise((r) => setTimeout(r, 800));
        const amountToAdd = rewardStats?.pendingClaimableTrip || 50;
        setTripBalance((prev) => (parseFloat(prev) + parseFloat(amountToAdd)).toFixed(2));
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        setStatusMessage("");
        return { success: true, amount: amountToAdd };
      }

      const res = await fetch(`${apiBase}/api/web3/rewards/claim-voucher`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ walletAddress: account }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to generate reward voucher");
      }

      const { voucher, claimId } = data;

      if (!isDemoMode && chainId && chainId !== 31337) {
        const switched = await switchNetworkToLocalhost();
        if (!switched) {
          alert("⚠️ Your MetaMask is on an external network (Chain ID: " + chainId + ").\n\nPlease switch to Hardhat Localhost (Chain 31337), or click 'Use Demo Sandbox' in the top bar to test immediately without gas fees or warnings!");
          return { success: false, error: "Wrong network" };
        }
      }

      setStatusMessage("Please confirm the $TRIP claim in MetaMask...");
      const tokenContract = new ethers.Contract(
        contractAddresses.TripToken,
        contractsData.TripTokenAbi,
        signer
      );

      const tx = await tokenContract.claimRewardWithSignature(
        voucher.amount,
        voucher.nonce,
        voucher.deadline,
        voucher.signature
      );

      setStatusMessage("Transaction submitted! Waiting for block confirmation...");
      const receipt = await tx.wait();

      await fetch(`${apiBase}/api/web3/rewards/claim-success`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ claimId, txHash: receipt.hash }),
      });

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      await refreshBalance(account, provider);
      await fetchRewardStats();

      setStatusMessage("");
      return { success: true, txHash: receipt.hash, amount: voucher.amountFormatted };
    } catch (err) {
      console.warn("claimRewards error:", err);
      setStatusMessage("");
      alert(err.message || "Failed to claim rewards on-chain");
      return { success: false, error: err.message };
    } finally {
      setTxPending(false);
    }
  }, [
    account,
    chainId,
    switchNetworkToLocalhost,
    signer,
    provider,
    isDemoMode,
    rewardStats,
    contractAddresses.TripToken,
    refreshBalance,
    fetchRewardStats,
  ]);

  // Mint Achievement Badge NFT
  const mintBadgeNft = useCallback(
    async (badgeId) => {
      if (!account) {
        setShowWalletModal(true);
        return;
      }

      setTxPending(true);
      setStatusMessage("Requesting NFT badge mint voucher from backend...");

      try {
        const token = localStorage.getItem("tripchain_token");
        const apiBase = process.env.REACT_APP_API_BASE || "http://localhost:5000";

        if (isDemoMode) {
          setStatusMessage("Minting Soulbound NFT in Demo Sandbox...");
          await new Promise((r) => setTimeout(r, 900));
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
          setStatusMessage("");
          return { success: true, txHash: "0xdemo_tx_badge_minted_sandbox" };
        }

        const res = await fetch(`${apiBase}/api/web3/badges/claim-voucher`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ badgeId, walletAddress: account }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to generate badge voucher");
        }

        const { voucher } = data;

        if (!isDemoMode && chainId && chainId !== 31337) {
          const switched = await switchNetworkToLocalhost();
          if (!switched) {
            alert("⚠️ Your MetaMask is on an external network (Chain ID: " + chainId + ").\n\nPlease switch to Hardhat Localhost (Chain 31337), or click 'Use Demo Sandbox' in the top bar to test immediately without gas fees or warnings!");
            return { success: false, error: "Wrong network" };
          }
        }

        setStatusMessage("Please confirm minting your NFT Badge in MetaMask...");
        const badgeContract = new ethers.Contract(
          contractAddresses.TripBadgeNFT,
          contractsData.TripBadgeNFTAbi,
          signer
        );

        const tx = await badgeContract.mintBadgeWithSignature(
          voucher.badgeId,
          voucher.uri,
          voucher.nonce,
          voucher.deadline,
          voucher.signature
        );

        setStatusMessage("Minting on-chain... Waiting for block confirmation...");
        const receipt = await tx.wait();

        await fetch(`${apiBase}/api/web3/badges/claim-success`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            badgeId,
            tokenId: 1,
            txHash: receipt.hash,
          }),
        });

        confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
        setStatusMessage("");
        return { success: true, txHash: receipt.hash };
      } catch (err) {
        console.warn("mintBadgeNft error:", err);
        setStatusMessage("");
        alert(err.message || "Failed to mint NFT badge");
        return { success: false, error: err.message };
      } finally {
        setTxPending(false);
      }
    },
    [
      account,
      chainId,
      switchNetworkToLocalhost,
      signer,
      isDemoMode,
      contractAddresses.TripBadgeNFT,
    ]
  );

  // Burn $TRIP to Offset Carbon
  const offsetCarbon = useCallback(
    async ({ tripAmount, co2Kg, category, memo }) => {
      if (!account) {
        setShowWalletModal(true);
        return;
      }

      setTxPending(true);
      setStatusMessage("Preparing Carbon Offset transaction...");

      try {
        const token = localStorage.getItem("tripchain_token");
        const apiBase = process.env.REACT_APP_API_BASE || "http://localhost:5000";

        if (isDemoMode) {
          setStatusMessage("Retiring tokens & generating certificate in Demo Sandbox...");
          await new Promise((r) => setTimeout(r, 900));
          setTripBalance((prev) => Math.max(0, parseFloat(prev) - parseFloat(tripAmount)).toFixed(2));

          const certId = Date.now();
          if (token) {
            await fetch(`${apiBase}/api/web3/offsets/record`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                tokensBurned: tripAmount,
                co2OffsetKg: co2Kg,
                certificateId: certId,
                txHash: "0xdemo_offset_tx_confirmed",
              }),
            });
          }

          confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } });
          setStatusMessage("");
          return { success: true, txHash: "0xdemo_offset_tx_confirmed", certificateId: certId };
        }

        if (!isDemoMode && chainId && chainId !== 31337) {
          const switched = await switchNetworkToLocalhost();
          if (!switched) {
            alert("⚠️ Your MetaMask is on an external network (Chain ID: " + chainId + ").\n\nPlease switch to Hardhat Localhost (Chain 31337), or click 'Use Demo Sandbox' in the top bar to test immediately without gas fees or warnings!");
            return { success: false, error: "Wrong network" };
          }
        }

        const tripToken = new ethers.Contract(
          contractAddresses.TripToken,
          contractsData.TripTokenAbi,
          signer
        );

        const offsetContract = new ethers.Contract(
          contractAddresses.CarbonOffsetRegistry,
          contractsData.CarbonOffsetRegistryAbi,
          signer
        );

        const amountWei = ethers.parseEther(tripAmount.toString());
        const co2Grams = Math.round(co2Kg * 1000);

        setStatusMessage("Step 1/2: Approving $TRIP tokens for retirement...");
        const approveTx = await tripToken.approve(
          contractAddresses.CarbonOffsetRegistry,
          amountWei
        );
        await approveTx.wait();

        setStatusMessage("Step 2/2: Retiring tokens and issuing on-chain CO2 certificate...");
        const retireTx = await offsetContract.retireAndOffset(
          amountWei,
          co2Grams,
          category || "Eco-Mobility Reforestation",
          memo || "Tripchain Carbon Neutrality"
        );
        const receipt = await retireTx.wait();

        const certId = Date.now();

        await fetch(`${apiBase}/api/web3/offsets/record`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tokensBurned: tripAmount,
            co2OffsetKg: co2Kg,
            certificateId: certId,
            txHash: receipt.hash,
          }),
        });

        confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } });
        await refreshBalance(account, provider);
        setStatusMessage("");
        return { success: true, txHash: receipt.hash, certificateId: certId };
      } catch (err) {
        console.warn("offsetCarbon error:", err);
        setStatusMessage("");
        alert(err.message || "Failed to complete carbon offset");
        return { success: false, error: err.message };
      } finally {
        setTxPending(false);
      }
    },
    [
      account,
      chainId,
      switchNetworkToLocalhost,
      signer,
      provider,
      isDemoMode,
      contractAddresses,
      refreshBalance,
    ]
  );

  // Stable references for listeners
  const refreshBalanceRef = useRef(refreshBalance);
  refreshBalanceRef.current = refreshBalance;
  const disconnectWalletRef = useRef(disconnectWallet);
  disconnectWalletRef.current = disconnectWallet;

  // Single mount effect: check for existing connection safely
  useEffect(() => {
    if (typeof window === "undefined") return;

    const wasConnected = localStorage.getItem("tripchain_wallet_connected");
    if (wasConnected === "demo") {
      setAccount("0x71C8F39a2B343940129F0b070D3094892c90Demo");
      setIsDemoMode(true);
      setTripBalance("150.00");
      setChainId(31337);
      return;
    }

    if (wasConnected && window.ethereum) {
      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);
      p.listAccounts()
        .then(async (accounts) => {
          if (accounts && accounts.length > 0) {
            const selectedAccount = accounts[0].address;
            const net = await p.getNetwork().catch(() => null);
            const s = await p.getSigner().catch(() => null);
            setAccount(selectedAccount);
            setSigner(s);
            if (net) setChainId(Number(net.chainId));
            refreshBalanceRef.current(selectedAccount, p);
          }
        })
        .catch(() => {});
    }
  }, []); // Strictly empty array: runs ONCE on mount

  // Single mount effect: attach MetaMask event listeners safely
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        refreshBalanceRef.current(accounts[0]);
      } else {
        disconnectWalletRef.current();
      }
    };

    const handleChainChanged = (cId) => {
      setChainId(parseInt(cId, 16));
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []); // Strictly empty array: listeners attached once

  // Fetch rewards when account changes (or on login)
  useEffect(() => {
    fetchRewardStats();
  }, [fetchRewardStats, account]);

  const value = {
    account,
    chainId,
    provider,
    signer,
    isConnected: !!account,
    isConnecting,
    isDemoMode,
    tripBalance,
    rewardStats,
    txPending,
    statusMessage,
    contractAddresses,
    connectWallet,
    connectDemoWallet,
    disconnectWallet,
    switchNetworkToLocalhost,
    loginWithWallet,
    loginWithDemo,
    claimRewards,
    mintBadgeNft,
    offsetCarbon,
    refreshBalance,
    fetchRewardStats,
    openWalletModal: () => setShowWalletModal(true),
    closeWalletModal: () => setShowWalletModal(false),
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
      <Web3WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnectReal={connectWallet}
        onConnectDemo={connectDemoWallet}
        isConnecting={isConnecting}
      />
    </Web3Context.Provider>
  );
};
