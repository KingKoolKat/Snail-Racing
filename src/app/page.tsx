'use client';

import { useState } from 'react';
import { auth, db } from '../firebase';
import { useEffect } from 'react';
import React from 'react';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';


export default function Home() {
  
  const snails = ['Bluey', 'Gary', 'Turbo', 'Slick'];
  const startingBalance = 1000;

  const initialMarketBets = {
    Bluey: 200,
    Gary: 500,
    Turbo: 300,
    Slick: 100,
  };

  const [selectedSnail, setSelectedSnail] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [marketBets, setMarketBets] = useState<{ [key: string]: number }>(initialMarketBets);
  const [balance, setBalance] = useState<number | null>(null);
  const [userBets, setUserBets] = useState<{ [key: string]: number } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);


  useEffect(() => {
    const initUserData = () => {
      auth.onAuthStateChanged(async (user) => {
        if (!user) return;
  
        const uid = user.uid;
        setUserId(uid);
  
        const userRef = doc(db, 'users', uid);
  
        // First, create doc if it doesn't exist
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            balance: 1000,
            bets: {
              Bluey: 0,
              Gary: 0,
              Turbo: 0,
              Slick: 0,
            },
            joinedAt: serverTimestamp(),
          });
        }
  
        // Now subscribe to changes in real time
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setBalance(data.balance);
            setUserBets(data.bets);
            console.log('🔥 Synced live data:', data);
          }
        });
  
        return () => unsubscribe(); // cleanup on component unmount
      });
    };
  
    initUserData();
  }, []);
  
  const getTotalPool = () =>
  snails.reduce((sum, snail) => {
    const userBet = userBets?.[snail] ?? 0;
    return sum + marketBets[snail] + userBet;
  }, 0);

    const calculateOdds = (snail: string): string => {
      if (!userBets) return '—';
      const total = getTotalPool();
      const totalOnSnail = marketBets[snail] + userBets[snail];
      if (totalOnSnail === 0 || total === 0) return '—';
      return (total / totalOnSnail).toFixed(2) + 'x';
    };
    

  const calculatePayout = (): string => {
    const amount = parseInt(betAmount);
    const oddsStr = selectedSnail ? calculateOdds(selectedSnail) : '—';
    if (isNaN(amount) || !selectedSnail || oddsStr === '—') return '—';
    const odds = parseFloat(oddsStr.replace('x', ''));
    return (amount * odds).toFixed(2) + ' SnailBucks';
  };
  

  const handleBet = async () => {
    const amount = parseInt(betAmount);
  
    if (!selectedSnail) {
      alert('Please select a snail!');
      return;
    }
  
    if (isNaN(amount) || amount <= 0) {
      alert('Enter a valid bet amount!');
      return;
    }
  
    if (balance === null || userBets === null || !userId) {
      alert('User data not loaded yet.');
      return;
    }
  
    if (amount > balance) {
      alert("You don't have enough SnailBucks!");
      return;
    }
  
    // Calculate new balance and bets
    const newBalance = balance - amount;
    const updatedBets = {
      ...userBets,
      [selectedSnail]: (userBets[selectedSnail] ?? 0) + amount,
    };
  
    // Optimistically update UI
    setBalance(newBalance);
    setUserBets(updatedBets);
  
    // Write to Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      balance: newBalance,
      bets: updatedBets,
    });
  
    alert(`You bet ${amount} on ${selectedSnail} 🐌`);
    setBetAmount('');
    setSelectedSnail('');
  };
  
  

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 bg-gray-50 font-sans">
      <h1 className="text-5xl font-extrabold mb-2 text-center text-gray-900">
        🐌 Snail Races Live
      </h1>
      {balance === null ? (
        <p className="text-lg text-gray-600 mb-6">Loading balance...</p>
      ) : (
        <p className="text-lg font-semibold text-gray-800 mb-6">
          Balance: <span className="font-mono text-green-600">{balance}</span> 🪙 SnailBucks
        </p>
      )}
      
      <div className="w-full max-w-5xl aspect-video mb-8 shadow-lg border-4 border-gray-700">
        <iframe
          className="w-full h-full"
          src="https://www.youtube.com/embed/kKZNdhNyYnc?autoplay=1"
          title="Snail Race Test Stream"
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
        ></iframe>
      </div>

      <div className="w-full max-w-lg mb-6 text-sm text-gray-700 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm">
        <p className="font-semibold mb-1">💡 How It Works:</p>
        <p>
          This is a <span className="font-medium">parimutuel betting pool</span> — the odds for each snail are dynamic and
          update as more SnailBucks are placed. If your chosen snail wins, your payout is:
        </p>
        <p className="font-mono text-sm text-gray-800 mt-1 mb-2">
          your_bet × (total_pool / total_bet_on_that_snail)
        </p>
        <p>
          That means the earlier (and smarter) you bet, the better your odds!
        </p>
      </div>

      
      <div className="bg-white shadow-md rounded-xl p-6 w-full max-w-lg space-y-4 border border-gray-300">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">🎰 Place Your Bet</h2>

        <div>
          <label className="block mb-1 font-medium text-gray-700">Choose a Snail:</label>
          <select
            className="w-full p-2 border border-gray-300 rounded"
            value={selectedSnail}
            onChange={(e) => setSelectedSnail(e.target.value)}
          >
            <option value="">-- Select a snail --</option>
            {snails.map((snail) => (
              <option key={snail} value={snail}>
                {snail} — Odds: {calculateOdds(snail)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">Bet Amount:</label>
          <input
            type="number"
            className="w-full p-2 border border-gray-300 rounded"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            placeholder="Enter SnailBucks amount"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">💡 Potential Payout:</label>
          <div className="p-2 border border-dashed border-green-400 rounded text-green-700 font-semibold bg-green-50">
            {calculatePayout()}
          </div>
        </div>
        
        <button
          onClick={handleBet}
          className="w-full bg-green-600 text-white py-2 px-4 rounded font-bold hover:bg-green-700 transition"
        >
          Bet Now 🪙
        </button>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">📊 Current Bets:</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            {snails.map((snail) => {
              const market = marketBets[snail];
              const user = userBets?.[snail] ?? 0;
              const total = market + user;
              return (
                <li key={snail}>
                  <span className="font-medium">{snail}</span>: 
                  <span className="ml-2">{total} total</span> — 
                  <span className="ml-2 text-green-700">Your bet: {user}</span> — 
                  <span className="ml-2 text-blue-600">Odds: {calculateOdds(snail)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </main>
  );
}
