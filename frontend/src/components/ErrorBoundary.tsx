import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { err?: Error }> {
  state = { err: undefined as Error | undefined };
  
  static getDerivedStateFromError(err: Error) { 
    return { err }; 
  }
  
  componentDidCatch(err: Error, info: any) { 
    console.error('App crash:', err, info); 
  }
  
  render() {
    if (this.state.err) {
      return (
        <div style={{padding:24,fontFamily:'Inter,system-ui'}}>
          <h2>⚠️ Something crashed while rendering</h2>
          <pre style={{whiteSpace:'pre-wrap',background:'#111',color:'#eee',padding:12,borderRadius:8}}>
            {String(this.state.err?.message ?? this.state.err)}
          </pre>
          <p>Open DevTools → Console for full stack.</p>
        </div>
      );
    }
    return this.props.children;
  }
}