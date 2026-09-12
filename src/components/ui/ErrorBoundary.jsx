import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="bg-card border border-danger/30 rounded-xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-danger/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-danger" />
          </div>
          <h3 className="font-heading text-[18px] text-white tracking-[1px] mb-2">Terjadi Kesalahan</h3>
          <p className="text-gray text-sm mb-4">{this.state.error?.message || 'Something went wrong'}</p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); }}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Coba Lagi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}