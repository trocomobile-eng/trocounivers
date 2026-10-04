import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-[15px] font-bold text-[#0d1b2a]">Quelque chose s'est mal passé</p>
          <p className="text-[13px] text-slate-400">Recharge la page pour continuer.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-[14px] bg-[#1ABEA3] px-5 py-2.5 text-[13px] font-bold text-white"
          >
            Recharger
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
