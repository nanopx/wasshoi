const path = require('path')
const webpack = require('webpack')
const dotenv = require('dotenv')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const createElectronReloadWebpackPlugin = require('electron-reload-webpack-plugin')

// Initialize dotenv
dotenv.config()

const isDev = process.env.NODE_ENV === 'development'

const ElectronReloadWebpackPlugin = createElectronReloadWebpackPlugin({
  path: './',
})

const envDefinePlugin = new webpack.DefinePlugin({
  'process.env': Object.keys(process.env).reduce((envObj, key) => {
    envObj[key] = JSON.stringify(process.env[key])
    return envObj
  }, {}),
})

const main = {
  target: 'electron-main',
  mode: isDev ? 'development' : 'production',
  resolve: {
    extensions: ['.js', '.ts'],
  },
  entry: {
    main: './src/main/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
    publicPath: './',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        loader: 'file-loader',
        options: {
          name: '[path][name].[ext]',
          publicPath: './',
        },
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[path][name].[ext]',
              publicPath: './',
            },
          },
          'extract-loader',
          'html-loader',
        ],
      },
    ],
  },
  node: {
    __dirname: false,
  },
  plugins: isDev
    ? [envDefinePlugin, ElectronReloadWebpackPlugin()]
    : [envDefinePlugin],
  devtool: isDev ? 'inline-source-map' : false,
  stats: {
    warningsFilter: /^(?!CriticalDependenciesWarning$)/,
  },
}

const renderer = {
  target: 'electron-renderer',
  mode: isDev ? 'development' : 'production',
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },
  entry: {
    'renderer-main': './src/renderer/main.ts',
    'renderer-log': './src/renderer/log.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
    publicPath: './',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
    ],
  },
  plugins: isDev
    ? [
        envDefinePlugin,
        ElectronReloadWebpackPlugin(),
        new HtmlWebpackPlugin({
          template: './src/main-view.html',
          chunks: ['renderer-main'],
          filename: 'main-view.html',
        }),
        new HtmlWebpackPlugin({
          template: './src/log-view.html',
          chunks: ['renderer-log'],
          filename: 'log-view.html',
        }),
      ]
    : [
        envDefinePlugin,
        new HtmlWebpackPlugin({
          template: './src/main-view.html',
          chunks: ['renderer-main'],
          filename: 'main-view.html',
        }),
        new HtmlWebpackPlugin({
          template: './src/log-view.html',
          chunks: ['renderer-log'],
          filename: 'log-view.html',
        }),
      ],
  devtool: isDev ? 'inline-source-map' : false,
}

module.exports = [main, renderer]
