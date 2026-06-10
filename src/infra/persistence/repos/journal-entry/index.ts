import journalEntryRepo from './journal-entry.repo.impl';
import journalLineRepo from './journal-line.repo.impl';

const journalEntryRepos = {
  journalEntry: journalEntryRepo,
  journalLine: journalLineRepo,
};

export default journalEntryRepos;
