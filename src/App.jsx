import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/WavePortal.json';

const App = () => {
	const [currentAccount, setCurrentAccount] = useState("");

	const [message, setMessage] = useState("");
	const [allWaves, setAllWaves] = useState([]);

	const contractAddress = "0x1fb2bbD9C38Ada3B41F78Ed0c2aeb3e3d3b601F2";

	const contractABI = abi.abi;

	const checkIfWalletIsConnected = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				console.log("Make sure you have metamask!");
				return;
			} else {
				console.log("We have the ethereum object", ethereum);
			}

			const accounts = await ethereum.request({ method: 'eth_accounts' });

			if (accounts.length !== 0) {
				const account = accounts[0];
				console.log("Found an authorized account:", account);
				setCurrentAccount(account)
				getAllWaves();
			} else {
				console.log("No authorized account found")
			}
		} catch (error) {
			console.log(error);
		}
	}

	const connectWallet = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				alert("Get MetaMask!");
				return;
			}

			const accounts = await ethereum.request({ method: "eth_requestAccounts" });

			console.log("Connected", accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error)
		}
	}

	const getAllWaves = async () => {
		const { ethereum } = window;

		try {
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
				const waves = await wavePortalContract.getAllWaves();

				const wavesCleaned = waves.map(wave => {
					return {
						address: wave.waver,
						timestamp: new Date(wave.timestamp * 1000),
						message: wave.message,
					};
				});

				setAllWaves(wavesCleaned);
			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.log(error);
		}
	};

	useEffect(() => {
		checkIfWalletIsConnected();

		let wavePortalContract;

		const onNewWave = (from, timestamp, message) => {
			console.log("NewWave", from, timestamp, message);
			setAllWaves(prevState => [
				...prevState,
				{
					address: from,
					timestamp: new Date(timestamp * 1000),
					message: message,
				},
			]);
		};

		if (window.ethereum) {
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			const signer = provider.getSigner();

			wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
			wavePortalContract.on("NewWave", onNewWave);
		}

		return () => {
			if (wavePortalContract) {
				wavePortalContract.off("NewWave", onNewWave);
			}
		};
	}, []);


	const wave = async () => {
		if (!currentAccount) {
			alert("Connect your MetaMask wallet to continue!");
			return;
		}

		if (!message) {
			alert("Enter message to continue!");
			return;
		}

		try {
			const { ethereum } = window;

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

				let count = await wavePortalContract.getTotalWaves();
				console.log("Retrieved total wave count...", count.toNumber());

				const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 });
				console.log("Mining...", waveTxn.hash);

				await waveTxn.wait();
				console.log("Mined -- ", waveTxn.hash);
				setMessage("");

				count = await wavePortalContract.getTotalWaves();
				console.log("Retrieved total wave count...", count.toNumber());
			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.log(error)
		}
	}

	return (
		<div className="mainContainer">

			<div className="dataContainer">
				<div className="header">
					👋 Hello Fren! 👋
        </div>

				<div>
					<p className="bio">
						<span>
							I'm a developer and technical writer.
						</span>
						<br></br><br></br>
						<span>
							When I'm not busy:
						</span>
						<br></br>
						<span>
							• programming
						</span>
						<br></br>
						<span>
							• documenting Blockchain software, and
						</span><br></br>
						<span>
							• saving the world from centralization...
						</span>
						<br></br><br></br>
						<span>
							I enjoy creating music 🎶
						</span>
						<br></br>
						<span>
							and exploring the latest tech trends 🔍
						</span>
					</p>
					<div id="footer">


						<input label="Message" placeholder="Send a Message with your wave!" value={message} onChange={e => setMessage(e.target.value)} className={message ? "validInput" : ""} />

						<button className="waveButton" onClick={wave}>
							Wave at Me
						</button>

						{!currentAccount && (
							<button className="waveButton" onClick={connectWallet}>
								Connect Wallet
						</button>
						)}

						{allWaves.map((wave, index) => {
							return (
								<div key={index} style={{
									border: "2px solid black",
									marginTop: "16px",
									marginBottom: "16px",
									padding: "8px",
									maxWidth: "720px",
									borderRadius: "5px",
									position: "relative",
									display: "flex",
									justifyContent: "center",
									textAlign: "left",
									width: "150%",
									right: "25%",
									fontSize: "10px"
								}}>
									<div>
										<div>
											<u><b>Address:</b></u> {wave.address}
										</div>
										<div>
											<u><b>Time:</b></u> {wave.timestamp.toString()}
										</div>
										<div>
											<u><b>Message:</b></u> {wave.message ? wave.message : "*NO Message FOUND!*"}
										</div>
									</div>
								</div>)
						})}
					</div>
				</div>
			</div>
		</div>
	);
}

export default App
