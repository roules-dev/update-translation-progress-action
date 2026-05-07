import commonjs from "@rollup/plugin-commonjs"
import { nodeResolve } from "@rollup/plugin-node-resolve"

const config = {
    input: "lib/index.js",
    output: {
        esModule: true,
        file: "dist/index.js",
        format: "es",
        sourcemap: true,
    },
    plugins: [commonjs(), nodeResolve({ preferBuiltins: true })],
}

export default config
