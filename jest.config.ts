import type { Config } from '@jest/types';
import dataflowJestConfig from 'jest-configs/dataflow.jest.config';

/* eslint-disable */
const config: Config.InitialOptions = {
  displayName: 'link-account',
  ...dataflowJestConfig,
};

export default config;
