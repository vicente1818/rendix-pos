import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("RENDIX ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 40,
          textAlign: "center",
          color: "var(--text-secondary, #8BA3C7)",
          fontFamily: "var(--font-body, system-ui, sans-serif)",
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: "var(--text-primary, #F0F6FF)" }}>
            Algo salió mal
          </div>
          <div style={{ fontSize: 13, marginBottom: 20, opacity: 0.7, fontFamily: "monospace" }}>
            {this.state.error.message}
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              padding: "8px 20px",
              background: "var(--accent-cyan, #00E5FF)",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              color: "#000",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
