// api/index.ts
// We import our pre-bundled server file.
// Since it's a bundled .cjs file, it resolves instantly with no nested TS compilation or module path resolution issues on Vercel.
// @ts-ignore
import appModule from "../dist/server.cjs";

const app = appModule.app || appModule.default || appModule;

export default app;
