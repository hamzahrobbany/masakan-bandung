if (typeof window !== "undefined") {
  const originalError = console.error;

  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("[antd: compatible]")
    ) {
      return; // swallow the warning
    }
    originalError(...args);
  };
}
