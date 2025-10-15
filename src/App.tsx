import React, { useState, useCallback } from 'react';
import { Play, RotateCcw, Trash2 } from 'lucide-react';

type CellType = 'empty' | 'start' | 'end' | 'wall' | 'path' | 'visited';

interface Cell {
  row: number;
  col: number;
  type: CellType;
}

interface PathResult {
  path: Cell[];
  visited: Cell[];
  found: boolean;
}

const ShortestPathVisualizer: React.FC = () => {
  const [rows, setRows] = useState(15);
  const [cols, setCols] = useState(25);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [start, setStart] = useState<Cell | null>(null);
  const [end, setEnd] = useState<Cell | null>(null);
  const [mode, setMode] = useState<'start' | 'end' | 'wall'>('start');
  const [isRunning, setIsRunning] = useState(false);
  const [algorithm, setAlgorithm] = useState<'bfs' | 'dfs'>('bfs');
  const [message, setMessage] = useState('');

  const initializeGrid = useCallback(() => {
    const newGrid: Cell[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: Cell[] = [];
      for (let j = 0; j < cols; j++) {
        row.push({ row: i, col: j, type: 'empty' });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    setStart(null);
    setEnd(null);
    setMessage('');
  }, [rows, cols]);

  React.useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  const handleCellClick = (row: number, col: number) => {
    if (isRunning) return;

    const newGrid = [...grid];
    const cell = newGrid[row][col];

    if (mode === 'start') {
      if (start) {
        newGrid[start.row][start.col].type = 'empty';
      }
      if (cell.type === 'end') return;
      cell.type = 'start';
      setStart(cell);
      setMode('end');
    } else if (mode === 'end') {
      if (end) {
        newGrid[end.row][end.col].type = 'empty';
      }
      if (cell.type === 'start') return;
      cell.type = 'end';
      setEnd(cell);
      setMode('wall');
    } else if (mode === 'wall') {
      if (cell.type === 'start' || cell.type === 'end') return;
      cell.type = cell.type === 'wall' ? 'empty' : 'wall';
    }

    setGrid(newGrid);
    setMessage('');
  };

  const bfs = (startCell: Cell, endCell: Cell): PathResult => {
    const queue: { cell: Cell; path: Cell[] }[] = [{ cell: startCell, path: [startCell] }];
    const visited = new Set<string>();
    const visitedCells: Cell[] = [];
    visited.add(`${startCell.row},${startCell.col}`);

    const directions = [
      [0, 1], [1, 0], [0, -1], [-1, 0]
    ];

    while (queue.length > 0) {
      const { cell, path } = queue.shift()!;

      if (cell.row === endCell.row && cell.col === endCell.col) {
        return { path, visited: visitedCells, found: true };
      }

      for (const [dr, dc] of directions) {
        const newRow = cell.row + dr;
        const newCol = cell.col + dc;
        const key = `${newRow},${newCol}`;

        if (
          newRow >= 0 && newRow < rows &&
          newCol >= 0 && newCol < cols &&
          !visited.has(key) &&
          grid[newRow][newCol].type !== 'wall'
        ) {
          visited.add(key);
          const newCell = grid[newRow][newCol];
          visitedCells.push(newCell);
          queue.push({ cell: newCell, path: [...path, newCell] });
        }
      }
    }

    return { path: [], visited: visitedCells, found: false };
  };

  const dfs = (startCell: Cell, endCell: Cell): PathResult => {
    const stack: { cell: Cell; path: Cell[] }[] = [{ cell: startCell, path: [startCell] }];
    const visited = new Set<string>();
    const visitedCells: Cell[] = [];
    visited.add(`${startCell.row},${startCell.col}`);

    const directions = [
      [0, 1], [1, 0], [0, -1], [-1, 0]
    ];

    while (stack.length > 0) {
      const { cell, path } = stack.pop()!;

      if (cell.row === endCell.row && cell.col === endCell.col) {
        return { path, visited: visitedCells, found: true };
      }

      for (const [dr, dc] of directions) {
        const newRow = cell.row + dr;
        const newCol = cell.col + dc;
        const key = `${newRow},${newCol}`;

        if (
          newRow >= 0 && newRow < rows &&
          newCol >= 0 && newCol < cols &&
          !visited.has(key) &&
          grid[newRow][newCol].type !== 'wall'
        ) {
          visited.add(key);
          const newCell = grid[newRow][newCol];
          visitedCells.push(newCell);
          stack.push({ cell: newCell, path: [...path, newCell] });
        }
      }
    }

    return { path: [], visited: visitedCells, found: false };
  };

  const visualizePath = async () => {
    if (!start || !end) {
      setMessage('Please select both start and end points!');
      return;
    }

    setIsRunning(true);
    setMessage('');

    // Clear previous visualization
    const newGrid = grid.map(row =>
      row.map(cell => ({
        ...cell,
        type: cell.type === 'path' || cell.type === 'visited' ? 'empty' : cell.type
      }))
    );
    setGrid(newGrid);

    const result = algorithm === 'bfs' ? bfs(start, end) : dfs(start, end);

    // Animate visited cells
    for (let i = 0; i < result.visited.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 20));
      const cell = result.visited[i];
      if (cell.type === 'empty') {
        const updatedGrid = [...grid];
        updatedGrid[cell.row][cell.col].type = 'visited';
        setGrid([...updatedGrid]);
      }
    }

    if (result.found) {
      // Animate path
      for (let i = 1; i < result.path.length - 1; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        const cell = result.path[i];
        const updatedGrid = [...grid];
        updatedGrid[cell.row][cell.col].type = 'path';
        setGrid([...updatedGrid]);
      }
      setMessage(`Path found! Length: ${result.path.length - 1} steps`);
    } else {
      setMessage('No path found! The end point is unreachable.');
    }

    setIsRunning(false);
  };

  const clearPath = () => {
    const newGrid = grid.map(row =>
      row.map(cell => ({
        ...cell,
        type: cell.type === 'path' || cell.type === 'visited' ? 'empty' : cell.type
      }))
    );
    setGrid(newGrid);
    setMessage('');
  };

  const clearWalls = () => {
    const newGrid = grid.map(row =>
      row.map(cell => ({
        ...cell,
        type: cell.type === 'wall' ? 'empty' : cell.type
      }))
    );
    setGrid(newGrid);
    setMessage('');
  };

  const getCellColor = (type: CellType): string => {
    switch (type) {
      case 'start': return 'bg-green-500';
      case 'end': return 'bg-red-500';
      case 'wall': return 'bg-gray-800';
      case 'path': return 'bg-yellow-400';
      case 'visited': return 'bg-blue-300';
      default: return 'bg-white border border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Shortest Path Visualizer</h1>
          <p className="text-gray-600">Find the shortest path between two points using BFS or DFS</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rows</label>
              <input
                type="number"
                min="5"
                max="30"
                value={rows}
                onChange={(e) => setRows(Math.max(5, Math.min(30, parseInt(e.target.value) || 5)))}
                disabled={isRunning}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Columns</label>
              <input
                type="number"
                min="5"
                max="40"
                value={cols}
                onChange={(e) => setCols(Math.max(5, Math.min(40, parseInt(e.target.value) || 5)))}
                disabled={isRunning}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Algorithm</label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as 'bfs' | 'dfs')}
                disabled={isRunning}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="bfs">BFS (Shortest Path)</option>
                <option value="dfs">DFS (Not Optimal)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                disabled={isRunning}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="start">Set Start</option>
                <option value="end">Set End</option>
                <option value="wall">Draw Walls</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={visualizePath}
              disabled={isRunning || !start || !end}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Play size={20} />
              Visualize Path
            </button>
            <button
              onClick={clearPath}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              <RotateCcw size={20} />
              Clear Path
            </button>
            <button
              onClick={clearWalls}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              <Trash2 size={20} />
              Clear Walls
            </button>
            <button
              onClick={initializeGrid}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              <RotateCcw size={20} />
              Reset Grid
            </button>
          </div>

          {message && (
            <div className={`p-4 rounded-lg mb-6 ${message.includes('found!') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}

          <div className="flex flex-wrap gap-6 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded"></div>
              <span className="text-gray-700">Start</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500 rounded"></div>
              <span className="text-gray-700">End</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-800 rounded"></div>
              <span className="text-gray-700">Wall</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-300 rounded"></div>
              <span className="text-gray-700">Visited</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-400 rounded"></div>
              <span className="text-gray-700">Path</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 overflow-auto">
          <div className="inline-block">
            <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {grid.map((row, i) =>
                row.map((cell, j) => (
                  <div
                    key={`${i}-${j}`}
                    onClick={() => handleCellClick(i, j)}
                    className={`w-6 h-6 cursor-pointer transition-colors ${getCellColor(cell.type)} hover:opacity-80`}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Set grid dimensions and click outside to apply changes</li>
            <li>Click on the grid to place the start point (green)</li>
            <li>Click again to place the end point (red)</li>
            <li>Switch to "Draw Walls" mode and click cells to create obstacles</li>
            <li>Choose BFS (guaranteed shortest) or DFS (faster but not optimal)</li>
            <li>Click "Visualize Path" to see the algorithm in action</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ShortestPathVisualizer;