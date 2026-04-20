/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, Fragment } from 'react';
import { Chart, registerables } from 'chart.js';
import { 
  Users, 
  History, 
  Trophy, 
  Plus, 
  Trash2, 
  Play, 
  RotateCcw, 
  Award,
  ChevronRight,
  TrendingUp,
  UserCircle,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

Chart.register(...registerables);

interface Player {
  id: number;
  name: string;
  color: string;
  totalScore: number;
}

interface Round {
  roundNumber: number;
  scores: { [playerId: number]: number };
  asCounts: { [playerId: number]: number };
}

const RecapChart = ({ players, rounds }: { players: Player[], rounds: Round[] }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const labels = ['Awal', ...rounds.map((_, i) => `Ronde ${i + 1}`)];
      
      const datasets = players.map(player => {
        let accumulated = 0;
        const data = [0];
        
        rounds.forEach(round => {
          accumulated += round.scores[player.id || 0] || 0;
          data.push(accumulated);
        });

        return {
          label: player.name,
          data: data,
          borderColor: player.color,
          backgroundColor: player.color + '33',
          tension: 0.3,
          fill: false,
          pointRadius: 5,
          pointHoverRadius: 8
        };
      });

      chartInstance.current = new Chart(chartRef.current, {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { font: { family: 'Inter', weight: 'bold' } } },
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            y: { 
              beginAtZero: true,
              grid: { color: '#e5e7eb' },
              title: { display: true, text: 'Total Skor', font: { weight: 'bold' } }
            },
            x: { 
              grid: { display: false },
              title: { display: true, text: 'Tahapan Permainan', font: { weight: 'bold' } }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [players, rounds]);

  return (
    <div className="flex-1 relative pb-4">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

const DEFAULT_COLORS = [
  '#3b82f6', // p1: Blue
  '#ef4444', // p2: Red
  '#10b981', // p3: Green/Emerald
  '#f59e0b', // p4: Yellow/Amber
  '#8b5cf6'  // p5: Purple/Violet
];

export default function App() {
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: 'Pemain 1', color: DEFAULT_COLORS[0], totalScore: 0 },
    { id: 2, name: 'Pemain 2', color: DEFAULT_COLORS[1], totalScore: 0 },
    { id: 3, name: 'Pemain 3', color: DEFAULT_COLORS[2], totalScore: 0 },
    { id: 4, name: 'Pemain 4', color: DEFAULT_COLORS[3], totalScore: 0 },
    { id: 5, name: 'Pemain 5', color: DEFAULT_COLORS[4], totalScore: 0 },
  ]);

  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRoundInput, setCurrentRoundInput] = useState<{ [playerId: number]: string }>({
    1: '', 2: '', 3: '', 4: '', 5: ''
  });
  const [currentAsCounts, setCurrentAsCounts] = useState<{ [playerId: number]: number }>({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0
  });
  const [isGameEnded, setIsGameEnded] = useState(false);

  const handlePlayerNameChange = (id: number, newName: string) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const handleScoreChange = (playerId: number, value: string) => {
    setCurrentRoundInput(prev => ({ ...prev, [playerId]: value }));
  };

  const toggleAsSekop = (playerId: number) => {
    const totalAsSelected: number = (Object.values(currentAsCounts) as number[]).reduce((a: number, b: number) => a + b, 0);
    
    setCurrentAsCounts(prev => {
      const currentCount = prev[playerId];
      let nextCount = 0;
      
      if (currentCount === 0) {
        if (totalAsSelected < 2) nextCount = 1;
        else nextCount = 0;
      } else if (currentCount === 1) {
        if (totalAsSelected < 2) nextCount = 2;
        else nextCount = 0;
      } else {
        nextCount = 0;
      }
      
      return { ...prev, [playerId]: nextCount };
    });
  };

  const saveRound = () => {
    const totalAsSelected: number = (Object.values(currentAsCounts) as number[]).reduce((a: number, b: number) => a + b, 0);
    if (totalAsSelected !== 2) {
      alert('Kedua kartu AS harus dipilih/dibagikan sebelum menyimpan ronde!');
      return;
    }

    const allFilled = players.every(p => currentRoundInput[p.id] !== '');
    if (!allFilled) {
      alert('Semua skor pemain harus diisi terlebih dahulu! (Isi 0 jika tidak ada poin)');
      return;
    }

    const roundScores: { [playerId: number]: number } = {};
    const updatedPlayers = players.map(player => {
      const baseScore = parseInt(currentRoundInput[player.id]) || 0;
      const asCount = currentAsCounts[player.id] || 0;
      const additional = asCount * 15;
      const finalRoundScore = baseScore + additional;
      
      roundScores[player.id] = finalRoundScore;
      
      return {
        ...player,
        totalScore: player.totalScore + finalRoundScore
      };
    });

    const newRound: Round = {
      roundNumber: rounds.length + 1,
      scores: roundScores,
      asCounts: { ...currentAsCounts }
    };

    setRounds([...rounds, newRound]);
    setPlayers(updatedPlayers);
    
    setCurrentRoundInput({ 1: '', 2: '', 3: '', 4: '', 5: '' });
    setCurrentAsCounts({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  };

  const startNewSession = () => {
    setRounds([]);
    setPlayers(prev => prev.map(p => ({ ...p, totalScore: 0 })));
    setIsGameEnded(false);
    setCurrentAsCounts({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    setCurrentRoundInput({ 1: '', 2: '', 3: '', 4: '', 5: '' });
  };

  const deleteRound = (index: number) => {
    const roundToDelete = rounds[index];
    const newRounds = rounds.filter((_, i) => i !== index);
    
    const updatedPlayers = players.map(player => ({
      ...player,
      totalScore: player.totalScore - roundToDelete.scores[player.id]
    }));

    setRounds(newRounds);
    setPlayers(updatedPlayers);
  };

  const asSekopStats = (() => {
    if (rounds.length === 0) return null;
    const counts = rounds.reduce((acc, r) => {
      Object.entries(r.asCounts || {}).forEach(([pid, count]) => {
        const id = Number(pid);
        acc[id] = (acc[id] || 0) + count;
      });
      return acc;
    }, {} as Record<number, number>);

    let maxId = -1;
    let maxVal = 0;
    Object.entries(counts).forEach(([id, count]) => {
      const currentCount = count as number;
      if (currentCount > maxVal) {
        maxVal = currentCount;
        maxId = Number(id);
      }
    });

    const player = players.find(p => p.id === maxId);
    return player ? { name: player.name, count: maxVal } : null;
  })();

  const sortedPlayers = [...players].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-sans selection:bg-slate-200">
      <div className="max-w-7xl mx-auto p-3 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
        {/* Header */}
        <header className="col-span-12 bg-white border-[1.5px] border-[#e2e8f0] rounded-2xl p-4 md:px-6 md:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-9 md:h-9 bg-[#3b82f6] rounded-lg shadow-sm shadow-blue-100 flex items-center justify-center text-white font-black text-sm md:text-base">S</div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-[#1e293b]">Kalkulator Skor Song</h1>
          </div>
          <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t border-slate-100 sm:border-0">
            <div className="flex flex-col items-start sm:items-end">
              <span className="text-[9px] uppercase font-bold tracking-widest text-[#64748b]">Sesi Aktif</span>
              <span className="text-xs font-bold text-[#1e293b]">Game 04</span>
            </div>
            {!isGameEnded ? (
              <button 
                onClick={() => setIsGameEnded(true)}
                disabled={rounds.length === 0}
                className="px-4 py-2.5 border border-[#ef4444] text-[#ef4444] rounded-lg text-xs font-bold hover:bg-[#ef4444] hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] flex items-center"
              >
                Akhiri Permainan
              </button>
            ) : (
              <button 
                onClick={startNewSession}
                className="px-4 py-2.5 bg-[#1e293b] text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-all active:scale-95 min-h-[40px] flex items-center"
              >
                Mulai Sesi Baru
              </button>
            )}
          </div>
        </header>

        {/* Player Stats Row - Responsive Grid */}
        <div className="col-span-12 grid grid-cols-2 lg:grid-cols-5 gap-2 md:gap-3">
          {players.map((player, idx) => (
            <div 
              key={player.id} 
              className={`bg-white border-[1.5px] border-[#e2e8f0] rounded-2xl p-3 md:p-4 flex flex-col gap-1 transition-all shadow-sm ${
                idx === 4 ? 'col-span-2 lg:col-span-1' : ''
              }`} 
              style={{ borderLeft: `4px solid ${player.color}` }}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-[#64748b]">Pemain {player.id}</span>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: player.color }}></div>
              </div>
              <div className="relative group/name">
                <input 
                  type="text" 
                  value={player.name}
                  onChange={(e) => handlePlayerNameChange(player.id, e.target.value)}
                  className="w-full border-none outline-none font-bold text-sm md:text-base bg-transparent p-0 pr-6 focus:text-[#3b82f6] transition-colors truncate"
                  placeholder={`Pemain ${player.id}`}
                />
                <Pencil className="w-3.5 h-3.5 absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/name:text-[#3b82f6] transition-colors pointer-events-none" />
              </div>
              <div className="mt-0.5 font-mono text-xl md:text-2xl font-black tabular-nums" style={{ color: player.color }}>
                {player.totalScore}
              </div>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {!isGameEnded ? (
            <Fragment key="game-active">
              {/* Input Section - Prioritize usability on mobile */}
              <motion.section 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="col-span-12 md:col-span-5 bg-white border-[1.5px] border-[#e2e8f0] rounded-2xl p-4 md:p-6 flex flex-col shadow-sm"
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-500" />
                    Input Ronde
                  </h2>
                  <span className="text-[10px] font-black text-[#64748b] bg-slate-100 px-2 py-0.5 rounded ring-1 ring-slate-200">
                    RONDE {rounds.length + 1}
                  </span>
                </div>

                <div className="flex-1 space-y-2 md:space-y-3">
                  <div className="grid grid-cols-[1fr_80px_50px] gap-2 mb-2 px-1">
                    <span className="text-[9px] uppercase font-bold text-[#64748b]">Nama</span>
                    <span className="text-[9px] uppercase font-bold text-[#64748b] text-center">Skor</span>
                    <span className="text-[9px] uppercase font-bold text-[#64748b] text-center">AS</span>
                  </div>
                  {players.map(player => (
                    <div key={player.id} className="grid grid-cols-[1fr_80px_50px] gap-2 items-center min-h-[44px] group">
                      <span className="text-xs md:text-sm font-semibold text-[#1e293b] truncate pl-2 border-l-2 transition-all group-focus-within:border-l-4" style={{ borderColor: player.color }}>
                        {player.name}
                      </span>
                      <input 
                        type="number" 
                        value={currentRoundInput[player.id]}
                        onChange={(e) => handleScoreChange(player.id, e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-2 border border-[#e2e8f0] rounded-lg text-sm text-center font-bold focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none bg-slate-50 focus:bg-white transition-all"
                      />
                      <div className="flex justify-center">
                        <button
                          onClick={() => toggleAsSekop(player.id)}
                          className={`w-10 h-10 md:w-9 md:h-9 rounded-xl border-2 transition-all flex items-center justify-center relative ${
                            currentAsCounts[player.id] > 0 
                              ? 'bg-[#1e293b] border-[#1e293b] text-white shadow-md' 
                              : 'border-[#e2e8f0] bg-white hover:border-[#1e293b]'
                          }`}
                          aria-label={`Toggle AS Sekop for ${player.name}`}
                        >
                          <div className="flex gap-0.5">
                            {currentAsCounts[player.id] >= 1 && <span className="text-[10px]">♠</span>}
                            {currentAsCounts[player.id] >= 2 && <span className="text-[10px]">♠</span>}
                            {currentAsCounts[player.id] === 0 && <span className="text-[8px] text-slate-300">AS</span>}
                          </div>
                          {currentAsCounts[player.id] > 0 && (
                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[8px] font-black border border-white">
                              {currentAsCounts[player.id]}
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={saveRound}
                    className="w-full mt-6 py-4 bg-[#1e293b] text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-200 hover:bg-slate-700 active:scale-[0.98] transition-all min-h-[48px]"
                  >
                    Simpan Ronde
                  </button>
                </div>
              </motion.section>

              {/* History Section - Better Scroll & Layout for Mobile */}
              <motion.section 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="col-span-12 md:col-span-7 bg-white border-[1.5px] border-[#e2e8f0] rounded-2xl p-4 md:p-6 flex flex-col h-[450px] md:h-auto overflow-hidden shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-400" />
                    Riwayat Permainan
                  </h2>
                </div>
                <div className="flex-1 overflow-x-auto ring-1 ring-slate-100 rounded-lg custom-scrollbar">
                  <table className="w-full border-collapse min-w-[500px]">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b border-[#f1f5f9]">
                        <th className="text-left text-[9px] uppercase font-bold text-[#64748b] p-3 w-12">Rnd</th>
                        {players.map(p => (
                          <th key={p.id} className="text-center text-[9px] uppercase font-bold text-[#64748b] p-3">
                            <div className="truncate max-w-[70px] mx-auto">{p.name}</div>
                          </th>
                        ))}
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {rounds.map((round, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 text-[10px] font-black text-[#64748b]">#{idx + 1}</td>
                          {players.map(player => (
                            <td key={player.id} className="p-3 text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                <span className={`text-sm font-bold tabular-nums ${round.scores[player.id] > 0 ? 'text-blue-600' : round.scores[player.id] < 0 ? 'text-rose-500' : ''}`}>
                                  {round.scores[player.id] > 0 ? '+' : ''}{round.scores[player.id]}
                                </span>
                                {round.asCounts && round.asCounts[player.id] > 0 && (
                                  <span className="text-[7px] font-black bg-rose-100 text-rose-700 px-1 py-0.5 rounded flex gap-0.5 mt-0.5">
                                    {Array(round.asCounts[player.id]).fill(0).map((_, i) => <span key={i}>♠</span>)}
                                    {round.asCounts[player.id] * 15}
                                  </span>
                                )}
                              </div>
                            </td>
                          ))}
                          <td className="p-3 text-right">
                            <button 
                              onClick={() => deleteRound(idx)}
                              className="p-2 text-slate-300 hover:text-rose-500 transition-all sm:opacity-0 sm:group-hover:opacity-100"
                              aria-label="Hapus ronde"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )).reverse()}
                    </tbody>
                  </table>
                  {rounds.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-300 gap-2">
                       <History className="w-8 h-8 opacity-20" />
                       <span className="text-xs font-bold uppercase tracking-widest opacity-40 italic">Belum Ada Riwayat</span>
                    </div>
                  )}
                </div>
              </motion.section>
            </Fragment>
          ) : (
            <Fragment key="game-ended">
              {/* Leaderboard Section */}
              <motion.section 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="col-span-12 md:col-span-4 bg-white border-[1.5px] border-[#e2e8f0] rounded-2xl p-5 md:p-6 flex flex-col shadow-sm"
              >
                <div className="flex items-center gap-2 mb-6">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h2 className="text-sm font-bold text-[#1e293b]">Peringkat Akhir</h2>
                </div>
                <div className="space-y-3">
                  {sortedPlayers.map((player, idx) => {
                    const isLast = idx === sortedPlayers.length - 1;
                    return (
                      <div key={player.id} className={`flex items-center gap-3 p-3 border rounded-xl transition-all ${
                        idx === 0 ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-100' : 
                        idx === 1 ? 'bg-slate-50 border-slate-200' :
                        idx === 2 ? 'bg-orange-50 border-orange-200' :
                        isLast ? 'bg-rose-50 border-rose-200 ring-1 ring-rose-100' :
                        'bg-[#f8fafc] border-[#e2e8f0]'
                      }`}>
                        <div className={`w-8 h-8 rounded-full shadow-sm flex items-center justify-center font-black text-xs border ${
                          idx === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white border-amber-600' : 
                          idx === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-700 border-slate-500' :
                          idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white border-orange-800' :
                          isLast ? 'bg-rose-500 text-white border-rose-600' :
                          'bg-white text-slate-500 border-[#e2e8f0]'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <span className={`text-sm font-bold ${isLast ? 'text-rose-700' : 'text-[#1e293b]'}`}>{player.name}</span>
                          <div className={`text-[9px] font-bold uppercase tracking-tighter ${isLast ? 'text-rose-400' : 'text-[#64748b]'}`}>
                            {idx === 0 ? 'Champion' : isLast ? 'Juru Kunci' : `Rank #${idx+1}`}
                          </div>
                        </div>
                        <div className={`text-lg font-black tabular-nums ${isLast ? 'text-rose-600' : 'text-[#1e293b]'}`}>{player.totalScore}</div>
                      </div>
                    );
                  })}
                </div>
              </motion.section>

              {/* Chart Section - Ensure scrollable context on mobile */}
              <motion.section 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="col-span-12 md:col-span-8 bg-white border-[1.5px] border-[#e2e8f0] rounded-2xl p-5 md:p-6 flex flex-col shadow-sm h-[400px] md:h-auto"
              >
                <div className="flex items-center justify-between mb-6">
                   <h2 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
                     <TrendingUp className="w-5 h-5 text-blue-500" />
                     Grafik Pergerakan
                   </h2>
                </div>
                <RecapChart players={players} rounds={rounds} />
                <div className="flex justify-between border-t border-slate-50 pt-3">
                  <span className="text-[9px] font-black text-[#64748b] uppercase">Start</span>
                  <span className="text-[9px] font-black text-[#64748b] uppercase">Ronde {rounds.length}</span>
                </div>
              </motion.section>

              {/* Total Summary Stats - Grid for Mobile */}
              <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white border-[1.5px] border-[#e2e8f0] rounded-2xl p-4 text-center shadow-sm">
                  <span className="block text-[9px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Total Ronde</span>
                  <span className="text-xl md:text-2xl font-black text-[#1e293b]">{rounds.length}</span>
                </div>
                <div className="bg-white border-[1.5px] border-[#e2e8f0] rounded-2xl p-4 text-center shadow-sm">
                  <span className="block text-[9px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Top Score</span>
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-[#3b82f6] truncate w-full px-2">{sortedPlayers[0].name}</span>
                    <span className="text-xl md:text-2xl font-black text-[#1e293b] tabular-nums">{sortedPlayers[0].totalScore}</span>
                  </div>
                </div>
                <div className="bg-white border-[1.5px] border-[#e2e8f0] rounded-2xl p-4 text-center shadow-sm">
                  <span className="block text-[9px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Kolektor AS</span>
                  {asSekopStats ? (
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-rose-500 truncate w-full px-2">{asSekopStats.name}</span>
                      <span className="text-xl md:text-2xl font-black text-[#1e293b] tabular-nums">{asSekopStats.count} <span className="text-[10px] text-[#64748b] font-bold uppercase">Kali</span></span>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-[#64748b] italic">-</span>
                  )}
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center flex flex-col justify-center items-center shadow-sm">
                   <span className="text-[8px] font-bold text-rose-400 uppercase tracking-widest mb-1">Juru Kunci</span>
                   <span className="text-xs font-bold text-rose-700 truncate w-full px-2">{sortedPlayers[sortedPlayers.length - 1].name}</span>
                   <span className="text-xl md:text-2xl font-black text-rose-600 mt-0.5 tracking-tight tabular-nums">{sortedPlayers[sortedPlayers.length - 1].totalScore}</span>
                </div>
              </div>
            </Fragment>
          )}
        </AnimatePresence>

        <footer className="col-span-12 py-8 flex flex-col items-center gap-2 border-t border-[#e2e8f0] mt-6 opacity-40">
          <div className="flex items-center gap-2 text-[9px] font-black tracking-[0.3em] text-[#1e293b]">
            <span>SONG CALCULATOR</span>
            <span className="w-1.5 h-1.5 bg-[#1e293b] rounded-full"></span>
            <span>MOBILE OPTIMIZED</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
