// Claude Code PreToolUse hook: blocks any edit to a `.env` file. It covers the file tools
// (Write, Edit, MultiEdit, NotebookEdit) and shell commands that write, move or delete a
// `.env` file. Exit code 2 blocks the tool call and sends the message to the agent.
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const { tool_name: tool, tool_input: args = {} } = input;

const isEnv = (path) => typeof path === 'string' && basename(path) === '.env';

// A `.env` path in a shell command: `.env` not followed by more of a file name.
const ENV_IN_COMMAND = /(^|[\s'"/=<>|;&(])\.env(?![\w.-])/;
// Ways a shell command can change a file.
const WRITES = /(>|\btee\b|\bsed\s+(-\w*\s+)*-\w*i|\bperl\s+-\w*i|\b(mv|cp|rm|truncate|dd|ln|install)\b)/;

function blocked() {
  if (['Write', 'Edit', 'MultiEdit'].includes(tool)) return isEnv(args.file_path);
  if (tool === 'NotebookEdit') return isEnv(args.notebook_path);
  if (tool === 'Bash') {
    const command = String(args.command ?? '');
    return ENV_IN_COMMAND.test(command) && WRITES.test(command);
  }
  return false;
}

if (blocked()) {
  console.error('Editing .env is blocked in this project. Ask the user to change it themselves.');
  process.exit(2);
}
