import { readFileSync, rmSync } from 'node:fs';
import path from 'node:path';

import libCoverage from 'istanbul-lib-coverage';
import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';

const coverageRoot = path.resolve('coverage');
const coverageShardNames = ['domain-shared', 'app', 'infra-interface', 'http'];
const coverageMap = libCoverage.createCoverageMap({});

for (const coverageShardName of coverageShardNames) {
  const coveragePath = path.join(
    coverageRoot,
    coverageShardName,
    'coverage-final.json'
  );
  const shardCoverage = JSON.parse(readFileSync(coveragePath, 'utf8'));

  coverageMap.merge(shardCoverage);
}

const reportContext = libReport.createContext({
  dir: coverageRoot,
  coverageMap,
});

for (const coverageReporterName of ['json-summary', 'text', 'lcov']) {
  reports.create(coverageReporterName).execute(reportContext);
}

for (const coverageShardName of coverageShardNames) {
  rmSync(path.join(coverageRoot, coverageShardName), {
    recursive: true,
    force: true,
  });
}
