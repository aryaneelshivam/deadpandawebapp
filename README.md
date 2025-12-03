# 🐼 Deadpanda

<div align="center">

**Interactive Deadlock Detection & Resource Allocation Visualizer**

A visual, educational tool for understanding deadlocks in operating systems. Build resource allocation graphs and detect circular wait conditions in real-time.

[View in AI Studio](https://ai.studio/apps/drive/1oBByNPbr_bhlQqYs5ogTQUE5mxuVTkAj)

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)

</div>

---

## 🎯 What is Deadpanda?

Deadpanda is an interactive web application that helps students and developers understand **deadlock detection** in operating systems through visual resource allocation graphs (RAG). Drag-and-drop processes and resources, create allocation and request edges, and watch the deadlock detection algorithm identify circular waits.

### Key Features

- **Drag-and-Drop Interface**: Build resource allocation graphs intuitively
- **Real-Time Deadlock Detection**: Uses graph reduction algorithm to detect deadlocks
- **Visual Cycle Highlighting**: See exactly which processes and resources are in circular wait
- **Sample Scenarios**: Pre-built examples for both deadlock and safe cases
- **Interactive Inspector**: Modify process and resource properties on the fly
- **Educational Tool**: Perfect for OS courses, interview prep, or learning concurrency

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/deadpandawebapp.git

# Navigate to the project directory
cd deadpandawebapp

# Install dependencies
npm install

# Run the development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 📚 How to Use

### Building a Resource Allocation Graph

1. **Add Nodes**: Drag `Process` or `Resource` nodes from the sidebar onto the canvas
2. **Create Edges**:
   - **Process → Resource** = Request (dashed line)
   - **Resource → Process** = Allocation (solid line)
3. **Configure Resources**: Select a resource node and adjust the number of instances in the Inspector panel
4. **Run Simulation**: Click "Run Deadlock Detection" to analyze the graph

### Understanding the Results

- **🟢 Safe State**: All processes can complete. A safe sequence will be shown.
- **🔴 Deadlock Detected**: Processes are stuck in circular wait. Deadlocked nodes turn red, and the cycle is highlighted.

### Sample Scenarios

- **Load Sample Deadlock** (Red): Classic circular wait with 2 processes and 2 resources
- **Load Safe Case (No Deadlock)** (Green): 3 processes and 2 resources with a valid safe sequence

---

## 🧠 Algorithm Details

### Deadlock Detection Method

Deadpanda uses a **graph reduction algorithm** combined with DFS-based cycle detection:

1. **Parse Graph**: Extract allocation and request matrices from the visual graph
2. **Graph Reduction**: Iteratively find processes that can complete with available resources
3. **Identify Deadlock**: Processes that cannot finish are deadlocked
4. **Find Cycles**: Use DFS to extract the circular wait chain for visualization

### Technical Implementation

- **Frontend**: React 19 with TypeScript
- **State Management**: React hooks (`useState`, `useCallback`)
- **Graph Library**: ReactFlow for node-based UI
- **Icons**: Lucide React
- **Styling**: TailwindCSS

---

## 🛠️ Project Structure

```
deadpandawebapp/
├── components/
│   ├── CustomNodes.tsx      # Process & Resource node components
│   ├── Inspector.tsx         # Right panel for node editing & simulation
│   └── Sidebar.tsx           # Left panel with node library & scenarios
├── services/
│   └── deadlockEngine.ts     # Core deadlock detection algorithm
├── App.tsx                   # Main application component
├── types.ts                  # TypeScript type definitions
├── index.tsx                 # Entry point
└── index.html                # HTML template
```

---

## ⚠️ Known Issues

### Cycle Detection Bug

There is a known issue in the cycle extraction logic in `deadlockEngine.ts` (line 179):

```typescript
// Current (incomplete):
const cycle = path.slice(cycleStartIndex);

// Should be (complete):
const cycle = [...path.slice(cycleStartIndex), neighbor];
```

**Impact**: The reported cycle doesn't include the back edge to close the loop. For example, `P1 → R1 → P2 → R2` is shown instead of `P1 → R1 → P2 → R2 → P1`.

**Fix**: See [deadlock_bug_analysis.md](/.gemini/antigravity/brain/d3b70462-3647-4683-8bcb-c5256ed77caa/deadlock_bug_analysis.md) for detailed analysis and fix.

---

## 🧪 Testing

To test the application:

1. **Load Sample Deadlock**: Verify that a red error state is shown with the circular wait highlighted
2. **Load Safe Case**: Verify that a green success state is shown with a safe sequence
3. **Manual Testing**: Build custom scenarios to test edge cases

---

## 📦 Build for Production

```bash
npm run build
```

This generates optimized static files in the `dist/` directory, ready for deployment.

---

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- Fix the cycle detection bug
- Add more sample scenarios
- Implement undo/redo functionality
- Add export to PNG/SVG
- Support for multiple resource instances per edge
- Banker's algorithm for avoidance (not just detection)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- Built with [ReactFlow](https://reactflow.dev/) for node-based UI
- Inspired by operating systems textbooks and university OS courses
- Icons by [Lucide](https://lucide.dev/)

---

<div align="center">

**Made with ❤️ for OS students and concurrency enthusiasts**

</div>
