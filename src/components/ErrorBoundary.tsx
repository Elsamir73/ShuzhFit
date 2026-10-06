import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from "react";

type ErrorBoundaryState = { failed: boolean };
export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };
  static getDerivedStateFromError(): ErrorBoundaryState { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("Page render failed", error, info.componentStack); }
  render(): ReactNode {
    if (this.state.failed) return <main className="page container" role="alert"><h1>Something went wrong</h1><p>Your page could not load.</p><button className="btn btn-primary" onClick={() => this.setState({ failed: false })}>Try again</button></main>;
    return this.props.children;
  }
}
