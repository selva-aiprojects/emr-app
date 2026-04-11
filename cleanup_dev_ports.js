import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const REPO_PATH = process.cwd().toLowerCase();
const DEV_PORTS = [4005, 5175];
const DEV_PROCESS_HINTS = ['server/index.js', 'vite', 'concurrently'];

function matchesRepoProcess(commandLine = '') {
    const normalized = commandLine.toLowerCase();
    return normalized.includes(REPO_PATH) && DEV_PROCESS_HINTS.some((hint) => normalized.includes(hint));
}

async function getWindowsListeners(port) {
    const script = `
$connections = @(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue)
if ($connections.Count -eq 0) { exit 0 }
$connections |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object {
        $process = Get-CimInstance Win32_Process -Filter "ProcessId = $_" -ErrorAction SilentlyContinue
        if ($process) {
            [PSCustomObject]@{
                pid = $_
                commandLine = $process.CommandLine
            }
        }
    } |
    ConvertTo-Json -Compress
`;

    const { stdout } = await execFileAsync('powershell', ['-NoProfile', '-Command', script], { cwd: process.cwd() });
    const trimmed = stdout.trim();
    if (!trimmed) return [];
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
}

async function killWindowsProcess(pid) {
    await execFileAsync('powershell', ['-NoProfile', '-Command', `Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue`], {
        cwd: process.cwd(),
    });
}

async function getUnixListeners(port) {
    try {
        const { stdout } = await execFileAsync('lsof', ['-ti', `tcp:${port}`], { cwd: process.cwd() });
        const pids = stdout
            .split(/\r?\n/)
            .map((value) => value.trim())
            .filter(Boolean);

        const results = [];
        for (const pid of pids) {
            try {
                const { stdout: cmdline } = await execFileAsync('ps', ['-p', pid, '-o', 'command='], { cwd: process.cwd() });
                results.push({ pid: Number(pid), commandLine: cmdline.trim() });
            } catch {
                // Ignore processes that exit during inspection.
            }
        }
        return results;
    } catch {
        return [];
    }
}

async function killUnixProcess(pid) {
    await execFileAsync('kill', ['-9', String(pid)], { cwd: process.cwd() });
}

async function getListeners(port) {
    if (process.platform === 'win32') {
        return getWindowsListeners(port);
    }
    return getUnixListeners(port);
}

async function killProcess(pid) {
    if (process.platform === 'win32') {
        return killWindowsProcess(pid);
    }
    return killUnixProcess(pid);
}

async function cleanupPort(port) {
    const listeners = await getListeners(port);
    const candidates = listeners.filter((listener) => matchesRepoProcess(listener.commandLine));

    for (const listener of candidates) {
        await killProcess(listener.pid);
        console.log(`Cleared stale dev listener on port ${port} (PID ${listener.pid})`);
    }

    const skipped = listeners.filter((listener) => !matchesRepoProcess(listener.commandLine));
    for (const listener of skipped) {
        console.log(`Left port ${port} listener untouched (PID ${listener.pid}) because it does not look like this repo's dev process`);
    }
}

async function main() {
    for (const port of DEV_PORTS) {
        await cleanupPort(port);
    }
}

main().catch((error) => {
    console.error('Failed to clean dev ports:', error.message);
    process.exit(1);
});

