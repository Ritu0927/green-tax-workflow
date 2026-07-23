import React from "react";

export class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      const details = [
        this.state.error?.name,
        this.state.error?.message,
        this.state.error?.stack
      ]
        .filter(Boolean)
        .join("\n\n");

      return (
        <div
          style={{
            minHeight: "100vh",
            padding: "32px",
            background: "#fff7f7",
            color: "#7a1f1f",
            fontFamily: "Inter, system-ui, sans-serif"
          }}
        >
          <h1 style={{ marginTop: 0 }}>Runtime error</h1>
          <p>The app hit an exception during render.</p>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "#fff",
              border: "1px solid #efc7c2",
              borderRadius: "8px",
              padding: "16px"
            }}
          >
            {details}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
