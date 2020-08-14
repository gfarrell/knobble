module.exports = {
  projects: [
    {
      preset: "ts-jest",
      testEnvironment: "node",
      roots: ["./lib/"],
      globals: {
        "ts-jest": { tsConfig: "./tsconfig.json" },
      },
    },
  ],
};

